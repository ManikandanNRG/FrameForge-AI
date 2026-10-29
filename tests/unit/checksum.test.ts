import { describe, it, expect, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { sha256File, fileSize } from "@/lib/media/checksum";

describe("checksum", () => {
  let dir: string;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("computes the correct SHA-256 of a file", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "afs-cksum-"));
    const file = path.join(dir, "clip.bin");
    const content = "AI filmmaking studio phase 0";
    await writeFile(file, content, "utf8");

    const expected = createHash("sha256").update(content).digest("hex");
    const got = await sha256File(file);
    expect(got).toBe(expected);
    expect(await fileSize(file)).toBe(Buffer.byteLength(content, "utf8"));
  });
});
