import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { findFfmpeg } from "@/lib/edit/ffmpeg";
import { spawn } from "node:child_process";

export function normalizeLanguageCode(lang?: string): string {
  if (!lang) return "en";
  const l = lang.trim().toLowerCase();
  if (l.startsWith("ta") || l.includes("tamil")) return "ta";
  if (l.startsWith("hi") || l.includes("hindi")) return "hi";
  if (l.startsWith("te") || l.includes("telugu")) return "te";
  if (l.startsWith("kn") || l.includes("kannada")) return "kn";
  if (l.startsWith("ml") || l.includes("malayalam")) return "ml";
  if (l.startsWith("fr") || l.includes("french")) return "fr";
  if (l.startsWith("es") || l.includes("spanish")) return "es";
  if (l.startsWith("de") || l.includes("german")) return "de";
  if (l.startsWith("zh") || l.includes("chinese")) return "zh-CN";
  if (l.startsWith("ja") || l.includes("japanese")) return "ja";
  return "en";
}

/**
 * Generates a clean fallback audio file (tone/silence) using FFmpeg
 * when external TTS is unavailable or offline.
 */
export async function generateFallbackAudio(outputPath: string, durationSeconds = 5): Promise<string> {
  const bin = findFfmpeg();
  if (!bin) throw new Error("FFmpeg not found");
  await mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, [
      "-y",
      "-f", "lavfi",
      "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      "-t", String(durationSeconds),
      "-c:a", "libmp3lame",
      "-b:a", "128k",
      outputPath,
    ]);
    proc.on("close", (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`Failed to generate fallback audio: code ${code}`));
    });
  });
}

/**
 * Synthesizes voiceover or spoken dialogue into an MP3 file using
 * Google's public TTS service. Free, zero-API-key required.
 * Gracefully creates a fallback audio file if network or TTS fails.
 */
export async function synthesizeVoiceover(
  text: string,
  outputPath: string,
  rawLanguage = "en",
  fallbackDuration = 5,
): Promise<string> {
  const clean = text.trim();
  if (!clean) {
    return generateFallbackAudio(outputPath, fallbackDuration);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  const language = normalizeLanguageCode(rawLanguage);

  try {
    // Split into chunks if longer than 180 chars (standard TTS safe limit)
    const chunks: string[] = [];
    const words = clean.split(/\s+/);
    let cur = "";

    for (const word of words) {
      if ((cur + " " + word).trim().length > 180) {
        if (cur) chunks.push(cur.trim());
        cur = word;
      } else {
        cur = (cur + " " + word).trim();
      }
    }
    if (cur) chunks.push(cur.trim());

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(language)}&client=tw-ob`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://translate.google.com/",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        throw new Error(`TTS synthesis request failed: ${res.status} ${res.statusText}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      buffers.push(buf);
    }

    const combined = Buffer.concat(buffers);
    await writeFile(outputPath, combined);
    return outputPath;
  } catch (err) {
    // If TTS fails (e.g. offline, rate-limited, or network timeout), generate fallback audio file
    if (!existsSync(outputPath)) {
      return generateFallbackAudio(outputPath, fallbackDuration);
    }
    return outputPath;
  }
}

