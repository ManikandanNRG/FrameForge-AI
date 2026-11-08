import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";

/**
 * POST /api/projects/[projectId]/shots/generate-images
 * Enqueues an IMAGE_GENERATION job for every shot that doesn't yet have
 * an approved or draft AI-generated STORYBOARD_STILL.
 */
export const POST = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = (await _req.json().catch(() => ({}))) as { force?: boolean; shotId?: string };
  const force = body.force ?? false;
  const targetShotId = body.shotId;

  // Get shots with their storyboard stills (filtered by targetShotId if single shot requested)
  const shots = await prisma.shot.findMany({
    where: {
      projectId: projectId as string,
      ...(targetShotId ? { id: targetShotId } : {}),
    },
    include: {
      mediaVersions: { where: { kind: "STORYBOARD_STILL" }, take: 1 },
    },
    orderBy: [{ scene: { sceneNumber: "asc" } }, { shotNumber: "asc" }],
  });

  let shotsNeedingImages: typeof shots = [];

  if (targetShotId) {
    // Single shot explicit on-demand request: always generate for this shot
    shotsNeedingImages = shots;
  } else {
    // Bulk generation: either all (if force) or those without a still yet
    shotsNeedingImages = force
      ? shots.filter((s) => s.imagePrompt || s.actionDescription)
      : shots.filter((s) => s.mediaVersions.length === 0 && (s.imagePrompt || s.actionDescription));

    if (shotsNeedingImages.length === 0) {
      // If all already have images and user clicked button, re-generate all
      shotsNeedingImages = shots.filter((s) => s.imagePrompt || s.actionDescription);
    }
  }

  if (shotsNeedingImages.length === 0) {
    return { queued: 0, message: "No shots found to generate images" };
  }

  const jobs = await Promise.all(
    shotsNeedingImages.map((shot) =>
      enqueue({
        jobType: "IMAGE_GENERATION",
        projectId: projectId as string,
        requestPayload: { projectId: projectId as string, shotId: shot.id },
        idempotencyKey: `img-${shot.id}-${Date.now()}`,
      }),
    ),
  );

  // Execute in Next.js runtime so jobs run immediately without external worker dependency
  setImmediate(async () => {
    const { imageGenerationHandler } = await import("@/lib/jobs/image-generation-handler");
    const { markRunning, markSucceeded, markFailed } = await import("@/lib/jobs/queue");
    for (const job of jobs) {
      try {
        const fresh = await prisma.generationJob.findUnique({ where: { id: job.id } });
        if (fresh && (fresh.status === "QUEUED" || fresh.status === "SUBMITTING")) {
          await markRunning(job.id);
          const result = await imageGenerationHandler(job);
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
