import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import { isWithinRoot, resolveSafe } from "@/lib/media/paths";

describe("media path safety", () => {
  const root = path.join(os.tmpdir(), "afs-root-test");

  it("accepts paths inside the root", () => {
    expect(isWithinRoot(root, path.join(root, "sub", "file.mp4"))).toBe(true);
  });

  it("rejects paths outside the root", () => {
    expect(isWithinRoot(root, path.join(os.tmpdir(), "other", "file.mp4"))).toBe(false);
    expect(isWithinRoot(root, path.join(root, "..", "escape.mp4"))).toBe(false);
  });

  it("resolveSafe resolves inside the root", () => {
    const resolved = resolveSafe(root, path.join("clips", "a.mp4"));
    expect(resolved.startsWith(root)).toBe(true);
  });

  it("resolveSafe blocks traversal", () => {
    expect(() => resolveSafe(root, path.join("..", "..", "secret.mp4"))).toThrow();
  });

  it("resolveSafe blocks absolute escapes", () => {
    // An absolute path passed as "relative" escapes the root.
    expect(() => resolveSafe(root, path.resolve(os.tmpdir(), "escape.mp4"))).toThrow();
  });

  it("rejects NUL bytes", () => {
    expect(() => resolveSafe(root, "evil\0.mp4")).toThrow();
  });
});
