import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { StoryOptionSchema } from "@/lib/story/schemas";

const selectOptionSchema = z.object({
  option: StoryOptionSchema,
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = selectOptionSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid option data");

  const option = parsed.data.option;

  // 1. Update Project Title
  await prisma.project.update({
    where: { id: projectId as string },
    data: {
      title: option.title,
      description: option.logline,
    },
  });

  // 2. Save LOGLINE and PREMISE artifacts
  const loglineArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "LOGLINE" } },
    create: { projectId: projectId as string, artifactType: "LOGLINE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const loglineCount = await prisma.artifactVersion.count({ where: { artifactId: loglineArt.id } });
  const loglineVer = await prisma.artifactVersion.create({
    data: {
      artifactId: loglineArt.id,
      versionNumber: loglineCount + 1,
      contentText: option.logline,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: loglineArt.id },
    data: { currentVersionId: loglineVer.id },
  });

  const premiseArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "PREMISE" } },
    create: { projectId: projectId as string, artifactType: "PREMISE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const premiseCount = await prisma.artifactVersion.count({ where: { artifactId: premiseArt.id } });
  const premiseVer = await prisma.artifactVersion.create({
    data: {
      artifactId: premiseArt.id,
      versionNumber: premiseCount + 1,
      contentText: option.premise,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: premiseArt.id },
    data: { currentVersionId: premiseVer.id },
  });

  // 3. Save SCREENPLAY artifact
  const screenplayJson = {
    title: option.title,
    scenes: option.scenes,
    totalEstimatedDurationSeconds: option.scenes.reduce((acc, sc) => acc + (sc.estimatedDurationSeconds || 8), 0),
  };

  const screenplayArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "SCREENPLAY" } },
    create: { projectId: projectId as string, artifactType: "SCREENPLAY", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const spCount = await prisma.artifactVersion.count({ where: { artifactId: screenplayArt.id } });
  const spVer = await prisma.artifactVersion.create({
    data: {
      artifactId: screenplayArt.id,
      versionNumber: spCount + 1,
      contentText: JSON.stringify(screenplayJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: screenplayArt.id },
    data: { currentVersionId: spVer.id },
  });

  // 4. Synchronize Database Scenes and Shots
  await prisma.scene.deleteMany({ where: { projectId: projectId as string } });

  for (const sc of option.scenes) {
    const scene = await prisma.scene.create({
      data: {
        projectId: projectId as string,
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        actionSummary: sc.action.slice(0, 255),
        estimatedDurationSeconds: sc.estimatedDurationSeconds || 8,
      },
    });

    // Create primary shot for the scene
    let charTag = "";
    let charName = "";
    const tagMatch = sc.action.match(/\[@([A-Za-z0-9_-]+)\]/) || (sc.dialogue && sc.dialogue.match(/\[@([A-Za-z0-9_-]+)\]/));
    if (tagMatch) {
      charTag = `[@${tagMatch[1]}]`;
      charName = tagMatch[1];
    }

    const audioPayload = {
      dialogue: sc.dialogue || "",
      voiceover: sc.voiceover || "",
      audioPrompt: sc.audioScript || "",
      characterTag: charTag,
      characterName: charName,
    };

    await prisma.shot.create({
      data: {
        projectId: projectId as string,
        sceneId: scene.id,
        shotNumber: sc.sceneNumber,
        actionDescription: sc.action,
        shotSize: "Medium Shot",
        cameraMovement: "35mm prime lens dynamic camera movement at 24fps",
        lighting: "Warm cinematic natural lighting, soft shadows",
        targetDurationSeconds: sc.estimatedDurationSeconds || 8,
        negativeConstraints: JSON.stringify(audioPayload),
      },
    });
  }

  return {
    ok: true,
    screenplay: screenplayJson,
  };
});

