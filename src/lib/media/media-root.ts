import { access, mkdir, readdir, statfs } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { normalizeRoot, resolveSafe } from "./paths";
import { sha256File, fileSize } from "./checksum";

export interface RootAvailability {
  online: boolean;
  freeBytes: number | null;
  reason?: string;
}

export async function listRoots(ownerId: string) {
  return prisma.mediaRoot.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" } });
}

export async function addRoot(ownerId: string, label: string, rootPath: string) {
  const abs = normalizeRoot(rootPath);
  // Ensure the folder exists; create it if missing so first-run works out of the box.
  await mkdir(abs, { recursive: true });
  return prisma.mediaRoot.create({ data: { ownerId, label, path: abs } });
}

export async function removeRoot(ownerId: string, rootId: string) {
  // Removes the DB reference only; never deletes files on disk (spec §6.6.9).
  return prisma.mediaRoot.deleteMany({ where: { id: rootId, ownerId } });
}

/** Report online/offline status + free space for a root (spec §6.6.2, FR-MEDIA-009). */
export async function rootAvailability(rootPath: string): Promise<RootAvailability> {
  try {
    await access(rootPath);
    let freeBytes: number | null = null;
    try {
      const s = await statfs(rootPath);
      freeBytes = s.bavail * s.bsize;
    } catch {
      // statfs not supported on this platform/path; online is still true.
    }
    return { online: true, freeBytes };
  } catch {
    return { online: false, freeBytes: null, reason: "Drive disconnected or folder missing" };
  }
}

export interface MediaEntry {
  name: string;
  type: "file" | "dir";
  size?: number;
}

export async function listFiles(rootPath: string, sub = ""): Promise<MediaEntry[]> {
  const dir = resolveSafe(rootPath, sub);
  const entries = await readdir(dir, { withFileTypes: true });
  const result: MediaEntry[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isFile()) {
      result.push({ name: e.name, type: "file", size: await fileSize(full) });
    } else if (e.isDirectory()) {
      result.push({ name: e.name, type: "dir" });
    }
  }
  return result.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
}

export async function fileChecksum(rootPath: string, sub: string) {
  const full = resolveSafe(rootPath, sub);
  return { path: sub, sha256: await sha256File(full), size: await fileSize(full) };
}
