import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";

const enqueueSchema = z.object({
  jobType: z.literal("ECHO").default("ECHO"),
  message: z.string().max(1000).optional(),
  projectId: z.string().optional(),
});

/** Enqueue a Phase 0 ECHO job to prove the queue+worker end-to-end (no AI calls). */
export const POST = apiHandler(async (req) => {
  await requireUserId();
  const parsed = enqueueSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid job request", parsed.error.issues);
  const { message, projectId } = parsed.data;

  const job = await enqueue({
    jobType: "ECHO",
    requestPayload: { message: message ?? "hello from the studio" },
    projectId: projectId ?? null,
  });
  return { job: { id: job.id, status: job.status, jobType: job.jobType } };
});

export const GET = apiHandler(async (req) => {
  await requireUserId();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const jobs = await prisma.generationJob.findMany({
    where: {
      status: status ?? undefined,
      projectId: projectId ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { jobs };
});
