import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import type { LipSyncProvider } from "./types";
import { FalLivePortraitProvider } from "./fal-liveportrait";
import { HedraLipSyncProvider } from "./hedra";
import { KlingLipSyncProvider } from "./kling-lipsync";
import { LocalMotionProvider } from "./local-motion";

export * from "./types";
export * from "./fal-liveportrait";
export * from "./hedra";
export * from "./local-motion";

/**
 * Resolves the active Lip-Sync / Character Talking provider for a given user.
 * Priority:
 * 1. fal.ai (LivePortrait) — Recommended & Ultra-cheap (~$0.01/gen)
 * 2. Hedra — Expressive Character Dialogue API
 * 3. Kling Lip-Sync — If funded
 * 4. Local Audio-Motion Engine — Built-in $0 fallback with authentic speech audio
 */
export async function resolveLipSyncProvider(ownerId: string): Promise<LipSyncProvider> {
  // Check fal.ai from DB or environment
  const falConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "fal", isEnabled: true },
  });
  if (falConn) {
    return new FalLivePortraitProvider(decryptSecret(falConn.encryptedKey));
  }
  const envFalKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (envFalKey) {
    return new FalLivePortraitProvider(envFalKey);
  }

  // Check Hedra
  const hedraConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "hedra", isEnabled: true },
  });
  if (hedraConn) {
    return new HedraLipSyncProvider(decryptSecret(hedraConn.encryptedKey));
  }

  // Check Kling
  const klingConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "kling", isEnabled: true },
  });
  if (klingConn) {
    return new KlingLipSyncProvider(decryptSecret(klingConn.encryptedKey));
  }

  // Default to built-in local engine
  return new LocalMotionProvider();
}

