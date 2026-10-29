import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import type { TextGenerationProvider } from "@/lib/providers/types";
import { ShotPlanSchema } from "./schemas";

export async function generateShotPlan(
  provider: TextGenerationProvider,
  modelId: string,
  projectId: string,
  screenplayText: string,
): Promise<void> {
  logger.info({ projectId }, "shot planning starting");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const result = await provider.generateStructured({
    modelId,
    systemPrompt: `You are a cinematographer breaking a screenplay into scenes and shots for a ${project.visualStyle.replace(/_/g, " ")} film. Each shot should be 3-8 seconds. Return JSON only.`,
    userPrompt: `Break this screenplay into scenes and shots. For each shot write an image prompt and video prompt in ${project.visualStyle.replace(/_/g, " ")} style.\n\nScreenplay:\n${screenplayText.slice(0, 6000)}\n\nReturn JSON: { scenes: [{ sceneNumber, heading, location, timeOfDay, actionSummary, estimatedDurationSeconds, shots: [{ shotNumber, actionDescription, shotSize, cameraAngle?, cameraMovement?, lighting?, mood?, imagePrompt, videoPrompt, targetDurationSeconds }] }] }`,
    schema: ShotPlanSchema,
  });

  // Delete existing scenes/shots for this project before re-generating
  await prisma.scene.deleteMany({ where: { projectId } });

  for (const s of result.data.scenes) {
    const scene = await prisma.scene.create({
      data: {
        projectId,
        sceneNumber: s.sceneNumber,
        heading: s.heading,
        location: s.location,
        timeOfDay: s.timeOfDay,
        actionSummary: s.actionSummary,
        estimatedDurationSeconds: s.estimatedDurationSeconds,
        approvalStatus: "DRAFT",
      },
    });

    for (const sh of s.shots) {
      await prisma.shot.create({
        data: {
          sceneId: scene.id,
          projectId,
          shotNumber: sh.shotNumber,
          actionDescription: sh.actionDescription,
          shotSize: sh.shotSize,
          cameraAngle: sh.cameraAngle,
          cameraMovement: sh.cameraMovement,
          lighting: sh.lighting,
          mood: sh.mood,
          imagePrompt: sh.imagePrompt,
          videoPrompt: sh.videoPrompt,
          targetDurationSeconds: sh.targetDurationSeconds,
          aspectRatio: project.aspectRatio === "PORTRAIT_9_16" ? "9:16" : "16:9",
          approvalStatus: "DRAFT",
        },
      });
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { currentStage: "STORYBOARD" },
  });

  logger.info({ projectId }, "shot planning complete");
}
