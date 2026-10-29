import { z } from "zod";
import type { TextGenerationProvider, TextCapabilities, ModelDescriptor, GenerationResult, StructuredTextInput } from "./types";

export class MockTextProvider implements TextGenerationProvider {
  readonly id = "mock";
  async listModels(): Promise<ModelDescriptor[]> {
    return [{ id: "mock-model", displayName: "Mock (test only — no AI call)" }];
  }
  async getCapabilities(_modelId: string): Promise<TextCapabilities> {
    return { structuredOutput: true, contextLimit: 4096 };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async generateStructured<S extends z.ZodType<any, any, any>>(
    input: StructuredTextInput<S>,
  ): Promise<GenerationResult<z.infer<S>>> {
    const fixture = buildFixture(input.schema);
    return { data: fixture as z.infer<S>, providerJobId: "mock-001", usage: { promptTokens: 10, completionTokens: 20 } };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFixture(schema: z.ZodType<any, any, any>): unknown {
  if (schema instanceof z.ZodObject) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = (schema as z.ZodObject<any>).shape as Record<string, z.ZodType<any, any, any>>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(shape)) out[k] = buildFixture(v);
    return out;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (schema instanceof z.ZodArray) return [buildFixture((schema as z.ZodArray<any>).element)];
  if (schema instanceof z.ZodString)  return "Mock content";
  if (schema instanceof z.ZodNumber)  return 1;
  if (schema instanceof z.ZodBoolean) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (schema instanceof z.ZodOptional) return buildFixture((schema as z.ZodOptional<any>).unwrap());
  return null;
}
