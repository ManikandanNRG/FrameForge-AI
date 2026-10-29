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
  if (!shot.imagePrompt) throw new Error(`Shot ${shotId} has no imagePrompt`);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { provider, modelId } = await resolveImageProvider(project.ownerId);

  logger.info({ projectId, shotId, model: modelId }, "image generation starting");

  // Generate image
  const jobRef = await provider.generate({
    modelId,
    prompt: shot.imagePrompt,
    width: 1024,
    height: 1024,
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
  const filename = `image-v${count + 1}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);

  await downloadImageToFile(result.storageKey, absPath);
  const checksum = await sha256File(absPath);
  const size = await fileSize(absPath);

  const media = await prisma.shotMedia.create({
    data: {
      shotId,
      kind: "STORYBOARD_STILL",
      versionNumber: count + 1,
      filename,
      storagePath: absPath,
      mimeType: "image/png",
      fileSize: size,
      checksum,
      width: result.width ?? 1024,
      height: result.height ?? 1024,
      prompt: shot.imagePrompt,
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
