import path from "node:path";

/**
 * Path safety for local media (spec §6.6.4, §12.3). Only paths inside an
 * explicitly registered root may be accessed. Directory traversal, absolute
 * escapes, and symlink/.. tricks are rejected. This is the localhost analogue
 * of the companion's root-scoped access; symlinks are handled lexically for
 * Phase 0 (a follow-up may resolve them with realpath).
 */
export function normalizeRoot(root: string): string {
  return path.resolve(root);
}

export function isWithinRoot(root: string, target: string): boolean {
  const r = path.resolve(root);
  const t = path.resolve(target);
  if (t === r) return true;
  const rel = path.relative(r, t);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/** Resolve a user-supplied relative path against a root, throwing on escape. */
export function resolveSafe(root: string, relative: string): string {
  if (relative.includes("\0")) throw new Error("Invalid path");
  const target = path.resolve(root, relative);
  if (!isWithinRoot(root, target)) {
    throw new Error("Path escapes the allowed media root");
  }
  return target;
}
