import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { logger } from "@/lib/logger";

const regenerateSchema = z.object({
  sceneNumber: z.number().int().min(1),
  instructions: z.string().optional(),
  modelId: z.string().optional(),
});

const SingleSceneSchema = z.object({
  sceneNumber: z.number(),
  heading: z.string(),
  location: z.string(),
  timeOfDay: z.string(),
  action: z.string(),
  voiceover: z.string().optional().default(""),
  dialogue: z.string().optional().default(""),
  audioScript: z.string().optional().default(""),
  soundEffects: z.string().optional().default(""),
  estimatedDurationSeconds: z.number().default(8),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: {
      productionAssets: { where: { assetType: "CHARACTER" } }
    }
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = regenerateSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid request parameters");

  const { sceneNumber, instructions, modelId } = parsed.data;

  // 1. Find Screenplay Artifact
  const artifact = await prisma.storyArtifact.findFirst({
    where: { projectId: projectId as string, artifactType: "SCREENPLAY" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (!artifact || !artifact.versions[0]) {
    throw badRequest("No screenplay found to regenerate scene for. Generate a screenplay first.");
  }

  let screenplayData: { title: string; scenes: any[] };
  try {
    screenplayData = JSON.parse(artifact.versions[0].contentText);
  } catch {
    throw badRequest("Failed to parse existing screenplay data.");
  }

  const sceneIndex = screenplayData.scenes.findIndex(s => s.sceneNumber === sceneNumber);
  if (sceneIndex === -1) {
    throw notFound(`Scene ${sceneNumber} not found in screenplay.`);
  }

  const currentScene = screenplayData.scenes[sceneIndex];
  const prevScene = sceneIndex > 0 ? screenplayData.scenes[sceneIndex - 1] : null;
  const nextScene = sceneIndex < screenplayData.scenes.length - 1 ? screenplayData.scenes[sceneIndex + 1] : null;

  // Character guide for continuity
  const characterGuide = project.productionAssets.map(c => {
    let attr: any = {};
    try { attr = JSON.parse(c.attributes || "{}"); } catch {}
    return `- ${c.name} (Role: ${attr.role || "Character"}, Age: ${attr.age || "unknown"}): ${c.description}. Wardrobe: ${attr.wardrobe || "traditional regional clothing"}.`;
  }).join("\n");

  // 2. Resolve text generation provider (Gemini / OpenAI)
  const { provider, modelId: resolvedModelId } = await resolveTextProvider(ownerId, false);

  const systemPrompt = `You are an elite film director, master screenwriter, and AI prompt architect.
Film Visual Style: ${project.visualStyle.replace(/_/g, " ")}.
Film Language for Dialogue and Voiceover: "${project.storyLanguage}".

CRITICAL DRAMATIC CAUSE-AND-EFFECT & CONTINUITY RULES:
1. Rewrite ONLY Scene ${sceneNumber} based on the director's specific instructions.
2. Maintain strict narrative causality with preceding Scene ${prevScene ? prevScene.sceneNumber : "N/A"} and following Scene ${nextScene ? nextScene.sceneNumber : "N/A"}.
3. Every reaction, gasp, or question MUST have a clear physical cause (e.g. hearing shouts in advance, trembling in terror, visible actions).
4. Audio mutual exclusivity: If characters are speaking dialogue, keep voiceover empty (""). Character dialogue MUST be written in authentic native "${project.storyLanguage}".
5. Character continuity: Maintain locked names and wardrobe.

Characters:
${characterGuide || "Authentic regional characters."}`;

  const userPrompt = `Rewrite Scene ${sceneNumber} for this film.

Current Scene ${sceneNumber}:
Heading: ${currentScene.heading}
Action: ${currentScene.action}
Dialogue: ${currentScene.dialogue || "None"}
Voiceover: ${currentScene.voiceover || "None"}

Preceding Scene (${prevScene ? `Scene ${prevScene.sceneNumber}: ${prevScene.heading}` : "None"}):
${prevScene ? `Action: ${prevScene.action}\nDialogue: ${prevScene.dialogue || "None"}` : "Opening Scene"}

Following Scene (${nextScene ? `Scene ${nextScene.sceneNumber}: ${nextScene.heading}` : "None"}):
${nextScene ? `Action: ${nextScene.action}\nDialogue: ${nextScene.dialogue || "None"}` : "Final Scene"}

Director's Specific Instructions for this Scene:
${instructions && instructions.trim().length > 0 ? instructions : "Make the dramatic action sharper, more vivid, and ensure airtight emotional cause-and-effect between characters."}

Return JSON with:
sceneNumber: ${sceneNumber}
heading: scene heading (e.g. ${currentScene.heading})
location: location name
timeOfDay: time of day
action: 2-3 sentences of vivid, cinema-ready visual action in English
voiceover: voiceover narration in "${project.storyLanguage}" (leave empty "" if character speaks)
dialogue: character spoken line in "${project.storyLanguage}" formatted as '[@Character] speaks: "..."' (leave empty "" if no speech)
audioScript: sound design, Foley, ambience
soundEffects: key SFX
estimatedDurationSeconds: duration (strictly 8 or 10)`;

  logger.info({ projectId, sceneNumber, instructions }, "Regenerating scene with AI");

  const result = await provider.generateStructured({
    modelId: resolvedModelId,
    systemPrompt,
    userPrompt,
    schema: SingleSceneSchema,
  });

  const updatedScene = result.data;
  screenplayData.scenes[sceneIndex] = updatedScene;

  // 3. Save new ArtifactVersion on Screenplay
  const count = await prisma.artifactVersion.count({ where: { artifactId: artifact.id } });
  const newVersion = await prisma.artifactVersion.create({
    data: {
      artifactId: artifact.id,
      versionNumber: count + 1,
      contentText: JSON.stringify(screenplayData, null, 2),
      source: "AI",
      createdByUserId: ownerId,
      modelId: resolvedModelId,
      providerId: provider.id,
    },
  });

  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data: { currentVersionId: newVersion.id, approvalStatus: "DRAFT" },
  });

  // 4. Synchronize with database Scene and Shot records (so Storyboard is in real-time sync)
  const dbScene = await prisma.scene.findFirst({
    where: { projectId: projectId as string, sceneNumber },
    include: { shots: { orderBy: { shotNumber: "asc" } } },
  });

  if (dbScene) {
    await prisma.scene.update({
      where: { id: dbScene.id },
      data: {
        heading: updatedScene.heading,
        location: updatedScene.location,
        timeOfDay: updatedScene.timeOfDay,
        actionSummary: updatedScene.action.slice(0, 255),
        estimatedDurationSeconds: updatedScene.estimatedDurationSeconds || 8,
      },
    });

    // If shots exist for this scene, update the primary shot
    if (dbScene.shots.length > 0) {
      const primaryShot = dbScene.shots[0];
      let existingAudio: any = {};
      try { existingAudio = JSON.parse(primaryShot.negativeConstraints || "{}"); } catch {}

      const mergedAudio = {
        ...existingAudio,
        dialogue: updatedScene.dialogue || "",
        voiceover: updatedScene.voiceover || "",
        audioPrompt: updatedScene.audioScript || updatedScene.soundEffects || existingAudio.audioPrompt || "",
      };

      await prisma.shot.update({
        where: { id: primaryShot.id },
        data: {
          actionDescription: updatedScene.action,
          targetDurationSeconds: updatedScene.estimatedDurationSeconds || 8,
          negativeConstraints: JSON.stringify(mergedAudio),
        },
      });
    }
  }

  return {
    ok: true,
    scene: updatedScene,
    screenplay: screenplayData,
  };
});
