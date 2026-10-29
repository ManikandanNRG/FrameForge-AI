import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { sha256File, fileSize } from "@/lib/media/checksum";
import { normalizeRoot } from "@/lib/media/paths";

/** POST — import an externally generated video clip into a shot (spec §3.5, FR-VIDEO-011). */
export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, shotId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const shot = await prisma.shot.findFirst({ where: { id: shotId as string, projectId: projectId as string } });
  if (!shot) throw notFound("Shot not found");

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) throw badRequest("file is required");

  const allowed = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowed.includes(file.type)) throw badRequest(`Unsupported type: ${file.type}`);
  if (file.size > 500 * 1024 * 1024) throw badRequest("File too large (max 500 MB)");

  // Find or create a media root for this project
  let root = await prisma.mediaRoot.findFirst({ where: { ownerId } });
  if (!root) {
    const rootPath = normalizeRoot("./media");
    root = await prisma.mediaRoot.create({ data: { ownerId, label: "Default", path: rootPath, isDefault: true } });
  }

  const dir = path.join(root.path, "projects", projectId as string, "shots", shotId as string);
  await mkdir(dir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "mp4";
  const filename = `clip-v${Date.now()}.${ext}`;
  const absPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buf);

  const checksum = await sha256File(absPath);
  const size = await fileSize(absPath);

  // Count existing video versions
  const count = await prisma.shotMedia.count({ where: { shotId: shotId as string, kind: "VIDEO_CLIP" } });

  const media = await prisma.shotMedia.create({
    data: {
      shotId: shotId as string,
      kind: "VIDEO_CLIP",
      versionNumber: count + 1,
      filename,
      storagePath: absPath,
      mimeType: file.type,
      fileSize: size,
      checksum,
      provenance: "MANUAL_IMPORT",
      approvalStatus: "DRAFT",
    },
  });

  return { media: { id: media.id, filename: media.filename, versionNumber: media.versionNumber, provenance: media.provenance } };
});
