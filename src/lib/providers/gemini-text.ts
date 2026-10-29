import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";
import type {
  TextGenerationProvider, TextCapabilities,
  ModelDescriptor, GenerationResult, StructuredTextInput,
} from "./types";

/**
 * Google Gemini text generation adapter — updated to current model IDs (Oct 2026).
 * Uses the official @google/generative-ai SDK.
 * Free tier available at aistudio.google.com — no billing needed for Flash models.
 */

export const GEMINI_TEXT_MODELS: ModelDescriptor[] = [
  { id: "gemini-3.5-flash-lite", displayName: "Gemini 3.5 Flash-Lite ✓ (verified working)" },
  { id: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash-Lite ✓ (verified working)" },
];

export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

export class GeminiTextProvider implements TextGenerationProvider {
  readonly id = "gemini";
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async listModels(): Promise<ModelDescriptor[]> {
    return GEMINI_TEXT_MODELS;
  }

  async getCapabilities(_modelId: string): Promise<TextCapabilities> {
    return { structuredOutput: true, contextLimit: 1000000 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<S extends z.ZodType<any, any, any>>(
    input: StructuredTextInput<S>,
  ): Promise<GenerationResult<z.infer<S>>> {
    const model: GenerativeModel = this.client.getGenerativeModel({
      model: input.modelId,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
      systemInstruction: input.systemPrompt,
    });

    let lastError: string | null = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      const repairNote = attempt > 0
        ? `\n\nPrevious attempt produced invalid output: ${lastError}. Return valid JSON only.`
        : "";

      const response = await model.generateContent(input.userPrompt + repairNote);
      const raw = response.response.text();

      // Strip markdown fences if present
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        lastError = `JSON parse failed: ${e}`;
        continue;
      }

      const validated = input.schema.safeParse(parsed);
      if (validated.success) {
        return {
          data: validated.data,
          providerJobId: null,
          usage: null,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastError = JSON.stringify((validated as any).error?.issues?.slice(0, 3));
    }

    throw Object.assign(
      new Error(`OUTPUT_VALIDATION_FAILED after repair attempts: ${lastError}`),
      { code: "OUTPUT_VALIDATION_FAILED" },
    );
  }
}

/** Test a Gemini API key — uses the cheapest available model. */
export async function testGeminiKey(
  apiKey: string,
): Promise<{ ok: boolean; model: string; error?: string }> {
  // Try models in order until one works
  const candidates = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  const client = new GoogleGenerativeAI(apiKey);

  for (const modelId of candidates) {
    try {
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent('Reply with exactly: {"ok":true}');
      const text = result.response.text();
      if (text.includes("true")) {
        return { ok: true, model: modelId };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // If 404 (model not found for this key tier), try next
      if (msg.includes("404") || msg.includes("not found")) continue;
      // Any other error (auth, quota) — report immediately
      return { ok: false, model: "", error: msg };
    }
  }

  return { ok: false, model: "", error: "No compatible Gemini model found for this API key" };
}
