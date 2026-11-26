import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";
import type {
  TextGenerationProvider, TextCapabilities,
  ModelDescriptor, GenerationResult, StructuredTextInput,
} from "./types";

/**
 * Google Gemini text generation adapter.
 * Prioritizes active Gemini 3.x Flash models with strict per-call timeouts,
 * bounded retries, and live ListModels fallback discovery.
 */

export const GEMINI_TEXT_MODELS: ModelDescriptor[] = [
  { id: "gemini-3-flash-preview", displayName: "Gemini 3 Flash ✓ (Default Primary Model)" },
  { id: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash (Fast Generation Model)" },
  { id: "gemini-3.1-flash-lite-preview", displayName: "Gemini 3.1 Flash-Lite (High-Quota Fallback)" },
  { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (Legacy Fallback)" },
];

export const GEMINI_DEFAULT_MODEL = "gemini-3-flash-preview";

const PER_CALL_TIMEOUT_MS = 18_000;
const TOTAL_BUDGET_MS = 32_000;

function extractJsonText(raw: string): string {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const stripped = withoutThink
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return stripped.slice(firstBrace, lastBrace + 1);
  }
  return stripped;
}

async function generateWithTimeout(
  model: GenerativeModel,
  prompt: string,
  timeoutMs: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      model.generateContent(prompt, { timeout: timeoutMs }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Queries Gemini's ListModels endpoint to discover live models that support
 * generateContent for this API key, prioritizing standard Flash text models.
 */
async function discoverGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(6_000) }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const usable = (json.models || [])
      .filter((m) => m.name && (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name!.replace(/^models\//, ""))
      .filter(
        (name) =>
          !/embedding|aqa|imagen|veo|tts|robotics|omni|transcribe|image|lyria|antigravity|deep-research|computer-use|nano-banana/i.test(
            name
          )
      );

    usable.sort((a, b) => {
      const score = (id: string) =>
        (/gemini-3.*flash/i.test(id) ? 0 : /flash/i.test(id) ? 1 : 2);
      const diff = score(a) - score(b);
      if (diff !== 0) return diff;
      return b.localeCompare(a);
    });
    return usable.slice(0, 3);
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
      "gemini-3-flash-preview",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite-preview",
      "gemini-2.5-flash",
    ].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

    let lastError: string | null = null;
    let discovered = false;
    const deadline = Date.now() + TOTAL_BUDGET_MS;

    for (let idx = 0; idx < candidateModels.length && idx < 5; idx++) {
      if (Date.now() >= deadline) {
        lastError = lastError || "Gemini provider timeout budget exceeded";
        break;
      }

      const activeModelId = candidateModels[idx];
      for (let attempt = 0; attempt <= 1; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining < 2000) break;

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

          const response = await generateWithTimeout(
            model,
            input.userPrompt + repairNote,
            Math.min(PER_CALL_TIMEOUT_MS, remaining)
          );
          const raw = response.response.text();
          const cleaned = extractJsonText(raw);

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
          if (
            msg.includes("503") ||
            msg.includes("high demand") ||
            msg.includes("429") ||
            msg.includes("timed out")
          ) {
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
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
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
      const result = await generateWithTimeout(
        model,
        'Reply with exactly: {"ok":true}',
        10_000
      );
      const text = result.response.text();
      if (text) return { ok: true, model: modelId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if ((msg.includes("404") || msg.includes("not found")) && !discovered) {
        discovered = true;
        const live = await discoverGeminiModels(apiKey);
        for (const m of live) {
          if (!candidates.includes(m)) candidates.push(m);
        }
        continue;
      }
      if (msg.includes("404") || msg.includes("not found")) continue;
      return { ok: false, model: "", error: msg };
    }
  }

  return { ok: false, model: "", error: "No compatible Gemini model found for this API key." };
}
