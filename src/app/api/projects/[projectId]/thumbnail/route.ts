import { z } from "zod";
import path from "node:path";
import { mkdir, rename } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveImageProvider } from "@/lib/providers/resolve-image";
import { downloadImageToFile } from "@/lib/providers/openai-image";
import { normalizeRoot } from "@/lib/media/paths";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { logger } from "@/lib/logger";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";

const execFileAsync = promisify(execFile);

const thumbnailRequestSchema = z.object({
  style: z
    .enum(["CURIOSITY_SHOCK", "EPIC_CINEMATIC", "DRAMATIC_CONFLICT", "OBJECT_COOKING_HOOK"])
    .default("OBJECT_COOKING_HOOK"),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  customPrompt: z.string().optional(),
  headlineText: z.string().optional(),
});

/**
 * GET /api/projects/[projectId]/thumbnail
 * Fetches the latest saved YouTube thumbnail artifact and full social launch kit.
 */
export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: {
      productionAssets: true,
    },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const launchKit = generateSocialLaunchKit(project);

  const artifact = await prisma.storyArtifact.findFirst({
    where: { projectId: projectId as string, artifactType: "YOUTUBE_THUMBNAIL" },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!artifact || !artifact.versions[0]) {
    return { ok: true, thumbnail: null, launchKit };
  }

  try {
    const data = JSON.parse(artifact.versions[0].contentText);
    return { ok: true, thumbnail: data, launchKit };
  } catch {
    return { ok: true, thumbnail: null, launchKit };
  }
});

/**
 * POST /api/projects/[projectId]/thumbnail
 * Generates a high-CTR YouTube / Reels thumbnail using FLUX.1 (Free).
 */
export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: {
      productionAssets: true,
      scenes: {
        orderBy: { sceneNumber: "asc" },
        take: 5,
      },
    },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = thumbnailRequestSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid thumbnail request");

  const { style, aspectRatio, customPrompt, headlineText } = parsed.data;
  const launchKit = generateSocialLaunchKit(project);

  // 1. Identify key character and location anchors from the Production Bible
  const characters = project.productionAssets.filter((a) => a.assetType === "CHARACTER");
  const locations = project.productionAssets.filter((a) => a.assetType === "LOCATION");

  const leadChar = characters[0];
  let leadCharDesc = "";
  if (leadChar) {
    let attr: any = {};
    try { attr = JSON.parse(leadChar.attributes || "{}"); } catch {}
    leadCharDesc = `${leadChar.name}, ${leadChar.description}${attr.wardrobe ? `, wearing ${attr.wardrobe}` : ""}`;
  }

  const leadLoc = locations[0];
  const leadLocDesc = leadLoc ? leadLoc.description : "cinematic world";

  // 2. Synthesize High-CTR YouTube Prompt
  let styleModifier = "";
  if (style === "OBJECT_COOKING_HOOK") {
    styleModifier =
      aspectRatio === "9:16"
        ? launchKit.thumbnailPrompts.portrait9x16
        : launchKit.thumbnailPrompts.landscape16x9;
  } else if (style === "CURIOSITY_SHOCK") {
    styleModifier = `hyper-viral YouTube thumbnail, ${aspectRatio === "9:16" ? "720x1280 9:16 vertical" : "1280x720 16:9 widescreen"} composition, tight medium close-up of ${leadCharDesc || "lead protagonist"}, intense confident eye contact directly looking into the camera lens, dramatic high-contrast golden-yellow rim lighting, vibrant saturated cinematic grading, deep volumetric shadows, tack-sharp 8k uhd photorealistic, cinematic depth of field, strictly NO eating, NO mouth open, no distorted anatomy, no blurred eyes`;
  } else if (style === "EPIC_CINEMATIC") {
    styleModifier = `epic cinematic YouTube thumbnail, ${aspectRatio === "9:16" ? "720x1280 9:16 vertical" : "1280x720 16:9 widescreen"} composition, heroic dynamic composition of ${leadCharDesc || "lead protagonist"} standing amidst ${leadLocDesc}, breathtaking golden hour atmosphere, deep dramatic shadows, volumetric sun rays, anamorphic lens flare, award-winning National Geographic style cinematography, 8k uhd, ultra-detailed tactile textures, vibrant color saturation`;
  } else {
    // DRAMATIC_CONFLICT
    styleModifier = `high-tension dramatic conflict YouTube thumbnail, ${aspectRatio === "9:16" ? "720x1280 9:16 vertical" : "1280x720 16:9 widescreen"} composition, urgent high-stakes moment, ${leadCharDesc || "lead protagonist"} in high emotional intensity, dramatic teal and orange cinematic color grading, atmospheric smoke and dust particles in the air, intense focused gaze, award-winning movie still, tack-sharp 8k`;
  }

  const finalPrompt = customPrompt && customPrompt.trim().length > 10
    ? `high-CTR viral thumbnail, ${aspectRatio === "9:16" ? "9:16 vertical" : "16:9 widescreen"}, ${customPrompt.trim()}, dramatic rim lighting, vibrant saturated cinematic grading, tack-sharp 8k uhd, strictly NO text, NO watermarks, NO eating`
    : styleModifier;

  const targetWidth = aspectRatio === "9:16" ? 720 : 1280;
  const targetHeight = aspectRatio === "9:16" ? 1280 : 720;

  logger.info({ projectId, style, aspectRatio, prompt: finalPrompt.slice(0, 120) }, "generating YouTube/Reels thumbnail");

  // 3. Resolve Image Provider (Defaults to 100% Free FLUX.1)
  const { provider, modelId } = await resolveImageProvider(ownerId);

  // 4. Generate Thumbnail
  const jobRef = await provider.generate({
    modelId,
    prompt: finalPrompt,
    width: targetWidth,
    height: targetHeight,
  });

  const results = await provider.fetchResults(jobRef.providerJobId);
  const result = results[0];
  if (!result) throw new Error("Image provider returned no results for thumbnail");

  // 5. Ensure media root exists
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({
      data: { ownerId, label: "Default", path: rootPath, isDefault: true },
    });
  }

  // 6. Download and store locally
  const dir = path.join(root.path, "projects", projectId as string, "thumbnails");
  await mkdir(dir, { recursive: true });

  const ext = result.mimeType === "image/jpeg" ? "jpg" : "png";
  const filename = `yt-thumbnail-${aspectRatio.replace(":", "x")}-${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);

  await downloadImageToFile(result.storageKey, absPath);

  // 7. Auto-crop Pollinations corner watermark using FFmpeg if available
  const ffmpeg = process.env.FFMPEG_PATH || "C:\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe";
  try {
    const tempPath = `${absPath}.clean.jpg`;
    const scaleFilter = `scale=${targetWidth}:${targetHeight}:flags=lanczos`;
    await execFileAsync(ffmpeg, [
      "-y",
      "-i", absPath,
      "-vf", `crop=in_w:in_h-42:0:0,${scaleFilter}`,
      "-q:v", "2",
      tempPath,
    ]);
    await rename(tempPath, absPath);
  } catch (cropErr) {
    logger.warn({ err: cropErr }, "Thumbnail watermark crop skipped or failed");
  }

  const checksum = await sha256File(absPath);
  const size = await fileSize(absPath);

  const fileUrl = `/api/media/file?path=${encodeURIComponent(absPath)}`;

  const thumbnailData = {
    thumbnailPath: absPath,
    thumbnailUrl: fileUrl,
    prompt: finalPrompt,
    style,
    aspectRatio,
    headlineText: headlineText || "",
    checksum,
    fileSize: size,
    createdAt: new Date().toISOString(),
  };

  // 8. Save or update StoryArtifact
  let artifact = await prisma.storyArtifact.findFirst({
    where: { projectId: projectId as string, artifactType: "YOUTUBE_THUMBNAIL" },
  });

  if (!artifact) {
    artifact = await prisma.storyArtifact.create({
      data: {
        projectId: projectId as string,
        artifactType: "YOUTUBE_THUMBNAIL",
        approvalStatus: "APPROVED",
      },
    });
  }

  const nextVersion = await prisma.artifactVersion.count({ where: { artifactId: artifact.id } }) + 1;
  const version = await prisma.artifactVersion.create({
    data: {
      artifactId: artifact.id,
      versionNumber: nextVersion,
      contentText: JSON.stringify(thumbnailData),
    },
  });

  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data: { currentVersionId: version.id },
  });

  return {
    ok: true,
    thumbnail: thumbnailData,
    launchKit,
  };
});
