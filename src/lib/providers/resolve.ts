import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { OpenAITextProvider } from "./openai-text";
import { GEMINI_DEFAULT_MODEL, GeminiTextProvider } from "./gemini-text";
import { OpenRouterTextProvider, OPENROUTER_DEFAULT_MODEL } from "./openrouter-text";
import { MockTextProvider } from "./mock-text";
import type { TextGenerationProvider, StructuredTextInput, GenerationResult } from "./types";
import { logger } from "@/lib/logger";

class ResilientMultiProvider implements TextGenerationProvider {
  readonly id: string;
  private primary: TextGenerationProvider;
  private primaryModel: string;
  private fallback?: TextGenerationProvider;
  private fallbackModel?: string;

  constructor(
    primary: TextGenerationProvider,
    primaryModel: string,
    fallback?: TextGenerationProvider,
    fallbackModel?: string,
  ) {
    this.primary = primary;
    this.primaryModel = primaryModel;
    this.fallback = fallback;
    this.fallbackModel = fallbackModel;
    this.id = primary.id;
  }

  async listModels() { return this.primary.listModels(); }
  async getCapabilities(m: string) { return this.primary.getCapabilities(m); }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<S extends z.ZodType<any, any, any>>(
    input: StructuredTextInput<S>,
  ): Promise<GenerationResult<z.infer<S>>> {
    try {
      return await this.primary.generateStructured({
        ...input,
        modelId: input.modelId || this.primaryModel,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.fallback && this.fallbackModel) {
        logger.warn({ primaryError: msg, fallbackProvider: this.fallback.id }, "primary text provider failed; auto-falling back to secondary provider");
        try {
          return await this.fallback.generateStructured({
            ...input,
            modelId: this.fallbackModel,
          });
        } catch (fallbackErr: any) {
          const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          logger.error({ fallbackError: fallbackMsg }, "fallback provider also failed");
          throw new Error(`AI generation error. Primary (${this.primary.id}): ${msg}. Fallback (${this.fallback.id}): ${fallbackMsg}`);
        }
      }
      throw err;
    }
  }
}

/**
 * Resolve a text provider for a given owner.
 * Priority: Gemini (free tier) with OpenAI fallback if both connected → error.
 * useMock bypasses everything and returns the mock provider.
 */
export async function resolveTextProvider(
  ownerId: string,
  useMock = false,
): Promise<{ provider: TextGenerationProvider; modelId: string }> {
  if (useMock) {
    return { provider: new MockTextProvider(), modelId: "mock-model" };
  }

  const [openrouterConn, geminiConn, openaiConn] = await Promise.all([
    prisma.providerConnection.findFirst({
      where: { ownerId, providerId: "openrouter", isEnabled: true, status: "CONNECTED" },
    }),
    prisma.providerConnection.findFirst({
      where: { ownerId, providerId: "gemini", isEnabled: true, status: "CONNECTED" },
    }),
    prisma.providerConnection.findFirst({
      where: { ownerId, providerId: "openai", isEnabled: true, status: "CONNECTED" },
    }),
  ]);

  const openrouterProvider = openrouterConn
    ? new OpenRouterTextProvider(decryptSecret(openrouterConn.encryptedKey))
    : null;
  const geminiProvider = geminiConn
    ? new GeminiTextProvider(decryptSecret(geminiConn.encryptedKey))
    : null;
  const openaiProvider = openaiConn
    ? new OpenAITextProvider(decryptSecret(openaiConn.encryptedKey))
    : null;

  // Gemini Free Tier (1500 RPD) + OpenRouter Free Tier (200 RPD) resilient pair (100% Zero-Cost)
  if (geminiProvider && openrouterProvider) {
    return {
      provider: new ResilientMultiProvider(
        geminiProvider,
        GEMINI_DEFAULT_MODEL,
        openrouterProvider,
        OPENROUTER_DEFAULT_MODEL,
      ),
      modelId: GEMINI_DEFAULT_MODEL,
    };
  }

  // Gemini + OpenAI resilient pair
  if (geminiProvider && openaiProvider) {
    return {
      provider: new ResilientMultiProvider(
        geminiProvider,
        GEMINI_DEFAULT_MODEL,
        openaiProvider,
        "gpt-4o-mini",
      ),
      modelId: GEMINI_DEFAULT_MODEL,
    };
  }

  if (openrouterProvider) {
    return {
      provider: openrouterProvider,
      modelId: OPENROUTER_DEFAULT_MODEL,
    };
  }

  if (geminiProvider) {
    return {
      provider: geminiProvider,
      modelId: GEMINI_DEFAULT_MODEL,
    };
  }

  if (openaiProvider) {
    return {
      provider: openaiProvider,
      modelId: "gpt-4o-mini",
    };
  }

  throw Object.assign(
    new Error(
      "No AI provider configured. Go to Settings → Providers and add an OpenRouter, Gemini, or OpenAI API key.",
    ),
    { code: "AUTHENTICATION_FAILED" },
  );
}
