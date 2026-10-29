import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { OpenAITextProvider } from "./openai-text";
import { GEMINI_DEFAULT_MODEL, GeminiTextProvider } from "./gemini-text";
import { MockTextProvider } from "./mock-text";
import type { TextGenerationProvider } from "./types";

/**
 * Resolve a text provider for a given owner.
 * Priority: Gemini (free tier) → OpenAI → error.
 * useMock bypasses everything and returns the mock provider.
 */
export async function resolveTextProvider(
  ownerId: string,
  useMock = false,
): Promise<{ provider: TextGenerationProvider; modelId: string }> {
  if (useMock) {
    return { provider: new MockTextProvider(), modelId: "mock-model" };
  }

  // Try Gemini first (free tier available)
  const geminiConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "gemini", isEnabled: true },
  });
  if (geminiConn) {
    return {
      provider: new GeminiTextProvider(decryptSecret(geminiConn.encryptedKey)),
      modelId: GEMINI_DEFAULT_MODEL,
    };
  }

  // Fallback to OpenAI
  const openaiConn = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId: "openai", isEnabled: true },
  });
  if (openaiConn) {
    return {
      provider: new OpenAITextProvider(decryptSecret(openaiConn.encryptedKey)),
      modelId: "gpt-4o-mini",
    };
  }

  throw Object.assign(
    new Error(
      "No AI provider configured. Go to Settings → Providers and add a Gemini or OpenAI API key.",
    ),
    { code: "AUTHENTICATION_FAILED" },
  );
}
