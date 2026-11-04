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

CRITICAL RULE FOR GOOGLE FLOW VIDEO GENERATION:
In Google Flow, characters are created first in the left sidebar "Characters" menu with a dedicated character generation prompt and voice profile.
Then, in each scene's video prompt, the character is referenced using their tag with the '@' symbol (e.g., @Murugan, @Selvi).
Google Flow natively links @[CharacterName] to the locked character model, facial identity, and voice!
In the prompt itself, character dialogue is embedded as:
"Dialogue: @[CharacterName] speaks in [tone]: \\"[spoken line in ${project.storyLanguage}]\\""

MASTER CHARACTER ANCHORS:
${characterGuide}

MASTER LOCATIONS:
${locationGuide}
${propsGuide}
`,
    userPrompt: `Break this screenplay into scenes and individual shots (each 3-8 seconds).
Screenplay:
${screenplayText.slice(0, 7000)}

For EACH shot provide:
1. characterTag: The @-mention of the primary character featured (e.g. "@Murugan", "@Selvi", or "" if none).
2. characterConsistencyAnchor: The locked character visual identity from the Character Anchor above (for fallback / Kling / Midjourney).
3. videoPrompt: A complete DIRECT VIDEO GENERATION PROMPT formatted for Google Flow (Omni Flash / Veo 2).
   Format:
   "@[CharacterName] [action and movement across the shot]. Camera: [framing, 35mm lens, smooth camera movement at 24fps]. Dialogue: @[CharacterName] speaks: \\"[dialogue in ${project.storyLanguage}]\\". Voice-Over: \\"[narration in ${project.storyLanguage}]\\". Atmosphere: [ambient Foley cues]. 4k cinematic documentary photorealism, natural daylight."
4. imagePrompt: Photorealistic 16:9 widescreen still prompt.
5. voiceover: Compelling voice-over narration line in "${project.storyLanguage}".
6. dialogue: Spoken character speech in "${project.storyLanguage}" (formatted as '@CHARACTER speaks: "..."').
7. audioPrompt: Sound effects, ambient Foley, and music score mood.
8. targetDurationSeconds: duration in seconds (3-8s).

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
        characterTag: sh.characterTag ?? "",
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

  await prisma.project.update({
    where: { id: projectId },
    data: { currentStage: "STORYBOARD" },
  });

  logger.info({ projectId }, "shot planning complete");
}
