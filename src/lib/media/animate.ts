import { findFfmpeg } from "@/lib/edit/ffmpeg";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Animate a storyboard still image into a standard 1080p MP4 video clip
 * using the local FFmpeg engine. Integrates voiceover/dialogue audio
 * if an audio file is provided.
 */
export async function animateStillToVideo(
  imagePath: string,
  outputPath: string,
  durationSeconds = 5,
  width = 1920,
  height = 1080,
  fps = 24,
  audioPath?: string,
): Promise<void> {
  const bin = findFfmpeg();
  if (!bin) throw new Error("FFmpeg not found. Please install FFmpeg.");
  await mkdir(path.dirname(outputPath), { recursive: true });

  const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

  const hasAudio = audioPath && existsSync(audioPath);

  const args: string[] = [
    "-y",
    "-loop", "1",
    "-i", imagePath,
  ];

  if (hasAudio) {
    args.push("-i", audioPath);
  } else {
    // Generate silent audio so all video clips have a standard audio stream
    args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100");
  }

  args.push(
    "-c:v", "libx264",
    "-preset", "faster",
    "-crf", "20",
    "-t", String(durationSeconds),
    "-pix_fmt", "yuv420p",
    "-vf", vf,
    "-r", String(fps),
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    outputPath,
  );

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args);
    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg animate failed (code ${code}): ${stderr.slice(-300)}`));
    });
  });
}

