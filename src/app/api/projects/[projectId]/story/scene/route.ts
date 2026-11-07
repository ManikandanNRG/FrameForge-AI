import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const updateSceneSchema = z.object({
  sceneNumber: z.number().int().min(1),
  heading: z.string().optional(),
  location: z.string().optional(),
  timeOfDay: z.string().optional(),
  action: z.string().min(1),
  voiceover: z.string().optional(),
  dialogue: z.string().optional(),
  audioScript: z.string().optional(),
  soundEffects: z.string().optional(),
  estimatedDurationSeconds: z.number().optional(),
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = updateSceneSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid scene data");

  const { sceneNumber, ...updates } = parsed.data;

  // 1. Find Screenplay Artifact
  const artifact = await prisma.storyArtifact.findFirst({
    where: { projectId: projectId as string, artifactType: "SCREENPLAY" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!artifact || !artifact.versions[0]) {
    throw badRequest("No screenplay found to update.");
  }

  let screenplayData: { title: string; scenes: any[] };
  try {
    screenplayData = JSON.parse(artifact.versions[0].contentText);
  } catch {
    throw badRequest("Failed to parse screenplay data.");
  }

  const sceneIndex = screenplayData.scenes.findIndex(s => s.sceneNumber === sceneNumber);
  if (sceneIndex === -1) {
    throw notFound(`Scene ${sceneNumber} not found.`);
  }

  screenplayData.scenes[sceneIndex] = {
    ...screenplayData.scenes[sceneIndex],
    ...updates,
    sceneNumber,
  };

  // 2. Save user edit version
  const count = await prisma.artifactVersion.count({ where: { artifactId: artifact.id } });
  const newVersion = await prisma.artifactVersion.create({
    data: {
      artifactId: artifact.id,
      versionNumber: count + 1,
      contentText: JSON.stringify(screenplayData, null, 2),
      source: "USER",
      createdByUserId: ownerId,
    },
  });

  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data: { currentVersionId: newVersion.id, approvalStatus: "DRAFT" },
  });

  // 3. Synchronize with database Scene and Shot records
  const dbScene = await prisma.scene.findFirst({
    where: { projectId: projectId as string, sceneNumber },
    include: { shots: { orderBy: { shotNumber: "asc" } } },
  });

  if (dbScene) {
    await prisma.scene.update({
      where: { id: dbScene.id },
      data: {
        heading: updates.heading ?? dbScene.heading,
        location: updates.location ?? dbScene.location,
        timeOfDay: updates.timeOfDay ?? dbScene.timeOfDay,
        actionSummary: updates.action.slice(0, 255),
        estimatedDurationSeconds: updates.estimatedDurationSeconds ?? dbScene.estimatedDurationSeconds,
      },
    });

    if (dbScene.shots.length > 0) {
      const primaryShot = dbScene.shots[0];
      let existingAudio: any = {};
      try { existingAudio = JSON.parse(primaryShot.negativeConstraints || "{}"); } catch {}

      const mergedAudio = {
        ...existingAudio,
        dialogue: updates.dialogue !== undefined ? updates.dialogue : existingAudio.dialogue,
        voiceover: updates.voiceover !== undefined ? updates.voiceover : existingAudio.voiceover,
        audioPrompt: updates.audioScript || updates.soundEffects || existingAudio.audioPrompt,
      };

      await prisma.shot.update({
        where: { id: primaryShot.id },
        data: {
          actionDescription: updates.action,
          targetDurationSeconds: updates.estimatedDurationSeconds ?? primaryShot.targetDurationSeconds,
          negativeConstraints: JSON.stringify(mergedAudio),
        },
      });
    }
  }

  return {
    ok: true,
    scene: screenplayData.scenes[sceneIndex],
    screenplay: screenplayData,
  };
});

