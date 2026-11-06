import type { GenerationJob } from "@prisma/client";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { resolveVideoProvider } from "@/lib/providers/resolve-video";
import { downloadVideoToFile } from "@/lib/providers/kling-video";
import { resolveLipSyncProvider, LocalMotionProvider, type LipSyncResult } from "@/lib/providers/lipsync";
import { synthesizeVoiceover, generateFallbackAudio } from "@/lib/media/voiceover";
import { getShotAudioData } from "@/lib/shots/audio-defaults";
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
    useLocalMotion?: boolean;
  };
  const { projectId, shotId, useLocalMotion = false } = payload;

  const shot = await prisma.shot.findUnique({
    where: { id: shotId },
    include: { scene: true },
  });
  if (!shot) throw new Error(`Shot not found: ${shotId}`);
  if (!shot.videoPrompt) throw new Error(`Shot ${shotId} has no videoPrompt`);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

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

  let usedProvider = "local-audio-motion";
  let usedModel = "lip-sync-character";
  let providerJobId = "";
  let durationSeconds = Math.round(shot.targetDurationSeconds ?? 5);

  let attemptedKling = false;
  try {
    if (useLocalMotion) {
      throw new Error("Direct in-app motion & speech video generation requested");
    }

    const { provider, modelId } = await resolveVideoProvider(project.ownerId);
    attemptedKling = true;
    logger.info({ projectId, shotId, model: modelId }, "attempting raw video generation via Kling");

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
    usedProvider = provider.id;
    usedModel = modelId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (attemptedKling) {
      logger.warn({ err: msg, shotId }, "Kling video provider unavailable or out of quota; switching to character lip-sync / motion pipeline");
    }

    // Check if shot has a generated storyboard still image
    let still = await prisma.shotMedia.findFirst({
      where: { shotId, kind: "STORYBOARD_STILL" },
      orderBy: { versionNumber: "desc" },
    });

    if (!still) {
      logger.info({ shotId }, "no still image found; auto-generating still image on the fly for video animation");
      try {
        const { imageGenerationHandler } = await import("@/lib/jobs/image-generation-handler");
        const dummyJob = {
          id: `img-auto-${shotId}-${Date.now()}`,
          jobType: "IMAGE_GENERATION",
          projectId,
          requestPayload: JSON.stringify({ projectId, shotId }),
        } as any;
        const imgRes = await imageGenerationHandler(dummyJob);
        still = await prisma.shotMedia.findUnique({ where: { id: imgRes.mediaId } });
      } catch (imgErr) {
        logger.error({ imgErr, shotId }, "failed to auto-generate still image for video");
        throw err;
      }
    }

    if (!still) {
      throw err;
    }

    // Prepare speech audio (guaranteed to exist on disk)
    const audioDir = path.join(root.path, "projects", projectId, "shots", shotId, "audio");
    const ttsPath = path.join(audioDir, "speech.mp3");
    let audioPath = ttsPath;

    const audioData = getShotAudioData(
      shot.negativeConstraints,
      shot.scene.sceneNumber,
      shot.shotNumber,
      shot.actionDescription,
    );
    const speechText = audioData.dialogue || audioData.voiceover || shot.actionDescription;

    try {
      await synthesizeVoiceover(speechText, ttsPath, project.storyLanguage || "en", durationSeconds);
      logger.info({ shotId, audioPath: ttsPath }, "prepared speech audio for video");
    } catch (audioErr) {
      logger.warn({ audioErr, shotId }, "voiceover synthesis failed; generating ambient audio fallback");
      try {
        await generateFallbackAudio(ttsPath, durationSeconds);
      } catch (fbErr) {
        logger.error({ fbErr }, "failed to generate fallback audio");
      }
    }

    // Resolve active Lip-Sync provider (fal.ai LivePortrait → Hedra → Local reactive engine)
    const lipSyncProvider = await resolveLipSyncProvider(project.ownerId);
    logger.info({ shotId, provider: lipSyncProvider.name }, "generating character video");

    let lipSyncResult: LipSyncResult;
    try {
      lipSyncResult = await lipSyncProvider.generateLipSync({
        imagePath: still.storagePath,
        audioPath,
        outputPath: absPath,
        durationSeconds,
        text: speechText,
        prompt: shot.videoPrompt,
      });
    } catch (providerErr) {
      const pMsg = providerErr instanceof Error ? providerErr.message : String(providerErr);
      logger.warn(
        { providerErr: pMsg, provider: lipSyncProvider.name, shotId },
        "Lip-sync provider failed or has insufficient balance; gracefully falling back to local audio-motion engine",
      );
      const localProvider = new LocalMotionProvider();
      lipSyncResult = await localProvider.generateLipSync({
        imagePath: still.storagePath,
        audioPath,
        outputPath: absPath,
        durationSeconds,
        text: speechText,
        prompt: shot.videoPrompt,
      });
    }

    usedProvider = lipSyncResult.providerId;
    usedModel = lipSyncResult.modelId;
    if (lipSyncResult.durationSeconds) durationSeconds = lipSyncResult.durationSeconds;
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
