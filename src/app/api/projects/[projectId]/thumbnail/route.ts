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

const execFileAsync = promisify(execFile);

const thumbnailRequestSchema = z.object({
  style: z.enum(["CURIOSITY_SHOCK", "EPIC_CINEMATIC", "DRAMATIC_CONFLICT"]).default("CURIOSITY_SHOCK"),
  customPrompt: z.string().optional(),
  headlineText: z.string().optional(),
});

/**
 * GET /api/projects/[projectId]/thumbnail
 * Fetches the latest saved YouTube thumbnail artifact for this project.
 */
export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    select: { id: true, ownerId: true },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

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
    return { ok: true, thumbnail: null };
  }

  try {
    const data = JSON.parse(artifact.versions[0].contentText);
    return { ok: true, thumbnail: data };
  } catch {
    return { ok: true, thumbnail: null };
  }
});

/**
 * POST /api/projects/[projectId]/thumbnail
 * Generates a high-CTR 1280x720 YouTube thumbnail using FLUX.1 (Free).
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

  const { style, customPrompt, headlineText } = parsed.data;

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
  if (style === "CURIOSITY_SHOCK") {
    styleModifier = `hyper-viral YouTube thumbnail, 1280x720 16:9 widescreen composition, extreme close-up to medium shot of ${leadCharDesc || "lead protagonist"}, intensely expressive face filled with dramatic shock, awe, and wide open eyes, mouth slightly agape in utter disbelief, looking slightly off-camera, dramatic high-contrast golden-yellow rim lighting, vibrant saturated cinematic grading, deep volumetric shadows, clean negative space on the right third for bold YouTube headline text overlay, tack-sharp 8k uhd photorealistic, cinematic depth of field, no distorted anatomy, no blurred eyes`;
  } else if (style === "EPIC_CINEMATIC") {
    styleModifier = `epic cinematic YouTube thumbnail, 1280x720 16:9 widescreen composition, heroic dynamic composition of ${leadCharDesc || "lead protagonist"} standing amidst ${leadLocDesc}, breathtaking golden hour atmosphere, deep dramatic shadows, volumetric sun rays, anamorphic lens flare, award-winning National Geographic style cinematography, 8k uhd, ultra-detailed tactile textures, vibrant color saturation, perfectly balanced negative space on side for bold title`;
  } else {
    // DRAMATIC_CONFLICT
    styleModifier = `high-tension dramatic conflict YouTube thumbnail, 1280x720 16:9 widescreen composition, urgent high-stakes moment, ${leadCharDesc || "lead protagonist"} in high emotional intensity, dramatic teal and orange cinematic color grading, atmospheric smoke and dust particles in the air, intense focused gaze, award-winning movie still, tack-sharp 8k`;
  }

  const finalPrompt = customPrompt && customPrompt.trim().length > 10
    ? `high-CTR YouTube thumbnail, 1280x720 16:9 widescreen, ${customPrompt.trim()}, dramatic rim lighting, vibrant saturated cinematic grading, tack-sharp 8k uhd, no blurry faces`
    : styleModifier;

  logger.info({ projectId, style, prompt: finalPrompt.slice(0, 120) }, "generating YouTube thumbnail");

  // 3. Resolve Image Provider (Defaults to 100% Free FLUX.1)
  const { provider, modelId } = await resolveImageProvider(ownerId);

  // 4. Generate Thumbnail (1280x720, 16:9 YouTube Standard)
  const jobRef = await provider.generate({
    modelId,
    prompt: finalPrompt,
    width: 1280,
    height: 720,
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
  const filename = `yt-thumbnail-${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);

  await downloadImageToFile(result.storageKey, absPath);

  // 7. Auto-crop Pollinations corner watermark using FFmpeg if available
  const ffmpeg = process.env.FFMPEG_PATH || "C:\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe";
  try {
    const tempPath = `${absPath}.clean.jpg`;
    await execFileAsync(ffmpeg, [
      "-y",
      "-i", absPath,
      "-vf", "crop=in_w:in_h-42:0:0,scale=1280:720:flags=lanczos",
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
  };
});

