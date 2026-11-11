import type { GenerationJob } from "@prisma/client";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { TimelineSchema, validateTimeline } from "@/lib/edit/timeline";
import { renderTimeline, probeMedia } from "@/lib/edit/ffmpeg";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";
import { mkdir } from "node:fs/promises";

export async function exportHandler(job: GenerationJob): Promise<{ ok: true; outputPath: string }> {
  const payload = JSON.parse(job.requestPayload || "{}") as { exportJobId: string };
  const { exportJobId } = payload;

  const exportJob = await prisma.exportJob.findUnique({
    where: { id: exportJobId },
    include: { sequence: true },
  });
  if (!exportJob) throw new Error(`ExportJob not found: ${exportJobId}`);

  await prisma.exportJob.update({ where: { id: exportJobId }, data: { status: "VALIDATING", startedAt: new Date() } });

  // Parse + validate timeline
  const rawTimeline = JSON.parse(exportJob.sequence.timelineJson || "{}");
  const parsed = TimelineSchema.safeParse(rawTimeline);
  if (!parsed.success) {
    await prisma.exportJob.update({ where: { id: exportJobId }, data: { status: "FAILED", errorMessage: "Invalid timeline schema" } });
    throw new Error("Invalid timeline schema");
  }
  const { errors } = validateTimeline(parsed.data);
  if (errors.length) {
    await prisma.exportJob.update({ where: { id: exportJobId }, data: { status: "FAILED", errorMessage: errors.join("; ") } });
    throw new Error(errors.join("; "));
  }

  await prisma.exportJob.update({ where: { id: exportJobId }, data: { status: "RENDERING" } });

  // Output path (resolve owner user id from project)
  const project = await prisma.project.findUnique({ where: { id: exportJob.projectId } });
  const rootRecord = (project?.ownerId
    ? await prisma.mediaRoot.findFirst({ where: { ownerId: project.ownerId } })
    : null) ?? { path: normalizeRoot("./media") };

  const outputDir = path.join(rootRecord.path, "exports", exportJob.projectId);
  await mkdir(outputDir, { recursive: true });

  const settings = JSON.parse(exportJob.exportSettings || "{}") as { filename?: string };
  const filename = settings.filename ?? `export-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, filename);

  const renderResult = await renderTimeline(parsed.data, { outputPath });

  if (!renderResult.success) {
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: "FAILED", errorMessage: renderResult.error ?? "Render failed", finishedAt: new Date() },
    });
    throw new Error(renderResult.error);
  }

  const checksum = await sha256File(outputPath);
  const size = await fileSize(outputPath);
  const probe = await probeMedia(outputPath) as Record<string, Record<string, unknown>> | null;
  const duration = probe?.format ? Number(probe.format.duration) : undefined;

  await prisma.exportJob.update({
    where: { id: exportJobId },
    data: {
      status: "SUCCEEDED",
      outputPath,
      outputFilename: filename,
      outputFileSize: size,
      outputChecksum: checksum,
      durationSeconds: duration,
      finishedAt: new Date(),
    },
  });

  return { ok: true, outputPath };
}
