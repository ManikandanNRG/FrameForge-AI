import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Timeline } from "./timeline";
import { framesToSeconds } from "./timeline";

/**
 * Phase 4: FFmpeg rendering via the local companion model.
 * For localhost Phase 0/1-4 we spawn FFmpeg directly; the companion abstraction
 * wraps this when going online (spec §10.7).
 *
 * NEVER concatenates untrusted strings into shell commands.
 * All arguments are passed as arrays (spec §6.6.5).
 */

export function findFfmpeg(): string | null {
  const candidates = [
    process.env.FFMPEG_PATH,
    "C:\\ffmpeg-9.0.2-essentials_build\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  // Check if global 'ffmpeg' is accessible in system PATH
  try {
    const { spawnSync } = require("node:child_process");
    const res = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
    if (res.status === 0) return "ffmpeg";
  } catch {}
  return null;
}

export function findFfprobe(): string | null {
  const candidates = [
    process.env.FFPROBE_PATH,
    "C:\\ffmpeg-9.0.2-essentials_build\\bin\\ffprobe.exe",
    "C:\\ffmpeg\\bin\\ffprobe.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe",
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  // Check if global 'ffprobe' is accessible in system PATH
  try {
    const { spawnSync } = require("node:child_process");
    const res = spawnSync("ffprobe", ["-version"], { stdio: "ignore" });
    if (res.status === 0) return "ffprobe";
  } catch {}
  return null;
}

function runProcess(bin: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

/** Probe a media file; returns parsed JSON or null on failure. */
export async function probeMedia(filePath: string): Promise<Record<string, unknown> | null> {
  const bin = findFfprobe();
  if (!bin) return null;
  const result = await runProcess(bin, [
    "-v", "quiet", "-print_format", "json",
    "-show_format", "-show_streams", filePath,
  ]);
  if (result.code !== 0) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
}

export interface RenderOptions {
  outputPath: string;
  width?: number;
  height?: number;
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  onProgress?: (pct: number) => void;
}

/**
 * Render a timeline to MP4 using FFmpeg concat demuxer (spec §11.3).
 * Validates output with FFprobe after render.
 */
export async function renderTimeline(
  timeline: Timeline,
  opts: RenderOptions,
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  const bin = findFfmpeg();
  if (!bin) return { success: false, outputPath: "", error: "FFmpeg not found. Install FFmpeg and add it to PATH or set FFMPEG_PATH in .env" };

  const videoTrack = timeline.tracks.find(t => t.type === "VIDEO");
  if (!videoTrack || videoTrack.items.length === 0) {
    return { success: false, outputPath: "", error: "No video clips in timeline" };
  }

  await mkdir(path.dirname(opts.outputPath), { recursive: true });

  const fps = opts.fps ?? timeline.frameRate;
  const w   = opts.width  ?? timeline.width;
  const h   = opts.height ?? timeline.height;

  // Build concat-demuxer input list
  const concatLines: string[] = [];
  for (const item of videoTrack.items) {
    // If volume is 0 or clip was unselected, skip it from the concatenated master film
    if (item.volume === 0) continue;
    const inSec  = framesToSeconds(item.sourceInFrames, fps);
    const outSec = framesToSeconds(item.sourceOutFrames, fps);
    const dur    = outSec - inSec;
    concatLines.push(
      `file '${item.storagePath.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`,
      `inpoint ${inSec.toFixed(3)}`,
      `outpoint ${outSec.toFixed(3)}`,
      `duration ${dur.toFixed(3)}`,
    );
  }

  if (concatLines.length === 0) {
    return { success: false, outputPath: "", error: "No active clips selected for rendering. Please enable at least one scene/clip in your timeline." };
  }

  // Write concat file to a temp path beside output
  const { writeFile, unlink } = await import("node:fs/promises");
  const concatFile = opts.outputPath + ".concat.txt";
  await writeFile(concatFile, concatLines.join("\n"), "utf8");

  // FFmpeg args (never concatenate user strings — always array)
  const args = [
    "-y",
    "-f", "concat", "-safe", "0", "-i", concatFile,
    "-vf", `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "22",
    "-b:v", opts.videoBitrate ?? "4M",
    "-c:a", "aac", "-b:a", opts.audioBitrate ?? "192k",
    "-movflags", "+faststart",
    "-progress", "pipe:2",
    opts.outputPath,
  ];

  const result = await runProcess(bin, args);

  // Clean temp file
  await unlink(concatFile).catch(() => {});

  if (result.code !== 0) {
    return { success: false, outputPath: opts.outputPath, error: result.stderr.slice(-500) };
  }

  // Validate output
  const probe = await probeMedia(opts.outputPath);
  if (!probe) return { success: false, outputPath: opts.outputPath, error: "Output validation failed (ffprobe)" };

  return { success: true, outputPath: opts.outputPath };
}

/** Check if a media file contains an audio stream. */
export async function hasAudioStream(filePath: string): Promise<boolean> {
  const probe = await probeMedia(filePath);
  if (!probe || !Array.isArray(probe.streams)) return false;
  return probe.streams.some((s: Record<string, unknown>) => s.codec_type === "audio");
}

/**
 * Multiplex an audio track (e.g. dialogue / voiceover MP3) onto a video clip.
 * Preserves video stream bit-for-bit with '-c:v copy' in < 100ms.
 * Pads audio with silence if shorter than video, trims audio if longer than video.
 */
export async function muxAudioOntoVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): Promise<{ success: boolean; error?: string }> {
  const bin = findFfmpeg();
  if (!bin) return { success: false, error: "FFmpeg not found" };

  await mkdir(path.dirname(outputPath), { recursive: true });

  const args = [
    "-y",
    "-i", videoPath,
    "-i", audioPath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-af", "apad",
    "-shortest",
    outputPath,
  ];

  const result = await runProcess(bin, args);
  if (result.code !== 0) {
    return { success: false, error: result.stderr.slice(-500) };
  }
  return { success: true };
}
