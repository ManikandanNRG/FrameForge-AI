import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { synthesizeVoiceover } from "@/lib/media/voiceover";
import { getShotAudioData } from "@/lib/shots/audio-defaults";
import { normalizeRoot } from "@/lib/media/paths";
import path from "node:path";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";

/**
 * GET /api/projects/[projectId]/shots/[shotId]/voiceover
 * Generates or streams the synthesized voiceover MP3 audio for a shot.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ projectId: string; shotId: string }> },
): Promise<Response> {
  try {
    const ownerId = await requireUserId();
    const { projectId, shotId } = await ctx.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.ownerId !== ownerId) {
      return new Response("Unauthorized", { status: 403 });
    }

    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: { scene: true },
    });
    if (!shot) return new Response("Shot not found", { status: 404 });

    // Extract voiceover text using shared audio resolver
    const audioData = getShotAudioData(
      shot.negativeConstraints,
      shot.scene.sceneNumber,
      shot.shotNumber,
      shot.actionDescription,
    );
    const voiceoverText = audioData.voiceover || audioData.dialogue || shot.actionDescription;

    // Media root
    let root = await prisma.mediaRoot.findFirst({ where: { ownerId } });
    const rootPath = root ? root.path : normalizeRoot("./media");
    const audioDir = path.join(rootPath, "projects", projectId, "shots", shotId, "audio");
    const audioFile = path.join(audioDir, "voiceover.mp3");

    // Synthesize if file doesn't already exist
    if (!existsSync(audioFile)) {
      await synthesizeVoiceover(voiceoverText, audioFile, project.storyLanguage || "en");
    }

    const { readFile } = await import("node:fs/promises");
    const buf = await readFile(audioFile);

    return new Response(buf, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buf.byteLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
