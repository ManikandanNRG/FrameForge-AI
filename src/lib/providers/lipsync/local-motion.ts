import { findFfmpeg } from "@/lib/edit/ffmpeg";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { LipSyncProvider, LipSyncInput, LipSyncResult } from "./types";
import { logger } from "@/lib/logger";

/**
 * Built-in Zero-Cost Cinematic Motion & Speech Multiplexer.
 * Ensures character shots always have high-fidelity voice audio,
 * subtle cinematic micro-movements, and 100% browser-compatible video streams.
 */
export class LocalMotionProvider implements LipSyncProvider {
  id = "local-audio-motion";
  name = "Local Motion & Speech Multiplexer";

  async generateLipSync(input: LipSyncInput): Promise<LipSyncResult> {
    const { imagePath, audioPath, outputPath } = input;
    const durationSeconds = input.durationSeconds ?? 5;

    const bin = findFfmpeg();
    if (!bin) throw new Error("FFmpeg not found. Please ensure FFmpeg is installed.");

    await mkdir(path.dirname(outputPath), { recursive: true });

    const hasAudio = audioPath && existsSync(audioPath);

    logger.info({ imagePath, audioPath, hasAudio, durationSeconds }, "rendering character speech video via FFmpeg");

    // Dynamic zoom & subtle breathing pan filter
    const vf = [
      "scale=1920:1080:force_original_aspect_ratio=decrease",
      "pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
      "zoompan=z='min(zoom+0.0008,1.06)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=24",
    ].join(",");

    const args: string[] = [
      "-y",
      "-loop", "1",
      "-i", imagePath,
    ];

    if (hasAudio) {
      args.push("-i", audioPath);
    } else {
      args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
    }

    args.push(
      "-c:v", "libx264",
      "-preset", "faster",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-vf", vf,
      "-r", "24",
      "-t", String(durationSeconds),
      "-c:a", "aac",
      "-b:a", "192k",
      "-ar", "44100",
      outputPath,
    );

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(bin, args);
      let stderr = "";
      proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg character render failed (code ${code}): ${stderr.slice(-300)}`));
      });
    });

    return {
      outputPath,
      providerId: "local-audio-motion",
      modelId: "ffmpeg-cinematic-character",
      durationSeconds,
    };
  }
}

