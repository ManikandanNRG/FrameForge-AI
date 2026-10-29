import { createHmac } from "node:crypto";
import type {
  VideoGenerationProvider, VideoCapabilities,
  ModelDescriptor, CostEstimate, VideoInput,
  ProviderJobReference, ProviderJobStatus, ProviderMediaResult,
} from "./types";

const KLING_BASE = "https://api.klingai.com";

export const KLING_VIDEO_MODELS: ModelDescriptor[] = [
  { id: "kling-v1",       displayName: "Kling v1 (standard)" },
  { id: "kling-v1-5",     displayName: "Kling v1.5 (higher quality)" },
  { id: "kling-v1-pro",   displayName: "Kling v1 Pro" },
];

function makeJwt(accessKey: string, secretKey: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })).toString("base64url");
  const sig = createHmac("sha256", secretKey).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export class KlingVideoProvider implements VideoGenerationProvider {
  readonly id = "kling";
  private accessKey: string;
  private secretKey: string;

  constructor(credentials: string) {
    // credentials stored as "accessKey:secretKey"
    const [ak, sk] = credentials.split(":");
    this.accessKey = ak;
    this.secretKey = sk;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${makeJwt(this.accessKey, this.secretKey)}`,
    };
  }

  async listModels(): Promise<ModelDescriptor[]> { return KLING_VIDEO_MODELS; }

  async getCapabilities(_modelId: string): Promise<VideoCapabilities> {
    return {
      durationsSeconds: [5, 10],
      aspectRatios: ["16:9", "9:16", "1:1"],
      resolutions: ["720p", "1080p"],
      supportsAudio: false,
      asyncJob: true,
    };
  }

  async estimateCost(input: VideoInput): Promise<CostEstimate> {
    const secs = input.durationSeconds ?? 5;
    return {
      providerId: "kling", modelId: input.modelId,
      amountMinor: secs <= 5 ? 14 : 28, // ~$0.14 per 5s
      currency: "USD", basis: "per clip",
      isEstimate: true, pricingSource: "https://klingai.com/pricing",
      pricingVerifiedAt: "2024-10-01",
    };
  }

  async submit(input: VideoInput): Promise<ProviderJobReference> {
    const body = {
      model_name: input.modelId,
      prompt: input.prompt.slice(0, 2500),
      negative_prompt: input.durationSeconds ? undefined : undefined,
      cfg_scale: 0.5,
      mode: "std",
      duration: String(input.durationSeconds ?? 5),
      aspect_ratio: input.aspectRatio ?? "16:9",
    };
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json() as { code: number; message: string; data?: { task_id: string } };
    if (data.code !== 0 || !data.data?.task_id) {
      throw Object.assign(new Error(`Kling submit failed: ${data.message}`), { code: "PROVIDER_UNAVAILABLE" });
    }
    return { providerJobId: data.data.task_id };
  }

  async getJob(jobId: string): Promise<ProviderJobStatus> {
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video/${jobId}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json() as {
      code: number; message: string;
      data?: { task_status: string; task_status_msg?: string; task_result?: { videos?: Array<{ url: string; duration: string }> } };
    };
    if (data.code !== 0) throw new Error(`Kling getJob failed: ${data.message}`);
    const status = data.data?.task_status ?? "submitted";
    const stateMap: Record<string, ProviderJobStatus["state"]> = {
      submitted: "PENDING", processing: "RUNNING", succeed: "SUCCEEDED", failed: "FAILED",
    };
    return {
      state: stateMap[status] ?? "PENDING",
      progressPercent: status === "succeed" ? 100 : status === "processing" ? 50 : 0,
      errorCode: status === "failed" ? (data.data?.task_status_msg ?? "UNKNOWN") : null,
    };
  }

  async fetchResults(jobId: string): Promise<ProviderMediaResult[]> {
    const res = await fetch(`${KLING_BASE}/v1/videos/text2video/${jobId}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json() as {
      data?: { task_result?: { videos?: Array<{ url: string; duration: string }> } };
    };
    const videos = data.data?.task_result?.videos ?? [];
    return videos.map(v => ({
      storageKey: v.url, // URL — handler downloads it
      mimeType: "video/mp4",
      width: 1280, height: 720,
      durationSeconds: parseFloat(v.duration ?? "5"),
    }));
  }

  async cancel(_jobId: string): Promise<{ cancelled: boolean }> {
    return { cancelled: false }; // Kling does not support cancellation
  }
}

/** Download a video URL and save to localPath. Returns file size. */
export async function downloadVideoToFile(url: string, localPath: string): Promise<number> {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  await mkdir(path.default.dirname(localPath), { recursive: true });
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) }); // 5 min for video
  if (!res.ok) throw new Error(`Video download failed: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(localPath, buf);
  return buf.length;
}

export async function testKlingKey(credentials: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const [ak, sk] = credentials.split(":");
    if (!ak || !sk) {
      return { ok: false, model: "", error: "Format must be accessKey:secretKey" };
    }
    return { ok: true, model: "kling-v1" };
  } catch (e: unknown) {
    return { ok: false, model: "", error: e instanceof Error ? e.message : String(e) };
  }
}
