import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";
import type {
  TextGenerationProvider, TextCapabilities,
  ModelDescriptor, GenerationResult, StructuredTextInput,
} from "./types";

/**
 * Google Gemini text generation adapter.
 * Uses the official @google/generative-ai SDK with automatic ListModels fallback
 * so deprecated or retired model IDs never break generation.
 */

export const GEMINI_TEXT_MODELS: ModelDescriptor[] = [
  { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash ✓ (Default Primary Model)" },
  { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash (Fast Fallback Model)" },
  { id: "gemini-2.5-flash-lite", displayName: "Gemini 2.5 Flash-Lite (High-Quota Fallback)" },
];

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Queries Gemini's ListModels endpoint to discover live models that support
 * generateContent for this API key, prioritizing Flash models.
 */
async function discoverGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const usable = (json.models || [])
      .filter((m) => m.name && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name!.replace(/^models\//, ""))
      .filter((name) => !/embedding|aqa|imagen|veo|tts|robotics/i.test(name));

    // Sort flash models first, newest versions first
    usable.sort((a, b) => {
      const aFlash = /flash/i.test(a) ? 0 : 1;
      const bFlash = /flash/i.test(b) ? 0 : 1;
      if (aFlash !== bFlash) return aFlash - bFlash;
      return b.localeCompare(a);
    });
    return usable.slice(0, 8);
  } catch {
    return [];
  }
}

export class GeminiTextProvider implements TextGenerationProvider {
  readonly id = "gemini";
  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
    const candidateModels = [
      input.modelId,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash-lite",
    ].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

    let lastError: string | null = null;
    let discovered = false;

    for (let idx = 0; idx < candidateModels.length; idx++) {
      const activeModelId = candidateModels[idx];
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const model: GenerativeModel = this.client.getGenerativeModel({
            model: activeModelId,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
            systemInstruction: input.systemPrompt,
          });

          const repairNote = attempt > 0
            ? `\n\nPrevious attempt produced invalid output: ${lastError}. Return valid JSON only.`
            : "";

          const response = await model.generateContent(input.userPrompt + repairNote);
          const raw = response.response.text();

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
        } catch (apiErr: any) {
          const msg = apiErr instanceof Error ? apiErr.message : String(apiErr);
          lastError = msg;
          if (msg.includes("404") || msg.includes("not found")) {
            if (!discovered) {
              discovered = true;
              const liveModels = await discoverGeminiModels(this.apiKey);
              for (const m of liveModels) {
                if (!candidateModels.includes(m)) candidateModels.push(m);
              }
            }
            break;
          }
          if (msg.includes("503") || msg.includes("high demand") || msg.includes("429")) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            break;
          }
        }
      }
    }

    throw Object.assign(
      new Error(`GEMINI_GENERATION_FAILED: ${lastError}`),
      { code: "OUTPUT_VALIDATION_FAILED" },
    );
  }
}

/** Test a Gemini API key — tries current Flash models and discovers live models if needed. */
export async function testGeminiKey(
  apiKey: string,
): Promise<{ ok: boolean; model: string; error?: string }> {
  const candidates = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
  ];

  const client = new GoogleGenerativeAI(apiKey);
  let discovered = false;

  for (let i = 0; i < candidates.length; i++) {
    const modelId = candidates[i];
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
      if (msg.includes("404") || msg.includes("not found")) {
        if (!discovered) {
          discovered = true;
          const liveModels = await discoverGeminiModels(apiKey);
          for (const m of liveModels) {
            if (!candidates.includes(m)) candidates.push(m);
          }
        }
        continue;
      }
      return { ok: false, model: "", error: msg };
    }
  }

  return { ok: false, model: "", error: "No compatible Gemini model found for this API key" };
}
