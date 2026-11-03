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
  logger.info({ projectId }, "shot planning starting with character consistency");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  // Load Production Bible assets (Characters, Locations, Props) to enforce character consistency across all shots
  const assets = await prisma.productionAsset.findMany({ where: { projectId } });
  const characters = assets.filter((a) => a.assetType === "CHARACTER");
  const locations = assets.filter((a) => a.assetType === "LOCATION");
  const props = assets.filter((a) => a.assetType === "PROP");

  const characterGuide = characters.length > 0
    ? characters.map((c) => {
        const attr = JSON.parse(c.attributes || "{}");
        return `[CHARACTER ANCHOR - "${c.name}"]: ${c.description}. Wardrobe: ${attr.wardrobe || "Standard"}. Age: ${attr.age || "N/A"}. Demeanor: ${attr.personality || "Grounded"}.`;
      }).join("\n\n")
    : "Extract characters directly from screenplay with unwavering physical traits.";

  const locationGuide = locations.length > 0
    ? locations.map((l) => {
        const attr = JSON.parse(l.attributes || "{}");
        return `[LOCATION ANCHOR - "${l.name}"]: ${l.description}. Lighting: ${attr.lighting || "Natural"}.`;
      }).join("\n")
    : "Locations derived from screenplay.";

  const propsGuide = props.length > 0
    ? props.map((p) => `[PROP - "${p.name}"]: ${p.description}`).join("\n")
    : "";

  const result = await provider.generateStructured({
    modelId,
    systemPrompt: `You are an elite film director, master cinematographer, and AI prompt engineer creating a complete Shot List with DIRECT-TO-VIDEO generation prompts (optimized for Google Flow / Veo 2, Kling v3, Sora, and Runway) for a ${project.visualStyle.replace(/_/g, " ")} film.
Target Story Language for Voice-over and Dialogue: "${project.storyLanguage}".

CRITICAL RULE FOR AI VIDEO GENERATION (GOOGLE FLOW / VEO):
Modern video AI tools generate the video directly without needing a still image. To maintain character consistency across shots, EVERY shot's 'videoPrompt' MUST explicitly include the character's locked visual identity, the environment, camera movement, temporal action, lighting, and audio beat.

MASTER CHARACTER CONSISTENCY ANCHORS (USE THESE EXACTLY IN PROMPTS):
${characterGuide}

MASTER LOCATIONS:
${locationGuide}
${propsGuide}
`,
    userPrompt: `Break this screenplay into scenes and individual shots (each 3-8 seconds).
Screenplay:
${screenplayText.slice(0, 7000)}

For EACH shot provide:
1. characterConsistencyAnchor: The exact character identity description used for this shot (e.g. Murugan, age, skin tone, facial hair, clothing) so character consistency is locked in.
2. videoPrompt: A complete, self-contained MASTER DIRECT VIDEO GENERATION PROMPT (optimized for Google Flow / Veo and Kling). It MUST include:
   - [Character Identity]: The exact character description from the Character Anchor above (age, face, clothing).
   - [Camera & Lens]: Specific framing (e.g. Medium Close-up), lens (e.g. 35mm anamorphic), and dynamic camera movement (e.g. slow smooth push-in at 24fps with subtle organic handheld float).
   - [Motion & Action]: Specific physical action unfolding across the shot duration (e.g. how the character moves, expressions, gestures).
   - [Lighting & Setting]: Natural daylight, volumetric sunbeams, atmospheric dust, documentary realism.
   - [Audio Beat]: Voiceover or dialogue in "${project.storyLanguage}".
3. imagePrompt: Photorealistic 16:9 widescreen still prompt.
4. voiceover: Compelling voice-over narration line in "${project.storyLanguage}".
5. dialogue: Spoken character speech in "${project.storyLanguage}" (formatted as 'CHARACTER: "..."').
6. audioPrompt: Sound effects, ambient Foley, and music score mood.
7. targetDurationSeconds: duration in seconds (3-8s).

Return JSON matching ShotPlanSchema.`,
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
      const audioData = JSON.stringify({
        voiceover: sh.voiceover ?? "",
        dialogue: sh.dialogue ?? "",
        audioPrompt: sh.audioPrompt ?? sh.soundEffects ?? "",
        characterAnchor: sh.characterConsistencyAnchor ?? "",
      });

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
          negativeConstraints: audioData,
          targetDurationSeconds: sh.targetDurationSeconds,
          aspectRatio: project.aspectRatio === "PORTRAIT_9_16" ? "9:16" : "16:9",
          approvalStatus: "DRAFT",
        },
      });
    }
  }
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
          negativeConstraints: audioData,
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
