import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { OpenAIImageProvider } from "./openai-image";
import type { ImageGenerationProvider } from "./types";

/**
 * Resolve an image generation provider for a given owner.
 * Currently supports DALL-E 3 via OpenAI connection.
 */
export async function resolveImageProvider(
  ownerId: string,
): Promise<{ provider: ImageGenerationProvider; modelId: string }> {
  const openaiConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "openai", isEnabled: true },
  });
  if (openaiConn) {
    return {
      provider: new OpenAIImageProvider(decryptSecret(openaiConn.encryptedKey)),
      modelId: "dall-e-3",
    };
  }
  throw Object.assign(
    new Error("No image provider configured. Add an OpenAI API key in Settings → Providers to generate storyboard images."),
    { code: "AUTHENTICATION_FAILED" },
  );
}
