import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { OpenAIImageProvider } from "./openai-image";
import { FluxImageProvider } from "./flux-image";
import type { ImageGenerationProvider } from "./types";

/**
 * Resolve an image generation provider for a given owner.
 * If an active, verified OpenAI connection exists, use DALL-E 3.
 * Otherwise, default to free, open-source FLUX.1 (zero-cost, no key required).
 */
export async function resolveImageProvider(
  ownerId: string,
): Promise<{ provider: ImageGenerationProvider; modelId: string }> {
  const openaiConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "openai", isEnabled: true, status: "CONNECTED" },
  });
  if (openaiConn) {
    return {
      provider: new OpenAIImageProvider(decryptSecret(openaiConn.encryptedKey)),
      modelId: "dall-e-3",
    };
  }

  // Default to 100% free open-source FLUX.1
  return {
    provider: new FluxImageProvider(),
    modelId: "flux-schnell",
  };
}
