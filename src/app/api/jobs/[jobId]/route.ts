import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { jobId } = await ctx.params;
  const job = await prisma.generationJob.findUnique({ where: { id: jobId as string } });
  if (!job) throw notFound("Job not found");

  // Ownership check via project
  if (job.projectId) {
    const project = await prisma.project.findUnique({ where: { id: job.projectId } });
    if (project && project.ownerId !== ownerId) throw forbidden();
  }

  // If job is queued, ensure it gets picked up immediately in Next.js runtime
  if (job.status === "QUEUED") {
    setImmediate(async () => {
      try {
        const { markRunning, markSucceeded, markFailed } = await import("@/lib/jobs/queue");
        const fresh = await prisma.generationJob.findUnique({ where: { id: job.id } });
        if (fresh && fresh.status === "QUEUED") {
          await markRunning(job.id);
          let result: unknown;
          if (job.jobType === "VIDEO_GENERATION") {
            const { videoGenerationHandler } = await import("@/lib/jobs/video-generation-handler");
            result = await videoGenerationHandler(fresh);
          } else if (job.jobType === "IMAGE_GENERATION") {
            const { imageGenerationHandler } = await import("@/lib/jobs/image-generation-handler");
            result = await imageGenerationHandler(fresh);
          }
          if (result) await markSucceeded(job.id, result as Record<string, unknown>);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { markFailed } = await import("@/lib/jobs/queue");
        await markFailed(job.id, { code: "GENERATION_FAILED", message: msg, retryable: false }).catch(() => {});
      }
    });
  }

  return { job };
});
