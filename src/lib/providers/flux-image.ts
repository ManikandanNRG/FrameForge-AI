import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type {
  ImageGenerationProvider, ImageCapabilities,
  ModelDescriptor, CostEstimate, ImageInput,
  ProviderJobReference, ProviderJobStatus, ProviderMediaResult,
} from "./types";

export const FLUX_MODELS: ModelDescriptor[] = [
  { id: "flux-schnell", displayName: "FLUX.1 Schnell (Fast, Photorealistic, Free)" },
];

/**
 * Free open-source FLUX.1 image generation provider via Pollinations.ai.
 * Requires zero API key and zero credit card.
 */
export class FluxImageProvider implements ImageGenerationProvider {
  readonly id = "flux";

  async listModels(): Promise<ModelDescriptor[]> {
    return FLUX_MODELS;
  }

  async getCapabilities(_modelId: string): Promise<ImageCapabilities> {
    return {
      maxWidth: 1024,
      maxHeight: 1024,
      formats: ["jpeg", "png"],
      supportsImageInput: false,
    };
  }

  async estimateCost(input: ImageInput): Promise<CostEstimate> {
    return {
      providerId: "flux",
      modelId: input.modelId,
      amountMinor: 0,
      currency: "USD",
      basis: "free tier",
      isEstimate: false,
      pricingSource: "https://pollinations.ai",
      pricingVerifiedAt: "2026-10-30",
    };
  }

  async generate(input: ImageInput): Promise<ProviderJobReference> {
    const seed = Math.floor(Math.random() * 1_000_000);
    const width = input.width ?? 1024;
    const height = input.height ?? 1024;
    const cleanPrompt = encodeURIComponent(input.prompt.slice(0, 1000));
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true`;

    return { providerJobId: Buffer.from(imageUrl).toString("base64") };
  }

  async getJob(_jobId: string): Promise<ProviderJobStatus> {
    return { state: "SUCCEEDED", progressPercent: 100, errorCode: null };
  }

  async fetchResults(jobId: string): Promise<ProviderMediaResult[]> {
    const url = Buffer.from(jobId, "base64").toString("utf8");
    return [
      {
        storageKey: url,
        mimeType: "image/jpeg",
        width: 1024,
        height: 1024,
        durationSeconds: null,
      },
    ];
  }
}

/** Download an image URL (supports Pollinations, OpenAI, or data URI) to localPath */
export async function downloadFluxImageToFile(url: string, localPath: string): Promise<number> {
  await mkdir(path.dirname(localPath), { recursive: true });
  if (url.startsWith("data:")) {
    const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");
    await writeFile(localPath, buf);
    return buf.length;
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) {
    throw new Error(`Flux image download failed: ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(localPath, buf);
  return buf.length;
}
