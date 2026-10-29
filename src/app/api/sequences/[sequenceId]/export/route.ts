import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";
import { findFfmpeg } from "@/lib/edit/ffmpeg";

const bodySchema = z.object({
  filename:     z.string().optional(),
  width:        z.number().int().optional(),
  height:       z.number().int().optional(),
  frameRate:    z.number().optional(),
  videoBitrate: z.string().optional(),
  audioBitrate: z.string().optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { sequenceId } = await ctx.params;
  const seq = await prisma.editSequence.findUnique({ where: { id: sequenceId as string }, include: { project: true } });
  if (!seq) throw notFound();
  if (seq.project.ownerId !== ownerId) throw forbidden();

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid export settings");

  // Check FFmpeg availability before queuing
  if (!findFfmpeg()) {
    throw badRequest(
      "FFmpeg is not installed or not found in PATH. " +
      "Download from https://ffmpeg.org/download.html and set FFMPEG_PATH in your .env file."
    );
  }

  const exportJob = await prisma.exportJob.create({
    data: {
      projectId: seq.projectId,
      editSequenceId: seq.id,
      status: "QUEUED",
      exportSettings: JSON.stringify(parsed.data),
    },
  });

  const job = await enqueue({
    jobType: "EXPORT",
    idempotencyKey: `export-${exportJob.id}`,
    requestPayload: { exportJobId: exportJob.id },
    projectId: seq.projectId,
  });

  return { exportJobId: exportJob.id, jobId: job.id, status: "QUEUED" };
});

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { sequenceId } = await ctx.params;
  const seq = await prisma.editSequence.findUnique({ where: { id: sequenceId as string }, include: { project: true } });
  if (!seq) throw notFound();
  if (seq.project.ownerId !== ownerId) throw forbidden();

  const exports = await prisma.exportJob.findMany({
    where: { editSequenceId: sequenceId as string },
    orderBy: { createdAt: "desc" },
  });
  return { exports };
});
