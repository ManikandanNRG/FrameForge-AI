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

  // 4. Save SYNOPSIS artifact
  const synopsisText = `CREATIVE ANGLE: ${option.conceptAngle}
TITLE: ${option.title}

LOGLINE:
${option.logline}

PREMISE:
${option.premise}

NARRATIVE SUMMARY:
${option.scenes
  .map(
    (s) =>
      `• Scene ${s.sceneNumber} (${s.heading}): ${s.action} ${
        s.dialogue ? `[Dialogue: ${s.dialogue}]` : ""
      }`
  )
  .join("\n\n")}

PRODUCTION VISION:
A cinematic visual short set in ${project.visualStyle.replace(/_/g, " ")}, featuring authentic ${project.storyLanguage} dialogue and dynamic pacing.`;

  const synopsisArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "SYNOPSIS" } },
    create: { projectId: projectId as string, artifactType: "SYNOPSIS", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const synCount = await prisma.artifactVersion.count({ where: { artifactId: synopsisArt.id } });
  const synVer = await prisma.artifactVersion.create({
    data: {
      artifactId: synopsisArt.id,
      versionNumber: synCount + 1,
      contentText: synopsisText,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: synopsisArt.id },
    data: { currentVersionId: synVer.id },
  });

  // 5. Save OUTLINE artifact (3-Act Dramatic Structure)
  const act1Scenes = option.scenes.slice(0, 2);
  const act2Scenes = option.scenes.slice(2, 4);
  const act3Scenes = option.scenes.slice(4);

  const outlineJson = {
    acts: [
      {
        actNumber: 1,
        title: "Act I — The Hook & Inciting Event",
        summary: act1Scenes.map((s) => s.action).join(" "),
        sequences: act1Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
      {
        actNumber: 2,
        title: "Act II — Rising Stakes & Confrontation",
        summary: act2Scenes.map((s) => s.action).join(" "),
        sequences: act2Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
      {
        actNumber: 3,
        title: "Act III — Climax & Viral Resolution",
        summary: act3Scenes.map((s) => s.action).join(" "),
        sequences: act3Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
    ],
    estimatedRuntimeMinutes: Math.max(1, Math.round(screenplayJson.totalEstimatedDurationSeconds / 60)),
  };

  const outlineArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "OUTLINE" } },
    create: { projectId: projectId as string, artifactType: "OUTLINE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const outCount = await prisma.artifactVersion.count({ where: { artifactId: outlineArt.id } });
  const outVer = await prisma.artifactVersion.create({
    data: {
      artifactId: outlineArt.id,
      versionNumber: outCount + 1,
      contentText: JSON.stringify(outlineJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: outlineArt.id },
    data: { currentVersionId: outVer.id },
  });

  // 6. Extract Characters & Save CHARACTER_ARCS artifact + Production Assets
  const charMap = new Map<string, { role: string; scenes: string[] }>();
  for (const sc of option.scenes) {
    const matches = (sc.action + " " + (sc.dialogue || "")).match(/\[@([A-Za-z0-9_-]+)\]/g) || [];
    for (const m of matches) {
      const name = m.replace(/\[@|\]/g, "");
      if (!charMap.has(name)) {
        charMap.set(name, {
          role: charMap.size === 0 ? "Protagonist" : "Supporting",
          scenes: [sc.heading],
        });
      } else {
        charMap.get(name)!.scenes.push(sc.heading);
      }
    }
  }

  // Fallback characters if none tagged
  if (charMap.size === 0) {
    charMap.set("Protagonist", { role: "Protagonist", scenes: ["Main Story World"] });
  }

  const charArcsJson = {
    characters: Array.from(charMap.entries()).map(([name, info]) => ({
      name,
      role: info.role,
      arc: `Experiences the primary story beats across ${info.scenes.length} scenes, driving the action in ${info.scenes[0] || "the film"}.`,
    })),
  };

  const charArcArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "CHARACTER_ARCS" } },
    create: { projectId: projectId as string, artifactType: "CHARACTER_ARCS", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const arcCount = await prisma.artifactVersion.count({ where: { artifactId: charArcArt.id } });
  const arcVer = await prisma.artifactVersion.create({
    data: {
      artifactId: charArcArt.id,
      versionNumber: arcCount + 1,
      contentText: JSON.stringify(charArcsJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: charArcArt.id },
    data: { currentVersionId: arcVer.id },
  });

  // Auto-create character assets in Production Bible so Step 2 (Assets) is immediately populated!
  for (const [name, info] of Array.from(charMap.entries())) {
    const existingAsset = await prisma.productionAsset.findFirst({
      where: { projectId: projectId as string, name },
    });
    if (!existingAsset) {
      const attributes = {
        role: info.role,
        age: name.toLowerCase().includes("boy") || name.toLowerCase().includes("karthi") ? 10 : 35,
        wardrobe: "Authentic traditional regional attire matching the story era and culture.",
        googleFlowCharacterPrompt: `8k photorealistic cinematic character portrait of ${name}, authentic cultural features, detailed skin texture, natural expressive eyes, high production value 35mm film still.`,
        voiceProfile: `Authentic ${project.storyLanguage} native speaker, natural conversational cadence, expressive emotional range.`,
      };
      await prisma.productionAsset.create({
        data: {
          projectId: projectId as string,
          name,
          assetType: "CHARACTER",
          description: `${info.role} in ${option.title}`,
          attributes: JSON.stringify(attributes),
          approvalStatus: "APPROVED",
        },
      });
    }
  }

  // 7. Synchronize Database Scenes and Shots
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

