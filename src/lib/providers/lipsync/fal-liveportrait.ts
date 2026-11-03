import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { LipSyncProvider, LipSyncInput, LipSyncResult } from "./types";
import { logger } from "@/lib/logger";

/**
 * Fal.ai LivePortrait & Lip-Sync Provider
 * Cost: ~$0.01 per generation (ultra-cheap, highest open-source realism).
 */
export class FalLivePortraitProvider implements LipSyncProvider {
  id = "fal";
  name = "fal.ai (LivePortrait)";

  constructor(private apiKey: string) {}

  async generateLipSync(input: LipSyncInput): Promise<LipSyncResult> {
    const { imagePath, audioPath, outputPath } = input;
    const cleanKey = this.apiKey.trim().replace(/^Key\s+/i, "");

    if (!imagePath || !existsSync(imagePath)) {
      throw new Error(`Storyboard image file not found on disk: "${imagePath}"`);
    }
    if (!audioPath || !existsSync(audioPath)) {
      throw new Error(`Audio file not found on disk: "${audioPath}"`);
    }

    logger.info({ imagePath, audioPath }, "starting fal.ai LivePortrait lip-sync");

    // Read image and audio as base64 data URIs
    const imgBuf = await readFile(imagePath);
    const imgExt = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
    const imgDataUri = `data:${imgExt};base64,${imgBuf.toString("base64")}`;

    const audioBuf = await readFile(audioPath);
    const audioDataUri = `data:audio/mpeg;base64,${audioBuf.toString("base64")}`;

    // Submit job to fal-ai/live-portrait queue
    const submitRes = await fetch("https://queue.fal.run/fal-ai/live-portrait", {
      method: "POST",
      headers: {
        "Authorization": `Key ${cleanKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        face_image_url: imgDataUri,
        audio_url: audioDataUri,
        flag_relative_motion: true,
        flag_do_crop: true,
        flag_pasteback: true,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`fal.ai LivePortrait submit failed (${submitRes.status}): ${errText}`);
    }

    const submitData = (await submitRes.json()) as {
      request_id?: string;
      status_url?: string;
      response_url?: string;
      video?: { url: string };
    };

    let videoUrl = submitData.video?.url;

    if (!videoUrl && submitData.status_url) {
      // Poll until completed
      const deadline = Date.now() + 5 * 60 * 1000; // 5 min
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(submitData.status_url, {
          headers: { "Authorization": `Key ${cleanKey}` },
        });
        if (!statusRes.ok) continue;
        const statusData = (await statusRes.json()) as {
          status: string;
          response_url?: string;
        };

        if (statusData.status === "COMPLETED") {
          const respUrl = statusData.response_url ?? submitData.response_url;
          if (respUrl) {
            const resp = await fetch(respUrl, {
              headers: { "Authorization": `Key ${cleanKey}` },
            });
            const finalData = (await resp.json()) as { video?: { url: string } };
            videoUrl = finalData.video?.url;
          }
          break;
        } else if (statusData.status === "FAILED") {
          throw new Error("fal.ai LivePortrait job failed");
        }
      }
    }

    if (!videoUrl) {
      throw new Error("fal.ai LivePortrait completed without returning a video URL");
    }

    // Download video file to outputPath
    const videoDownloadRes = await fetch(videoUrl);
    if (!videoDownloadRes.ok) {
      throw new Error(`Failed to download fal.ai video: ${videoDownloadRes.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoDownloadRes.arrayBuffer());
    await writeFile(outputPath, videoBuffer);

    logger.info({ outputPath, size: videoBuffer.length }, "fal.ai LivePortrait generated successfully");

    return {
      outputPath,
      providerId: "fal",
      modelId: "fal-ai/live-portrait",
      durationSeconds: input.durationSeconds ?? 5,
    };
  }
}

export async function testFalKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const cleanKey = apiKey.trim().replace(/^Key\s+/i, "");
    if (!cleanKey) {
      return { ok: false, model: "fal", error: "API key is empty" };
    }

    const res = await fetch("https://api.fal.ai/v1/models?limit=1", {
      headers: {
        "Authorization": `Key ${cleanKey}`,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      return { ok: true, model: "fal-ai/live-portrait (verified)" };
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, model: "fal", error: "Invalid API key or unauthorized. Check your key at fal.ai/dashboard/keys" };
    }

    const errText = await res.text().catch(() => "");
    return { ok: false, model: "fal", error: `fal.ai returned ${res.status}: ${errText.slice(0, 100)}` };
  } catch (e) {
    return { ok: false, model: "fal", error: e instanceof Error ? e.message : String(e) };
  }
}

