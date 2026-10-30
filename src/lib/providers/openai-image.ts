import OpenAI from "openai";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type {
  ImageGenerationProvider, ImageCapabilities,
  ModelDescriptor, CostEstimate, ImageInput,
  ProviderJobReference, ProviderJobStatus, ProviderMediaResult,
} from "./types";

export const DALLE_MODELS: ModelDescriptor[] = [
  { id: "dall-e-3", displayName: "DALL·E 3 (1024×1024, best quality)" },
  { id: "dall-e-2", displayName: "DALL·E 2 (faster, cheaper)" },
];

export class OpenAIImageProvider implements ImageGenerationProvider {
  readonly id = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async listModels(): Promise<ModelDescriptor[]> { return DALLE_MODELS; }

  async getCapabilities(_modelId: string): Promise<ImageCapabilities> {
    return { maxWidth: 1024, maxHeight: 1024, formats: ["png", "jpeg"], supportsImageInput: false };
  }

  async estimateCost(input: ImageInput): Promise<CostEstimate> {
    const amountMinor = input.modelId === "dall-e-3" ? 4 : 2; // cents
    return {
      providerId: "openai", modelId: input.modelId,
      amountMinor, currency: "USD", basis: "per image",
      isEstimate: true, pricingSource: "https://openai.com/pricing",
      pricingVerifiedAt: "2024-01-01",
    };
  }

  /**
   * DALL-E is synchronous — generate returns the image URL immediately.
   * We use a fake jobId so the interface remains async-compatible.
   */
  async generate(input: ImageInput): Promise<ProviderJobReference> {
    const size = (input.modelId === "dall-e-3") ? "1024x1024" : "512x512";
    const response = await this.client.images.generate({
      model: input.modelId,
      prompt: input.prompt.slice(0, 4000),
      n: 1,
      size: size as "1024x1024" | "512x512",
    });
    const item = response.data?.[0];
    const target = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
    if (!target) throw new Error("DALL-E returned no image URL or b64 data");
    // Encode the URL or data as the job ID so fetchResults can download it
    return { providerJobId: Buffer.from(target).toString("base64") };
  }

  async getJob(_jobId: string): Promise<ProviderJobStatus> {
    // DALL-E is synchronous; if we have a jobId it already succeeded
    return { state: "SUCCEEDED", progressPercent: 100, errorCode: null };
  }

  async fetchResults(jobId: string): Promise<ProviderMediaResult[]> {
    const url = Buffer.from(jobId, "base64").toString("utf8");
    // Return the URL as storageKey — the handler will download it
    return [{ storageKey: url, mimeType: "image/png", width: 1024, height: 1024, durationSeconds: null }];
  }
}

/** Download an image URL (or decode data URL) and save to localPath. Returns file size in bytes. */
export async function downloadImageToFile(url: string, localPath: string): Promise<number> {
  await mkdir(path.dirname(localPath), { recursive: true });
  if (url.startsWith("data:")) {
    const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");
    await writeFile(localPath, buf);
    return buf.length;
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Image download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(localPath, buf);
  return buf.length;
}
