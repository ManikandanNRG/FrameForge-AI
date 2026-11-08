import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { OpenAIImageProvider } from "./openai-image";
import { FluxImageProvider } from "./flux-image";
import type { ImageGenerationProvider } from "./types";

/**
 * Resolve an image generation provider for a given owner.
 * Defaults to 100% free open-source FLUX.1 (zero-cost, no key required).
 * If explicitly requested, can use OpenAI DALL-E 3 when a connected key is present.
 */
export async function resolveImageProvider(
  ownerId: string,
  preferred?: "flux" | "openai",
): Promise<{ provider: ImageGenerationProvider; modelId: string }> {
  if (preferred === "openai") {
    const openaiConn = await prisma.providerConnection.findFirst({
      where: { ownerId, providerId: "openai", isEnabled: true, status: "CONNECTED" },
    });
    if (openaiConn) {
      try {
        return {
          provider: new OpenAIImageProvider(decryptSecret(openaiConn.encryptedKey)),
          modelId: "dall-e-3",
        };
      } catch {}
    }
  }

  // Default to 100% free open-source FLUX.1 (zero-cost, no API key required)
  return {
    provider: new FluxImageProvider(),
    modelId: "flux-schnell",
  };
}
