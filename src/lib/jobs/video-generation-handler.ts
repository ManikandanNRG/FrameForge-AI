import type { GenerationJob } from "@prisma/client";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { resolveVideoProvider } from "@/lib/providers/resolve-video";
import { downloadVideoToFile } from "@/lib/providers/kling-video";
import { animateStillToVideo } from "@/lib/media/animate";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";
import { mkdir } from "node:fs/promises";
import { logger } from "@/lib/logger";

const POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 10 * 60 * 1000; // 10 minutes

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function videoGenerationHandler(
  job: GenerationJob,
): Promise<{ ok: true; mediaId: string }> {
  const payload = JSON.parse(job.requestPayload || "{}") as {
    projectId: string;
    shotId: string;
  };
  const { projectId, shotId } = payload;

  const shot = await prisma.shot.findUnique({ where: { id: shotId } });
  if (!shot) throw new Error(`Shot not found: ${shotId}`);
  if (!shot.videoPrompt) throw new Error(`Shot ${shotId} has no videoPrompt`);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { provider, modelId } = await resolveVideoProvider(project.ownerId);

  logger.info({ projectId, shotId, model: modelId }, "video generation starting");

  // Find or create media root
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId: project.ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({
      data: { ownerId: project.ownerId, label: "Default", path: rootPath, isDefault: true },
    });
  }

  const dir = path.join(root.path, "projects", projectId, "shots", shotId, "videos");
  await mkdir(dir, { recursive: true });

  const count = await prisma.shotMedia.count({ where: { shotId, kind: "VIDEO_CLIP" } });
  const filename = `video-v${count + 1}-${Date.now()}.mp4`;
  const absPath = path.join(dir, filename);

  let usedProvider = provider.id;
  let usedModel = modelId;
  let providerJobId = "";
  let durationSeconds = Math.round(shot.targetDurationSeconds ?? 5);

  try {
    // Attempt AI video generation via provider (e.g. Kling AI)
    const jobRef = await provider.submit({
      modelId,
      prompt: shot.videoPrompt,
      durationSeconds,
      aspectRatio: shot.aspectRatio ?? "16:9",
    });
    providerJobId = jobRef.providerJobId;

    // Poll until done
    const deadline = Date.now() + MAX_WAIT_MS;
    let status = await provider.getJob(jobRef.providerJobId);

    while (status.state === "PENDING" || status.state === "RUNNING") {
      if (Date.now() > deadline) throw new Error("Video generation timed out after 10 minutes");
      await sleep(POLL_INTERVAL_MS);
      status = await provider.getJob(jobRef.providerJobId);
      logger.info({ shotId, state: status.state, progress: status.progressPercent }, "video poll");
    }

    if (status.state !== "SUCCEEDED") {
      throw Object.assign(
        new Error(`Video generation failed: ${status.errorCode ?? "UNKNOWN"}`),
        { code: status.errorCode ?? "PROVIDER_UNAVAILABLE" },
      );
    }

    // Download result
    const results = await provider.fetchResults(jobRef.providerJobId);
    const result = results[0];
    if (!result) throw new Error("Video provider returned no results");

    await downloadVideoToFile(result.storageKey, absPath);
    if (result.durationSeconds) durationSeconds = result.durationSeconds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg, shotId }, "Kling video provider unavailable or out of quota; checking storyboard still fallback");

    // Check if shot has a generated storyboard still image
    const still = await prisma.shotMedia.findFirst({
      where: { shotId, kind: "STORYBOARD_STILL" },
      orderBy: { versionNumber: "desc" },
    });

    if (!still) {
      // Re-throw if no still is available to animate
      throw err;
    }

    // Fall back to animating the approved storyboard still into a 1080p MP4 clip via FFmpeg
    logger.info({ shotId, stillPath: still.storagePath }, "rendering video clip from storyboard still with FFmpeg");
    await animateStillToVideo(still.storagePath, absPath, durationSeconds, 1920, 1080);
    usedProvider = "local-motion";
    usedModel = "ffmpeg-cinematic-render";
  }

  const checksum = await sha256File(absPath);
  const size = await fileSize(absPath);

  const media = await prisma.shotMedia.create({
    data: {
      shotId,
      kind: "VIDEO_CLIP",
      versionNumber: count + 1,
      filename,
      storagePath: absPath,
      mimeType: "video/mp4",
      fileSize: size,
      checksum,
      width: 1920,
      height: 1080,
      durationSeconds,
      prompt: shot.videoPrompt,
      providerId: usedProvider,
      modelId: usedModel,
      providerJobId,
      provenance: "AI_GENERATED",
      approvalStatus: "DRAFT",
    },
  });

  // Update shot's selected video
  await prisma.shot.update({
    where: { id: shotId },
    data: { selectedVideoId: media.id },
  });

  logger.info({ projectId, shotId, mediaId: media.id }, "video generation succeeded");
  return { ok: true, mediaId: media.id };
}
