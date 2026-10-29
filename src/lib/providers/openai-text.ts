import OpenAI from "openai";
import { z } from "zod";
import type { TextGenerationProvider, TextCapabilities, ModelDescriptor, GenerationResult, StructuredTextInput } from "./types";

export const OPENAI_TEXT_MODELS: ModelDescriptor[] = [
  { id: "gpt-4o",       displayName: "GPT-4o" },
  { id: "gpt-4o-mini",  displayName: "GPT-4o mini (faster, cheaper)" },
  { id: "gpt-4-turbo",  displayName: "GPT-4 Turbo" },
];

export class OpenAITextProvider implements TextGenerationProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor(apiKey: string) { this.client = new OpenAI({ apiKey }); }

  async listModels(): Promise<ModelDescriptor[]> { return OPENAI_TEXT_MODELS; }
  async getCapabilities(_modelId: string): Promise<TextCapabilities> {
    return { structuredOutput: true, contextLimit: 128000 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<S extends z.ZodType<any, any, any>>(
    input: StructuredTextInput<S>,
  ): Promise<GenerationResult<z.infer<S>>> {
    let lastError: string | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      const repairNote = attempt > 0 ? `\n\nPrevious attempt invalid: ${lastError}. Return valid JSON only.` : "";
      const response = await this.client.chat.completions.create({
        model: input.modelId,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user",   content: input.userPrompt + repairNote },
        ],
        temperature: 0.7,
      });
      const raw = response.choices[0]?.message?.content ?? "";
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch (e) { lastError = `JSON: ${e}`; continue; }
      const validated = input.schema.safeParse(parsed);
      if (validated.success) {
        return {
          data: validated.data,
          providerJobId: response.id,
          usage: response.usage ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens } : null,
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastError = JSON.stringify((validated as any).error?.issues?.slice(0, 3));
    }
    throw Object.assign(new Error(`OUTPUT_VALIDATION_FAILED: ${lastError}`), { code: "OUTPUT_VALIDATION_FAILED" });
  }
}

export async function testOpenAIKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: 'Reply with exactly: {"ok":true}' }],
      response_format: { type: "json_object" },
      max_tokens: 10,
    });
    return { ok: true, model: res.model };
  } catch (e: unknown) {
    return { ok: false, model: "", error: e instanceof Error ? e.message : String(e) };
  }
}
