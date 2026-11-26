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
  { id: "openrouter/free", displayName: "OpenRouter Auto Free ✓ (Always-Available Free Router)" },
  { id: "google/gemma-4-31b-it:free", displayName: "Gemma 4 31B [100% Free] ✓" },
  { id: "google/gemma-4-26b-a4b-it:free", displayName: "Gemma 4 26B [100% Free] ✓" },
  { id: "nvidia/nemotron-3.5-super-vl:free", displayName: "Nemotron 3.5 Super [100% Free] ✓" },
  { id: "openai/gpt-4o-mini", displayName: "GPT-4o mini (Paid, optional)" },
  { id: "deepseek/deepseek-chat", displayName: "DeepSeek V3 (Paid, optional)" },
];

export const OPENROUTER_DEFAULT_MODEL = "openrouter/free";

const OPENROUTER_TIMEOUT_MS = 18_000;
const OPENROUTER_TOTAL_BUDGET_MS = 32_000;

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
    const hasImages = Boolean(input.attachments && input.attachments.length > 0);
    // Prioritize fast vision-capable free models when images are attached
    const candidateModels = (
      hasImages
        ? [
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free",
            "nvidia/nemotron-3.5-super-vl:free",
            input.modelId,
          ]
        : [
            input.modelId,
            "openrouter/free",
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free",
          ]
    ).filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);

    let lastError: string | null = null;
    const deadline = Date.now() + OPENROUTER_TOTAL_BUDGET_MS;

    for (const activeModelId of candidateModels) {
      if (Date.now() >= deadline) {
        lastError = lastError || "OpenRouter timeout budget exceeded";
        break;
      }

      let useJsonMode = true;
      for (let attempt = 0; attempt <= 1; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining < 2000) break;

        try {
          const repairNote =
            attempt > 0
              ? `\n\nPrevious attempt note: ${lastError}. Return ONLY valid JSON with no extra prose.`
              : "";

          const userContent: OpenAI.Chat.Completions.ChatCompletionUserMessageParam["content"] =
            hasImages
              ? [
                  { type: "text", text: input.userPrompt + repairNote },
                  ...input.attachments!.map((att) => ({
                    type: "image_url" as const,
                    image_url: { url: `data:${att.mimeType};base64,${att.base64Data}` },
                  })),
                ]
              : input.userPrompt + repairNote;

          const response = await this.client.chat.completions.create(
            {
              model: activeModelId,
              ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
              messages: [
                { role: "system", content: input.systemPrompt },
                { role: "user", content: userContent },
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
          if (useJsonMode && (lastError.includes("400") || lastError.includes("response_format"))) {
            // Some free upstream models don't support response_format; retry once without it
            useJsonMode = false;
            continue;
          }
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

/** Test an OpenRouter API key — uses openrouter/free first, falls back to free models. */
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

  const testModels = ["openrouter/free", "google/gemma-4-31b-it:free", "openai/gpt-4o-mini"];
  let lastErr = "";

  for (const model of testModels) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: 'Reply with JSON: {"ok":true}' }],
        max_tokens: 30,
      });

      return { ok: true, model: res.model || model };
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (
        lastErr.includes("402") ||
        lastErr.includes("404") ||
        lastErr.includes("429") ||
        lastErr.includes("credit") ||
        lastErr.includes("balance")
      ) {
        continue;
      }
      return { ok: false, model: "", error: lastErr };
    }
  }

  return { ok: false, model: "", error: lastErr };
}
