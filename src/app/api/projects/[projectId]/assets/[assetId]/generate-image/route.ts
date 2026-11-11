import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveImageProvider } from "@/lib/providers/resolve-image";
import { downloadImageToFile } from "@/lib/providers/openai-image";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { logger } from "@/lib/logger";

/**
 * POST /api/projects/[projectId]/assets/[assetId]/generate-image
 * Generates an ultra-high-definition character portrait or asset reference image
 * using free FLUX.1 (Pollinations), saves it locally, and attaches it as canonical AssetMedia.
 */
export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, assetId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const asset = await prisma.productionAsset.findUnique({
    where: { id: assetId as string },
    include: { mediaAssets: true },
  });
  if (!asset || asset.projectId !== projectId) throw notFound("Asset not found");

  const body = (await req.json().catch(() => ({}))) as { customPrompt?: string };

  let attr: any = {};
  try {
    attr = JSON.parse(asset.attributes || "{}");
  } catch {}

  const isVintage =
    project.visualStyle === "VINTAGE_FILM" ||
    (project.sourceIdea && /1900|vintage|old years|historical|retro|ancient|heritage/i.test(project.sourceIdea));

  const isCulinary =
    project.visualStyle === "CULINARY_MACRO_ASMR" ||
    (project.genre && /culinary|cooking/i.test(project.genre)) ||
    (project.sourceIdea && /cook|recipe|kitchen|knife|food|dish/i.test(project.sourceIdea));

  let promptToUse = body.customPrompt?.trim();

  if (!promptToUse) {
    const charName = asset.name;
    const charDesc = (asset.description || "authentic expressive facial features").replace(/\.+$/, "");
    const wardrobe = attr.wardrobe || (isVintage ? "authentic 1900s traditional hand-spun khadi cotton attire" : "traditional attire");

    if (isVintage) {
      promptToUse = `Authentic 1900s vintage 35mm archival photographic portrait of ${charName}, ${charDesc}, strictly wearing ${wardrobe}. Early 20th-century vintage portrait, soft warm sepia and muted earth tones, authentic cellulose film grain, period-accurate natural daylight, gentle optical bloom, authentic hand-spun khadi textile weave. Ultra-photorealistic documentary portrait masterpiece. Strictly NO modern 4K digital crispness, NO modern collared shirts, NO modern buttoned clothing, NO modern western fashion, NO modern buildings or concrete, NO CGI, NO 3D animation, NO plastic skin.`;
    } else if (isCulinary) {
      promptToUse = `Master culinary chef macro portrait of ${charName}, ${charDesc}, wearing ${wardrobe || "crisp linen chef apron with rolled sleeves"}. Warm directional kitchen lighting, authentic natural skin texture, clean chef presentation, shallow depth of field, 85mm portrait lens. Master food photography award winner, authentic human hands, crisp textures. Strictly NO CGI, NO 3D render, NO extra limbs, NO distorted hands.`;
    } else {
      promptToUse = attr.googleFlowCharacterPrompt ||
        `Ultra-photorealistic cinematic master portrait of ${charName}, ${charDesc}, wearing ${wardrobe}. Shot on 35mm master prime lens, natural golden hour lighting, authentic human skin pores, Kodak Portra film grain, soft bokeh background, 8k resolution cinematic master portrait.`;
    }
  }

  const finalPrompt: string = promptToUse || "Master cinematic portrait";

  const { provider, modelId } = await resolveImageProvider(project.ownerId);

  logger.info({ projectId, assetId, model: modelId }, "character portrait generation starting");

  // Generate 1:1 portrait (1024x1024)
  const jobRef = await provider.generate({
    modelId,
    prompt: finalPrompt,
    width: 1024,
    height: 1024,
  });

  const results = await provider.fetchResults(jobRef.providerJobId);
  const result = results[0];
  if (!result) throw new Error("Image provider returned no results");

  // Locate or create media root
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId: project.ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({
      data: { ownerId: project.ownerId, label: "Default", path: rootPath, isDefault: true },
    });
  }

  // Ensure storage folder exists
  const dir = path.join(root.path, "projects", projectId as string, "characters", assetId as string);
  await mkdir(dir, { recursive: true });

  const ext = result.mimeType === "image/jpeg" ? "jpg" : "png";
  const filename = `character-${asset.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);

  await downloadImageToFile(result.storageKey, absPath);

  // Clean corner watermark with FFmpeg if available
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
      "-vf", "crop=in_w:in_h-42:0:0,scale=1024:1024:flags=lanczos",
      "-q:v", "2",
      tempPath,
    ]);
    await rename(tempPath, absPath);
  } catch (cropErr) {
    logger.warn({ err: cropErr }, "Watermark crop skipped or failed");
  }

  const [csum, size] = await Promise.all([sha256File(absPath), fileSize(absPath)]);

  // Reset previously canonical media
  await prisma.assetMedia.updateMany({
    where: { assetId: assetId as string, isCanonical: true },
    data: { isCanonical: false },
  });

  // Create new canonical AssetMedia record
  const media = await prisma.assetMedia.create({
    data: {
      assetId: assetId as string,
      filename,
      storagePath: absPath,
      mimeType: ext === "jpg" ? "image/jpeg" : "image/png",
      fileSize: size,
      checksum: csum,
      isCanonical: true,
      source: "AI_GENERATED",
      providerId: provider.id,
      modelId,
      prompt: finalPrompt,
    },
  });

  // Attach canonicalMediaId to production asset
  await prisma.productionAsset.update({
    where: { id: assetId as string },
    data: { canonicalMediaId: media.id },
  });

  const imageUrl = `/api/media/file?path=${encodeURIComponent(absPath)}&v=${media.id}`;

  return {
    ok: true,
    mediaId: media.id,
    storagePath: absPath,
    imageUrl,
    prompt: finalPrompt,
  };
});
