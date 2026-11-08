import type { GenerationJob } from "@prisma/client";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { resolveImageProvider } from "@/lib/providers/resolve-image";
import { downloadImageToFile } from "@/lib/providers/openai-image";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";
import { mkdir } from "node:fs/promises";
import { logger } from "@/lib/logger";

export async function imageGenerationHandler(
  job: GenerationJob,
): Promise<{ ok: true; mediaId: string }> {
  const payload = JSON.parse(job.requestPayload || "{}") as {
    projectId: string;
    shotId: string;
  };
  const { projectId, shotId } = payload;

  const shot = await prisma.shot.findUnique({ where: { id: shotId } });
  if (!shot) throw new Error(`Shot not found: ${shotId}`);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { provider, modelId } = await resolveImageProvider(project.ownerId);

  logger.info({ projectId, shotId, model: modelId }, "image generation starting");

  // Determine aspect ratio dimensions (vertical 9:16 for mobile, 16:9 for cinematic, or 1:1)
  let width = 1024;
  let height = 1024;
  if (project.aspectRatio === "PORTRAIT_9_16") {
    width = 768;
    height = 1360;
  } else if (project.aspectRatio === "LANDSCAPE_16_9") {
    width = 1280;
    height = 720;
  }

  // Fetch production bible character & location assets for this project to ensure 100% character continuity
  const assets = await prisma.productionAsset.findMany({ where: { projectId } });
  const characterAssets = assets.filter((a) => a.assetType === "CHARACTER");
  const locationAssets = assets.filter((a) => a.assetType === "LOCATION");

  // Detect which character is featured in this shot
  let characterAnchor = "";
  let wardrobeLock = "";
  const shotText = `${shot.actionDescription} ${shot.imagePrompt || ""} ${shot.videoPrompt || ""}`;
  for (const ca of characterAssets) {
    const bTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
    if (
      shotText.includes(bTag) ||
      shotText.includes(`@${ca.name}`) ||
      new RegExp(`\\b${ca.name}\\b`, "i").test(shotText)
    ) {
      let attr: any = {};
      try { attr = JSON.parse(ca.attributes || "{}"); } catch {}
      wardrobeLock = attr.wardrobe || "";
      characterAnchor = `${ca.name}, ${ca.description}${wardrobeLock ? `, strictly wearing ${wardrobeLock}` : ""}`;
      break;
    }
  }

  // Clean raw action description of internal bracket tags
  let actionCleaned = (shot.actionDescription || shot.imagePrompt || "")
    .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .replace(/\((?:wearing|dressed in)[^)]*\)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Location environment
  const locationEnv =
    locationAssets[0]?.description ||
    "dense rural South Indian sugarcane plantation with narrow dusty red dirt pathway";

  // Synthesize master cinematic photographic prompt matching Google Flow / 35mm master quality
  const shotFraming = shot.shotSize
    ? shot.shotSize.toLowerCase().endsWith("shot")
      ? shot.shotSize
      : `${shot.shotSize} Shot`
    : "Medium Shot";
  const lighting =
    shot.lighting ||
    "Warm golden hour natural afternoon sunlight, realistic soft shadows, documentary realism";

  const promptToUse = [
    `A breathtaking 8K photorealistic cinematic documentary film still, ${shotFraming}.`,
    characterAnchor ? `Subject: ${characterAnchor}.` : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${locationEnv}.`,
    `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting}, shallow depth of field, authentic human skin pores with subtle perspiration, Kodak Portra 400 35mm film grain, 24fps motion blur, realistic cloth textile folds.`,
    `Strict Aesthetics: Ultra-photorealistic documentary cinema masterpiece, true-to-life Indian skin tones. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern western clothing.`,
  ]
    .filter(Boolean)
    .join(" ");

  // Generate image
  const jobRef = await provider.generate({
    modelId,
    prompt: promptToUse,
    width,
    height,
  });

  // Fetch result URL
  const results = await provider.fetchResults(jobRef.providerJobId);
  const result = results[0];
  if (!result) throw new Error("Image provider returned no results");

  // Find or create media root
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId: project.ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({
      data: { ownerId: project.ownerId, label: "Default", path: rootPath, isDefault: true },
    });
  }

  // Save file locally
  const dir = path.join(root.path, "projects", projectId, "shots", shotId, "images");
  await mkdir(dir, { recursive: true });

  const count = await prisma.shotMedia.count({ where: { shotId, kind: "STORYBOARD_STILL" } });
  const ext = result.mimeType === "image/jpeg" ? "jpg" : "png";
  const filename = `image-v${count + 1}-${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);

  await downloadImageToFile(result.storageKey, absPath);

  // Clean corner watermark automatically with FFmpeg if present
  const ffmpeg = process.env.FFMPEG_PATH || "C:\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe";
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { rename } = await import("node:fs/promises");
    const execFileAsync = promisify(execFile);
    const tempPath = `${absPath}.clean.jpg`;
    await execFileAsync(ffmpeg, [
      "-y",
      "-i", absPath,
      "-vf", `crop=in_w:in_h-42:0:0,scale=${width}:${height}:flags=lanczos`,
      "-q:v", "2",
      tempPath,
    ]);
    await rename(tempPath, absPath);
  } catch (cropErr) {
    logger.warn({ err: cropErr }, "Watermark crop skipped or failed");
  }

  const checksum = await sha256File(absPath);
  const size = await fileSize(absPath);

  const media = await prisma.shotMedia.create({
    data: {
      shotId,
      kind: "STORYBOARD_STILL",
      versionNumber: count + 1,
      filename,
      storagePath: absPath,
      mimeType: result.mimeType ?? "image/jpeg",
      fileSize: size,
      checksum,
      width: result.width ?? width,
      height: result.height ?? height,
      prompt: promptToUse,
      providerId: provider.id,
      modelId,
      providerJobId: jobRef.providerJobId,
      provenance: "AI_GENERATED",
      approvalStatus: "DRAFT",
    },
  });

  logger.info({ projectId, shotId, mediaId: media.id }, "image generation succeeded");
  return { ok: true, mediaId: media.id };
}
