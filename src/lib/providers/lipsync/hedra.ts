import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { LipSyncProvider, LipSyncInput, LipSyncResult } from "./types";
import { logger } from "@/lib/logger";

/**
 * Hedra Character Lip-Sync & Dialogue Provider
 * Endpoint: api.hedra.com
 * Cost: ~$0.025-$0.05 / sec (~$0.15-$0.25 / 5s clip)
 */
export class HedraLipSyncProvider implements LipSyncProvider {
  id = "hedra";
  name = "Hedra (Character-1 / Character-2)";

  constructor(private apiKey: string) {}

  async generateLipSync(input: LipSyncInput): Promise<LipSyncResult> {
    const { imagePath, audioPath, outputPath } = input;

    if (!imagePath || !existsSync(imagePath)) {
      throw new Error(`Storyboard image file not found on disk: "${imagePath}"`);
    }
    if (!audioPath || !existsSync(audioPath)) {
      throw new Error(`Audio file not found on disk: "${audioPath}"`);
    }

    logger.info({ imagePath, audioPath }, "starting Hedra character dialogue generation");

    // 1. Upload audio to Hedra asset endpoint
    const audioBuf = await readFile(audioPath);
    const audioBlob = new Blob([audioBuf], { type: "audio/mpeg" });
    const audioForm = new FormData();
    audioForm.append("file", audioBlob, "speech.mp3");

    const audioUploadRes = await fetch("https://api.hedra.com/v1/audio", {
      method: "POST",
      headers: { "X-API-KEY": this.apiKey },
      body: audioForm,
    });
    if (!audioUploadRes.ok) {
      throw new Error(`Hedra audio upload failed: ${audioUploadRes.status} ${await audioUploadRes.text()}`);
    }
    const audioData = (await audioUploadRes.json()) as { url?: string; id?: string };
    const audioId = audioData.id || audioData.url;

    // 2. Upload image to Hedra portrait endpoint
    const imgBuf = await readFile(imagePath);
    const imgExt = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
    const imgBlob = new Blob([imgBuf], { type: imgExt });
    const imgForm = new FormData();
    imgForm.append("file", imgBlob, "portrait.jpg");

    const imgUploadRes = await fetch("https://api.hedra.com/v1/portrait", {
      method: "POST",
      headers: { "X-API-KEY": this.apiKey },
      body: imgForm,
    });
    if (!imgUploadRes.ok) {
      throw new Error(`Hedra portrait upload failed: ${imgUploadRes.status} ${await imgUploadRes.text()}`);
    }
    const imgData = (await imgUploadRes.json()) as { url?: string; id?: string };
    const avatarImageId = imgData.id || imgData.url;

    // 3. Create character project
    const charRes = await fetch("https://api.hedra.com/v1/characters", {
      method: "POST",
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_image_id: avatarImageId,
        audio_id: audioId,
        aspect_ratio: "16:9",
      }),
    });
    if (!charRes.ok) {
      throw new Error(`Hedra character submission failed: ${charRes.status} ${await charRes.text()}`);
    }
    const charData = (await charRes.json()) as { job_id?: string; id?: string };
    const jobId = charData.job_id || charData.id;

    if (!jobId) throw new Error("Hedra did not return a job ID");

    // 4. Poll until completed
    const deadline = Date.now() + 10 * 60 * 1000;
    let videoUrl = "";

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      const pollRes = await fetch(`https://api.hedra.com/v1/projects/${jobId}`, {
        headers: { "X-API-KEY": this.apiKey },
      });
      if (!pollRes.ok) continue;
      const pollData = (await pollRes.json()) as {
        status?: string;
        video_url?: string;
        error?: string;
      };

      if (pollData.status === "Complete" || pollData.video_url) {
        videoUrl = pollData.video_url!;
        break;
      }
      if (pollData.status === "Failed" || pollData.error) {
        throw new Error(`Hedra generation failed: ${pollData.error ?? "Unknown error"}`);
      }
    }

    if (!videoUrl) throw new Error("Hedra job timed out");

    // 5. Download result
    const dlRes = await fetch(videoUrl);
    if (!dlRes.ok) throw new Error(`Failed to download Hedra video: ${dlRes.statusText}`);
    const videoBuf = Buffer.from(await dlRes.arrayBuffer());
    await writeFile(outputPath, videoBuf);

    return {
      outputPath,
      providerId: "hedra",
      modelId: "hedra-character-2",
      durationSeconds: input.durationSeconds ?? 5,
    };
  }
}

export async function testHedraKey(apiKey: string): Promise<{ ok: boolean; model: string; error?: string }> {
  try {
    const res = await fetch("https://api.hedra.com/v1/models", {
      headers: { "X-API-KEY": apiKey },
    });
    if (res.ok || res.status === 200) {
      return { ok: true, model: "hedra-character-2 (verified)" };
    }
    return { ok: false, model: "hedra", error: `Authentication failed (${res.status})` };
  } catch (e) {
    return { ok: false, model: "hedra", error: e instanceof Error ? e.message : String(e) };
  }
}

