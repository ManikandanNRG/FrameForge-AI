import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";
import { hasAudioStream, muxAudioOntoVideo } from "@/lib/edit/ffmpeg";
import { synthesizeVoiceover } from "@/lib/media/voiceover";
import { getShotAudioData } from "@/lib/shots/audio-defaults";

/** POST — import an externally generated video clip into a shot (spec §3.5, FR-VIDEO-011). */
export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, shotId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const shot = await prisma.shot.findFirst({
    where: { id: shotId as string, projectId: projectId as string },
    include: { scene: true },
  });
  if (!shot) throw notFound("Shot not found");

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) throw badRequest("file is required");

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    throw badRequest(`Unsupported file type: ${file.type}. Please upload an image (PNG, JPG, WEBP) or video (MP4, WEBM).`);
  }
  if (file.size > 500 * 1024 * 1024) throw badRequest("File too large (max 500 MB)");

  // Find or create a media root for this project
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({ data: { ownerId, label: "Default", path: rootPath, isDefault: true } });
  }

  const subDir = isImage ? "images" : "videos";
  const dir = path.join(root.path, "projects", projectId as string, "shots", shotId as string, subDir);
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop() ?? (isImage ? "jpg" : "mp4");
  const kind = isImage ? "STORYBOARD_STILL" : "VIDEO_CLIP";
  const filename = `${isImage ? "still" : "clip"}-v${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buf);

  let finalPath = absPath;
  let finalFilename = filename;
  let finalChecksum = await sha256File(absPath);
  let finalSize = await fileSize(absPath);

  // If an imported video has no audio track, automatically multiplex the shot's dialogue/voiceover audio
  if (isVideo) {
    try {
      const hasAudio = await hasAudioStream(absPath);
      if (!hasAudio) {
        const audioDir = path.join(root.path, "projects", projectId as string, "shots", shotId as string, "audio");
        const audioFile = path.join(audioDir, "voiceover.mp3");

        if (!existsSync(audioFile)) {
          const audioData = getShotAudioData(
            shot.negativeConstraints,
            shot.scene?.sceneNumber ?? 1,
            shot.shotNumber,
            shot.actionDescription,
          );
          const voiceoverText = audioData.voiceover || audioData.dialogue || shot.actionDescription;
          await synthesizeVoiceover(voiceoverText, audioFile, project.storyLanguage || "en");
        }

        if (existsSync(audioFile)) {
          const muxedFilename = `clip-muxed-v${Date.now()}.mp4`;
          const muxedPath = path.join(dir, muxedFilename);
          const muxResult = await muxAudioOntoVideo(absPath, audioFile, muxedPath);
          if (muxResult.success && existsSync(muxedPath)) {
            finalPath = muxedPath;
            finalFilename = muxedFilename;
            finalChecksum = await sha256File(muxedPath);
            finalSize = await fileSize(muxedPath);
          }
        }
      }
    } catch (e) {
      console.warn("Audio multiplexing warning:", e);
    }
  }

  // Count existing versions of this kind
  const count = await prisma.shotMedia.count({ where: { shotId: shotId as string, kind } });

  const media = await prisma.shotMedia.create({
    data: {
      shotId: shotId as string,
      kind,
      versionNumber: count + 1,
      filename: finalFilename,
      storagePath: finalPath,
      mimeType: file.type,
      fileSize: finalSize,
      checksum: finalChecksum,
      provenance: "MANUAL_IMPORT",
      approvalStatus: "APPROVED",
      modelId: isVideo ? "imported-with-audio" : undefined,
    },
  });

  // Automatically update the shot's selected media
  if (isImage) {
    await prisma.shot.update({
      where: { id: shotId as string },
      data: { selectedStillId: media.id },
    });
  } else {
    await prisma.shot.update({
      where: { id: shotId as string },
      data: { selectedVideoId: media.id },
    });
  }

  return { media: { id: media.id, filename: media.filename, kind: media.kind, versionNumber: media.versionNumber, provenance: media.provenance } };
});
