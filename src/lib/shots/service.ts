import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import type { TextGenerationProvider } from "@/lib/providers/types";
import { ShotPlanSchema, snapToOmniDuration } from "./schemas";

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

  const orientationDesc = project.aspectRatio === "PORTRAIT_9_16"
    ? "9:16 Vertical / Portrait (1080x1920) mobile fullscreen framing"
    : project.aspectRatio === "SQUARE_1_1"
    ? "1:1 Square (1080x1080) framing"
    : "16:9 Landscape (1920x1080) cinematic widescreen framing";

  const isCulinary =
    project.visualStyle === "CULINARY_MACRO_ASMR" ||
    (project.sourceIdea || "").toLowerCase().includes("cook") ||
    (project.sourceIdea || "").toLowerCase().includes("cooking") ||
    (project.sourceIdea || "").toLowerCase().includes("asmr") ||
    (project.sourceIdea || "").toLowerCase().includes("culinary") ||
    (project.sourceIdea || "").toLowerCase().includes("recipe") ||
    (project.genre || "").toLowerCase().includes("cooking") ||
    (project.genre || "").toLowerCase().includes("culinary");

  const isVintage =
    !isCulinary &&
    (project.visualStyle === "VINTAGE_FILM" ||
      (project.sourceIdea || "").toLowerCase().includes("1900") ||
      (project.sourceIdea || "").toLowerCase().includes("vintage") ||
      (project.sourceIdea || "").toLowerCase().includes("old years") ||
      (project.genre || "").toLowerCase().includes("historical") ||
      (project.genre || "").toLowerCase().includes("period"));

  const dynamicShotStyleDirective = isCulinary
    ? "ultra-high-definition macro culinary cinema, 50mm/85mm probe macro lens optics, f/1.8 shallow depth of field, glistening natural oils, crisp fresh ingredient textures, natural warm kitchen directional lighting, 60fps high-speed fluid and rising steam physics"
    : isVintage
    ? "authentic 1900s vintage 35mm archival film aesthetic, natural cellulose grain, soft warm sepia and muted earth tones, period-accurate hand-spun khadi garments, no modern clothing"
    : `${project.visualStyle.toLowerCase().replace(/_/g, " ")}, natural cinematic lighting`;

  const charNamesList = characters.map(c => `[@${c.name}]`).join(", ") || "[@CharacterName]";
  const totalTargetSeconds = project.targetRuntime || 60;
  const targetShotCount = Math.max(3, Math.round(totalTargetSeconds / 6));

  const culinaryDirectives = isCulinary ? `
CRITICAL CULINARY ASMR & DYNAMIC MULTI-ANGLE CAMERA RULES:
1. DYNAMIC MULTI-ANGLE CAMERA SEQUENCING (MANDATORY):
   - High-retention cooking ASMR relies on a fast, rhythmic rotation of distinct camera angles and shot sizes!
   - Rhythmically cycle camera angles and shot framing across sequential shots:
     * Shot 1: Wide / Medium Workstation Establishing (showing kitchen space, cutting board, and fresh whole ingredients)
     * Shot 2: Top-Down Flat Lay (90° Bird's Eye view centered on cutting board, geometric ingredient placement)
     * Shot 3: Macro Extreme Close-Up (ECU at 45° angle, razor-sharp shallow DOF on knife blade slicing through crisp produce)
     * Shot 4: Low-Angle Skillet Close-Up (Hot oil shimmering, butter foaming, intense sizzle as food hits pan)
     * Shot 5: First-Person Chef Hands POV (Over-the-shoulder, two hands basting, tossing, or stirring with utensil)
     * Shot 6: Macro Extreme Close-Up (Bubbling sauce reduction, steam rising in slow motion)
     * Shot 7: 45° Close-Up Plating (Tongs arranging food, vibrant garnishing)
     * Shot 8: Macro ECU (Bite / slice cut revealing juicy interior texture and crunch)
   - NEVER repeat the same camera angle or shot size in two consecutive shots!
2. MASTER WORKSTATION & COOKWARE CONTINUITY:
   - Maintain the exact same kitchen countertop, wooden cutting board grain, and cookware style across every shot.
3. CULINARY KINEMATICS & ANTI-HALLUCINATION INVARIANTS:
   - Max two hands in frame (knife grip + claw grip). Strictly PROHIBIT phantom 3rd hands, floating arms, or deformed fingers.
   - Rigid knife grip; cutting board resting firmly on counter; cookware anchored to stove flame.
   - Slicing direction preserves mass: cut pieces remain separated on cutting board, zero morphing food.
4. PURE BINAURAL ASMR AUDIO:
   - 'dialogue' MUST BE EMPTY STRING ("").
   - 'voiceover' MUST BE EMPTY STRING ("").
   - 'audioPrompt' MUST describe ultra-crisp close-mic Foley (crisp wood chop click, sizzling oil crackle, butter foaming, water pouring, steam hiss - NO dialogue, NO voiceover, NO loud music).
` : "";

  const result = await provider.generateStructured({
    modelId,
    systemPrompt: `You are an elite film director, master cinematographer, and AI prompt engineer creating a complete Shot List with DIRECT-TO-VIDEO generation prompts (optimized for Google Flow / Omni 1.1 Flash / Veo 2, Kling v3, Sora, and Runway) for a ${project.visualStyle.replace(/_/g, " ")} film.
Film Title: "${project.title}"
Source Idea & Era: "${project.sourceIdea}"
Target Film Total Runtime: ${totalTargetSeconds} seconds (~${targetShotCount} shots total).
Target Story Language for Voice-over and Dialogue: "${project.storyLanguage}".
Film Framing & Orientation: ${orientationDesc}.
${culinaryDirectives}

CRITICAL RULES FOR GOOGLE FLOW VIDEO GENERATION:
1. QUANTIZED DURATIONS (MINIMUM 8 SECONDS STANDARD):
   - Durations MUST be strictly minimum 8 seconds: either 8 or 10 seconds. (Google Flow Omni 1.1 Flash supports 8s and 10s; do NOT use 4s or 6s because 4-6 seconds is too short for realistic cinematic action, full spoken dialogue, and camera movement, causing incomplete cuts).
   - Use 8s for dialogue beats and standard action; use 10s for dramatic climax and complex action.

2. AUDIO MUTUAL EXCLUSIVITY RULE (DIALOGUE VS VOICE-OVER):
   - In any single shot, NEVER have both character dialogue AND a voice-over narrator simultaneously!
   - If a character is speaking on screen:
     - 'dialogue' contains the spoken line in ${project.storyLanguage}: e.g. [@CharacterName] speaks: "[dialogue in ${project.storyLanguage}]".
     - 'voiceover' MUST BE EMPTY STRING ("").
     - In 'videoPrompt', format: "[@CharacterName] [action]. Camera: [movement]. Dialogue: [@CharacterName] speaks: \\"[line]\\". Atmosphere: [Foley]. Visual Style: [style]." (Do NOT include a Voice-Over line!)
   - If NO character is speaking on screen (silent running, wide establishing shot, dramatic pause, landscape):
     - 'dialogue' MUST BE EMPTY STRING ("").
     - 'voiceover' can contain a third-person narrative beat in "${project.storyLanguage}", OR empty string for pure ambient sound.
     - In 'videoPrompt', format: "[action beat]. Camera: [movement]. Voice-Over: \\"[narration]\\". Atmosphere: [Foley]. Visual Style: [style]." (Do NOT include Dialogue!)

3. CHARACTER TAGS & PLACEHOLDERS: Characters are referenced using square-bracketed placeholder tags (e.g., ${charNamesList}).
   In Google Flow, typing '@' or matching the placeholder links the shot directly to the character's locked appearance and voice!

4. STRICT WARDROBE & PHYSICAL CONTINUITY LOCK:
   - For every shot featuring a character, ALWAYS maintain their EXACT approved wardrobe.
   - For example, if [@Karthi] wears faded cotton half-shorts and a short-sleeve shirt, barefoot, HE MUST WEAR THAT EXACT SAME ATTIRE IN EVERY SINGLE SHOT. NEVER switch to full pants or change clothing between scenes!
   - Weave their locked wardrobe into action and video prompts: e.g. "[@Karthi] (wearing faded cotton half-shorts and shirt, barefoot)..."

5. PHYSICAL SKELETAL REALISM & CAMERA-FACING ALIGNMENT (PREVENT BODY COLLAPSE / HEAD-TWISTING):
   - When a character speaks dialogue while running or moving, the camera MUST track BACKWARD ahead of the character, facing the character's front torso and face!
   - NEVER place the camera behind a character chasing them while instructing them to lip-sync dialogue, because video models contort and collapse the character's neck and body 180 degrees backwards to face the camera!
   - Both the character's locomotion and gaze must align forward: 'Dynamic low-angle backward tracking shot moving smoothly ahead of [@Character], facing their front torso and terrified facial expression as they sprint forward directly toward camera down the path.'

8. AIRTIGHT DRAMATIC CAUSE-AND-EFFECT & DIALOGUE LOGIC:
   - Every shot's action and spoken dialogue MUST have a clear, logical causal chain.
   - If Character B reacts in shock or asks a question (e.g. Amma dropping a basket and asking 'Why are you shouting in terror?'), the action line MUST explicitly depict what caused that reaction (e.g. Character A's frantic shouting echoing from the path, bursting into the courtyard trembling, gasping for breath, pointing back in terror toward the wild elephant).
   - Ensure seamless narrative continuity: each shot must logically pick up from the physical and emotional consequence of the preceding shot.

7. VEHICULAR & DRAFT ANIMAL HARNESS INTEGRITY:
   - For any cart, carriage, or wagon featuring draft animals (e.g. bullocks, oxen, horses), draft animals MUST be hitched strictly and exclusively to the FRONT wooden yoke pole facing forward.
   - Explicitly forbid animals tied to the rear or back of the vehicle, forbid animals appearing on both front and rear ends of the same vehicle, and forbid duplicate or morphing livestock.


MASTER CHARACTER ANCHORS:
${characterGuide}

MASTER LOCATIONS:
${locationGuide}
${propsGuide}
`,
    userPrompt: `Break this screenplay into scenes and individual shots (each strictly 8 or 10 seconds - minimum 8s).
Total Film Target Runtime: ${totalTargetSeconds} seconds (~${targetShotCount} shots total). Plan the scenes and shots so the total duration approximately matches ${totalTargetSeconds} seconds.
Screenplay:
${screenplayText.slice(0, 7000)}

For EACH shot provide:
1. shotNumber: sequential shot number (1, 2, 3...)
2. actionDescription: 1-2 sentences clearly describing the physical visual action happening in this shot.
3. shotSize: Framing size (e.g. "Close-Up", "Medium Shot", "Wide Shot", "Extreme Close-Up", "Top-Down Flat Lay"). ${isCulinary ? "MANDATORY: Frequently alternate shotSize across shots (Wide -> Top-Down -> Macro ECU -> Close-Up -> Chef POV) - never repeat consecutive shot sizes!" : ""}
4. cameraMovement: Specific camera motion (e.g. "Low-angle backward tracking shot forward at 24fps", "Smooth lateral pan", "Dynamic handheld tracking", "Overhead static drift", "Macro 85mm probe lens rack focus").
5. lighting: Lighting direction and mood (e.g. "Golden hour backlight with warm dust motes", "Warm culinary spotlight with soft background blur").
6. characterTag: The primary character placeholder tag featured (e.g. ${characters[0] ? `[@${characters[0].name}]` : "[@Character]"}, or "" if none).
7. characterConsistencyAnchor: The locked character visual identity from the Character Anchor above (for fallback / Kling / Midjourney).
8. videoPrompt: A complete DIRECT VIDEO GENERATION PROMPT formatted for Google Flow (Omni 1.1 Flash / Veo 2).
   Format:
   "[@CharacterName] [action and movement across the shot]. Camera: [framing, 35mm lens, smooth camera movement at 24fps]. [Dialogue OR Voice-Over according to mutual exclusivity rule]. Atmosphere: [ambient Foley cues]. ${dynamicShotStyleDirective}, ${orientationDesc}."
9. imagePrompt: Period-authentic visual still prompt matching ${dynamicShotStyleDirective}, ${orientationDesc}.
10. voiceover: Compelling voice-over narration line in "${project.storyLanguage}" (ONLY when NO character is speaking; otherwise leave empty string "").
11. dialogue: Spoken character speech in "${project.storyLanguage}" (formatted as '[@CHARACTER] speaks: "..."'; leave empty string "" if no character speaks).
12. audioPrompt: Sound effects, ambient Foley, and music score mood.
13. targetDurationSeconds: duration in seconds (MUST BE STRICTLY 8 or 10 - minimum 8 seconds).

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
      const duration = snapToOmniDuration(sh.targetDurationSeconds);
      const cleanDialogue = sh.dialogue?.trim() || "";
      const hasDialogue = cleanDialogue.length > 0;
      const cleanVoiceover = hasDialogue ? "" : (sh.voiceover?.trim() || "");

      // Ensure actionDescription is never empty
      let actionDesc = sh.actionDescription?.trim() || "";
      if (!actionDesc && sh.videoPrompt) {
        const match = sh.videoPrompt.match(/^([^.]+?\.)/);
        actionDesc = match ? match[1] : sh.videoPrompt.slice(0, 120);
      }

      const audioData = JSON.stringify({
        voiceover: cleanVoiceover,
        dialogue: cleanDialogue,
        audioPrompt: sh.audioPrompt ?? sh.soundEffects ?? "",
        characterAnchor: sh.characterConsistencyAnchor ?? "",
        characterTag: sh.characterTag ?? "",
      });

      await prisma.shot.create({
        data: {
          sceneId: scene.id,
          projectId,
          shotNumber: sh.shotNumber,
          actionDescription: actionDesc,
          shotSize: sh.shotSize,
          cameraAngle: sh.cameraAngle,
          cameraMovement: sh.cameraMovement,
          lighting: sh.lighting,
          mood: sh.mood,
          imagePrompt: sh.imagePrompt,
          videoPrompt: sh.videoPrompt,
          negativeConstraints: audioData,
          targetDurationSeconds: duration,
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
