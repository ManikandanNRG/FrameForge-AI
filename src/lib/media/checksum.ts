import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

/** SHA-256 of a file, streamed so large media doesn't load into memory (spec §6.6.1, §6.6.6). */
export async function sha256File(absPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(absPath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export async function fileSize(absPath: string): Promise<number> {
  const s = await stat(absPath);
  return s.size;
}
