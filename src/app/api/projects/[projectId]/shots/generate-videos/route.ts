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

  // Check Kling provider is configured
  const conn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "kling", isEnabled: true },
  });
  if (!conn) throw badRequest("Kling AI credentials required for video generation. Add them in Settings → Providers.");

  // Get all shots that don't yet have a video clip
  const shots = await prisma.shot.findMany({
    where: { projectId: projectId as string },
    include: {
      mediaVersions: { where: { kind: "VIDEO_CLIP" }, take: 1 },
    },
    orderBy: [{ scene: { sceneNumber: "asc" } }, { shotNumber: "asc" }],
  });

  const shotsNeedingVideo = shots.filter(
    (s) => s.mediaVersions.length === 0 && s.videoPrompt,
  );

  if (shotsNeedingVideo.length === 0) {
    return { queued: 0, message: "All shots already have videos" };
  }

  const jobs = await Promise.all(
    shotsNeedingVideo.map((shot) =>
      enqueue({
        jobType: "VIDEO_GENERATION",
        projectId: projectId as string,
        requestPayload: { projectId: projectId as string, shotId: shot.id },
        idempotencyKey: `vid-${shot.id}-${Date.now()}`,
      }),
    ),
  );

  // Update project stage to GENERATION
  await prisma.project.update({
    where: { id: projectId as string },
    data: { currentStage: "GENERATION" },
  });

  return { queued: jobs.length, jobIds: jobs.map((j) => j.id) };
});
