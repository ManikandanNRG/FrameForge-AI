import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";

/**
 * POST /api/projects/[projectId]/shots/generate-videos
 * Enqueues a VIDEO_GENERATION job for every shot that doesn't yet have a VIDEO_CLIP.
 */
export const POST = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = (await _req.json().catch(() => ({}))) as {
    force?: boolean;
    shotId?: string;
    useLocalMotion?: boolean;
  };
  const force = body.force ?? true; // Default to allow regeneration when requested
  const singleShotId = body.shotId;
  const useLocalMotion = body.useLocalMotion ?? true;

  // Get all shots with their video clips
  const shots = await prisma.shot.findMany({
    where: {
      projectId: projectId as string,
      ...(singleShotId ? { id: singleShotId } : {}),
    },
    include: {
      mediaVersions: { where: { kind: "VIDEO_CLIP" }, take: 1 },
    },
    orderBy: [{ scene: { sceneNumber: "asc" } }, { shotNumber: "asc" }],
  });

  // If force is true or all shots have videos, regenerate all shots
  let targetShots = force
    ? shots.filter((s) => s.videoPrompt || s.imagePrompt)
    : shots.filter((s) => s.mediaVersions.length === 0 && (s.videoPrompt || s.imagePrompt));

  if (targetShots.length === 0) {
    // If none are missing, re-generate all shots
    targetShots = shots.filter((s) => s.videoPrompt || s.imagePrompt);
  }

  if (targetShots.length === 0) {
    return { queued: 0, message: "No shots found to generate" };
  }

  const jobs = await Promise.all(
    targetShots.map((shot) =>
      enqueue({
        jobType: "VIDEO_GENERATION",
        projectId: projectId as string,
        requestPayload: { projectId: projectId as string, shotId: shot.id, useLocalMotion },
        idempotencyKey: `vid-${shot.id}-${Date.now()}`,
      }),
    ),
  );

  // Update project stage to GENERATION
  await prisma.project.update({
    where: { id: projectId as string },
    data: { currentStage: "GENERATION" },
  });

  // Ensure execution starts immediately with latest code in Next.js runtime
  setImmediate(async () => {
    const { videoGenerationHandler } = await import("@/lib/jobs/video-generation-handler");
    const { markRunning, markSucceeded, markFailed } = await import("@/lib/jobs/queue");
    for (const job of jobs) {
      try {
        const fresh = await prisma.generationJob.findUnique({ where: { id: job.id } });
        if (fresh && (fresh.status === "QUEUED" || fresh.status === "SUBMITTING")) {
          await markRunning(job.id);
          const result = await videoGenerationHandler(job);
          await markSucceeded(job.id, result);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await markFailed(job.id, { code: "GENERATION_FAILED", message: msg, retryable: false }).catch(() => {});
      }
    }
  });

  return { queued: jobs.length, jobIds: jobs.map((j) => j.id) };
});
