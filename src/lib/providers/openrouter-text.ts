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
  { id: "deepseek/deepseek-r1:free",              displayName: "DeepSeek R1 [100% Free] ✓ (High Reasoning)" },
  { id: "qwen/qwen-2.5-72b-instruct:free",        displayName: "Qwen 2.5 72B [100% Free] ✓" },
  { id: "mistralai/mistral-small-24b-instruct-2501:free", displayName: "Mistral Small 24B [100% Free] ✓" },
  { id: "openai/gpt-4o-mini",                     displayName: "GPT-4o mini (Paid, optional)" },
  { id: "deepseek/deepseek-chat",                 displayName: "DeepSeek V3 (Paid, optional)" },
];

export const OPENROUTER_DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export class OpenRouterTextProvider implements TextGenerationProvider {
  readonly id = "openrouter";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
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
    const candidateModels = [
      input.modelId,
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-lite:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "mistralai/mistral-small-24b-instruct-2501:free",
      "openai/gpt-4o-mini",
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    let lastError: string | null = null;

    for (const activeModelId of candidateModels) {
      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const repairNote =
            attempt > 0
              ? `\n\nPrevious attempt produced invalid output: ${lastError}. Return valid JSON only.`
              : "";

          const response = await this.client.chat.completions.create({
            model: activeModelId,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: input.systemPrompt },
              { role: "user", content: input.userPrompt + repairNote },
            ],
            temperature: 0.7,
          });

          const raw = response.choices[0]?.message?.content ?? "";
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
          break; // Switch to next candidate model
        }
      }
    }

    throw Object.assign(
      new Error(`OPENROUTER_GENERATION_FAILED: ${lastError}`),
      { code: "OUTPUT_VALIDATION_FAILED" },
    );
  }
}

/** Test an OpenRouter API key — tests gpt-4o-mini first, falls back to free model if zero balance. */
export async function testOpenRouterKey(
  apiKey: string,
): Promise<{ ok: boolean; model: string; error?: string }> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
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
      // If 402 payment required or credits exhausted, test the free model next
      if (lastErr.includes("402") || lastErr.includes("credit") || lastErr.includes("balance")) {
        continue;
      }
      return { ok: false, model: "", error: lastErr };
    }
  }

  return { ok: false, model: "", error: lastErr };
}

