import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * AES-256-GCM encryption for provider API keys stored in the DB (spec §8.17, §12.2).
 * Key is derived from APP_ENCRYPTION_KEY env var; falls back to SESSION_SECRET
 * so Phase 1 localhost works without a separate key.
 * Never logged, never returned to clients.
 */

function getDerivedKey(): Buffer {
  const src = process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET || "";
  if (!src || src.length < 16) throw new Error("No encryption key configured");
  return scryptSync(src, "afs-provider-key-v1", 32);
}

export function encryptSecret(plain: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: hex(iv):hex(tag):hex(ciphertext)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(blob: string): string {
  const parts = blob.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const [ivHex, tagHex, encHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}
