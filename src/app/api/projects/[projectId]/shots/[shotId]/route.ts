import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { snapToOmniDuration } from "@/lib/shots/schemas";

const patchSchema = z.object({
  targetDurationSeconds: z.number().optional(),
  actionDescription: z.string().optional(),
  cameraMovement: z.string().optional(),
  shotSize: z.string().optional(),
  lighting: z.string().optional(),
  dialogue: z.string().optional(),
  voiceover: z.string().optional(),
  audioPrompt: z.string().optional(),
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, shotId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const shot = await prisma.shot.findFirst({ where: { id: shotId as string, projectId: projectId as string } });
  if (!shot) throw notFound("Shot not found");

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid body");

  const dataToUpdate: any = {};
  if (parsed.data.targetDurationSeconds !== undefined) {
    dataToUpdate.targetDurationSeconds = snapToOmniDuration(parsed.data.targetDurationSeconds);
  }
  if (parsed.data.actionDescription !== undefined) {
    dataToUpdate.actionDescription = parsed.data.actionDescription;
  }
  if (parsed.data.cameraMovement !== undefined) {
    dataToUpdate.cameraMovement = parsed.data.cameraMovement;
  }
  if (parsed.data.shotSize !== undefined) {
    dataToUpdate.shotSize = parsed.data.shotSize;
  }
  if (parsed.data.lighting !== undefined) {
    dataToUpdate.lighting = parsed.data.lighting;
  }

  // Update audio (dialogue, voiceover, sound effects) stored in negativeConstraints
  if (
    parsed.data.dialogue !== undefined ||
    parsed.data.voiceover !== undefined ||
    parsed.data.audioPrompt !== undefined
  ) {
    let existingAudio: any = {};
    try {
      existingAudio = JSON.parse(shot.negativeConstraints || "{}");
    } catch {}

    const dialogue = parsed.data.dialogue !== undefined ? parsed.data.dialogue : existingAudio.dialogue;
    const voiceover = parsed.data.voiceover !== undefined ? parsed.data.voiceover : existingAudio.voiceover;
    const audioPrompt = parsed.data.audioPrompt !== undefined ? parsed.data.audioPrompt : existingAudio.audioPrompt;

    const mergedAudio = {
      ...existingAudio,
      dialogue: dialogue || "",
      // Audio exclusivity: if dialogue exists, voiceover is suppressed
      voiceover: (dialogue && dialogue.trim().length > 0) ? "" : (voiceover || ""),
      audioPrompt: audioPrompt || "",
    };

    dataToUpdate.negativeConstraints = JSON.stringify(mergedAudio);
  }

  const updated = await prisma.shot.update({
    where: { id: shotId as string },
    data: dataToUpdate,
  });

  return { shot: updated };
});

