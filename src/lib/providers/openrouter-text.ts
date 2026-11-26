import OpenAI from "openai";
import { z } from "zod";
import type {
  TextGenerationProvider,
  TextCapabilities,
  ModelDescriptor,
  GenerationResult,
  StructuredTextInput,
} from "./types";

export const OPENROUTER_TEXT_MODELS: ModelDescriptor[] = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", displayName: "Llama 3.3 70B [100% Free] ✓ (Flagship Open Weights)" },
  { id: "google/gemini-2.0-flash-lite:free",       displayName: "Gemini 2.0 Flash Lite [100% Free] ✓ (Ultra Fast)" },
  { id: "qwen/qwen-2.5-72b-instruct:free",        displayName: "Qwen 2.5 72B [100% Free] ✓" },
  { id: "mistralai/mistral-small-24b-instruct-2501:free", displayName: "Mistral Small 24B [100% Free] ✓" },
  { id: "deepseek/deepseek-r1:free",              displayName: "DeepSeek R1 [100% Free] ✓ (High Reasoning)" },
  { id: "openai/gpt-4o-mini",                     displayName: "GPT-4o mini (Paid, optional)" },
  { id: "deepseek/deepseek-chat",                 displayName: "DeepSeek V3 (Paid, optional)" },
];

export const OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const OPENROUTER_TIMEOUT_MS = 20_000;
const OPENROUTER_TOTAL_BUDGET_MS = 35_000;

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

export class OpenRouterTextProvider implements TextGenerationProvider {
  readonly id = "openrouter";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      timeout: OPENROUTER_TIMEOUT_MS,
      maxRetries: 0,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Filmmaking Studio",
      },
    });
  }

  async listModels(): Promise<ModelDescriptor[]> {
    return OPENROUTER_TEXT_MODELS;
  }

  async getCapabilities(_modelId: string): Promise<TextCapabilities> {
    return { structuredOutput: true, contextLimit: 128000 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<S extends z.ZodType<any, any, any>>(
    input: StructuredTextInput<S>,
  ): Promise<GenerationResult<z.infer<S>>> {
    // Prioritize fast non-thinking free models first so chat never stalls for minutes
    const candidateModels = [
      input.modelId,
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-lite:free",
      "qwen/qwen-2.5-72b-instruct:free",
    ].filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

    let lastError: string | null = null;
    const deadline = Date.now() + OPENROUTER_TOTAL_BUDGET_MS;

    for (const activeModelId of candidateModels) {
      if (Date.now() >= deadline) {
        lastError = lastError || "OpenRouter timeout budget exceeded";
        break;
      }

      for (let attempt = 0; attempt <= 1; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining < 2000) break;

        try {
          const repairNote =
            attempt > 0
              ? `\n\nPrevious attempt produced invalid output: ${lastError}. Return valid JSON only.`
              : "";

          const response = await this.client.chat.completions.create(
            {
              model: activeModelId,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: input.systemPrompt },
                { role: "user", content: input.userPrompt + repairNote },
              ],
              temperature: 0.7,
            },
            { timeout: Math.min(OPENROUTER_TIMEOUT_MS, remaining) }
          );

          const raw = response.choices[0]?.message?.content ?? "";
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
              providerJobId: response.id,
              usage: response.usage
                ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                  }
                : null,
            };
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lastError = JSON.stringify((validated as any).error?.issues?.slice(0, 3));
        } catch (apiErr: any) {
          lastError = apiErr instanceof Error ? apiErr.message : String(apiErr);
          break; // Switch to next candidate model immediately
        }
      }
    }

    throw Object.assign(
      new Error(`OPENROUTER_GENERATION_FAILED: ${lastError}`),
      { code: "OUTPUT_VALIDATION_FAILED" },
    );
  }
}

/** Test an OpenRouter API key — tests fast free model first, falls back if zero balance. */
export async function testOpenRouterKey(
  apiKey: string,
): Promise<{ ok: boolean; model: string; error?: string }> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 12_000,
    maxRetries: 0,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Filmmaking Studio",
    },
  });

  const testModels = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-lite:free", "openai/gpt-4o-mini"];
  let lastErr = "";

  for (const model of testModels) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: 'Reply with JSON: {"ok":true}' }],
        response_format: { type: "json_object" },
        max_tokens: 20,
      });

      return { ok: true, model: res.model || model };
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (lastErr.includes("402") || lastErr.includes("credit") || lastErr.includes("balance")) {
        continue;
      }
      return { ok: false, model: "", error: lastErr };
    }
  }

  return { ok: false, model: "", error: lastErr };
}
