import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";
import { getShotAudioData } from "@/lib/shots/audio-defaults";

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const scenes = await prisma.scene.findMany({
    where: { projectId: projectId as string },
    include: {
      shots: {
        include: {
          mediaVersions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { shotNumber: "asc" },
      },
    },
    orderBy: { sceneNumber: "asc" },
  });
  const scenesWithAudio = scenes.map((sc) => ({
    ...sc,
    shots: sc.shots.map((sh) => {
      const audio = getShotAudioData(sh.negativeConstraints, sc.sceneNumber, sh.shotNumber, sh.actionDescription);
      return {
        ...sh,
        voiceover: audio.voiceover,
        dialogue: audio.dialogue,
        audioPrompt: audio.audioPrompt,
        characterAnchor: audio.characterAnchor,
        characterTag: audio.characterTag,
        characterName: audio.characterName,
      };
    }),
  }));

  return {
    project: {
      id: project.id,
      title: project.title,
      aspectRatio: project.aspectRatio,
      storyLanguage: project.storyLanguage,
      visualStyle: project.visualStyle,
      genre: project.genre,
      tone: project.tone,
      targetRuntime: project.targetRuntime,
    },
    scenes: scenesWithAudio,
  };
});

const generateSchema = z.object({ modelId: z.string().optional(), useMock: z.boolean().optional() });

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = generateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid request");
  const { modelId = "gpt-4o-mini", useMock = false } = parsed.data;

  if (!useMock) {
    const conn = await prisma.providerConnection.findFirst({ where: { ownerId, providerId: { in: ["openai","gemini"] }, isEnabled: true } });
    if (!conn) throw badRequest("No AI provider configured.");
  }

  const job = await enqueue({
    jobType: "SHOT_PLAN",
    idempotencyKey: `shots-${projectId as string}-${Date.now()}`,
    requestPayload: { projectId, modelId, useMock },
    projectId: projectId as string,
  });
  return { jobId: job.id, status: job.status };
});
