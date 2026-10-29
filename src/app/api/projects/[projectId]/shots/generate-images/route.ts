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

  // Check provider is configured
  const conn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "openai", isEnabled: true },
  });
  if (!conn) throw badRequest("OpenAI API key required for image generation. Add it in Settings → Providers.");

  // Get all shots that don't yet have a storyboard still
  const shots = await prisma.shot.findMany({
    where: { projectId: projectId as string },
    include: {
      mediaVersions: { where: { kind: "STORYBOARD_STILL" }, take: 1 },
    },
    orderBy: [{ scene: { sceneNumber: "asc" } }, { shotNumber: "asc" }],
  });

  const shotsNeedingImages = shots.filter(
    (s) => s.mediaVersions.length === 0 && s.imagePrompt,
  );

  if (shotsNeedingImages.length === 0) {
    return { queued: 0, message: "All shots already have images" };
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

  return { queued: jobs.length, jobIds: jobs.map((j) => j.id) };
});
