import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { KlingVideoProvider } from "./kling-video";
import type { VideoGenerationProvider } from "./types";

/**
 * Resolve a video generation provider for a given owner.
 * Priority: Kling → error.
 */
export async function resolveVideoProvider(
  ownerId: string,
): Promise<{ provider: VideoGenerationProvider; modelId: string }> {
  const klingConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "kling", isEnabled: true },
  });
  if (klingConn) {
    return {
      provider: new KlingVideoProvider(decryptSecret(klingConn.encryptedKey)),
      modelId: "kling-v1",
    };
  }
  throw Object.assign(
    new Error("No video provider configured. Add Kling AI credentials in Settings → Providers to generate video clips."),
    { code: "AUTHENTICATION_FAILED" },
  );
}
