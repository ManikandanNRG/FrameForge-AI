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

  return { job };
});
