/**
 * Universal Cinematic Prompt Compiler (spec §8, §15, ADR-005)
 *
 * Transforms any raw scene action, regardless of genre or concept, into
 * physically grounded, multi-engine prompt bundles with full kinematic
 * invariants and anti-hallucination negative matrices.
 */

import {
  detectPhysicalEntities,
  UNIVERSAL_PHYSICAL_LAWS,
  type DetectedEntities,
} from "./world-engine";

export interface CompilePromptOptions {
  actionDescription: string;
  shotSize?: string | null;
  cameraMovement?: string | null;
  lighting?: string | null;
  dialogue?: string | null;
  voiceover?: string | null;
  audioPrompt?: string | null;
  characterName?: string | null;
  characterDescription?: string | null;
  wardrobeLock?: string | null;
  locationDescription?: string | null;
  aspectRatio?: string | null; // PORTRAIT_9_16 | LANDSCAPE_16_9 | SQUARE_1_1
  storyLanguage?: string | null;
  targetDurationSeconds?: number | null;
  creditSaverMode?: boolean; // Default true: uses Standard 10-credit mode & 1080p HD instead of expensive 25-35 credit Pro mode
}

export interface CompiledPromptBundle {
  googleFlowPrompt: string;
  klingPrompt: string;
  fluxStillPrompt: string;
  chatgptPrompt: string;
  geminiPrompt: string;
  videoMotionPrompt: string;
  scriptPrompt: string;
  entities: DetectedEntities;
  universalNegativePrompt: string;
  creditCostEstimate: string;
}

export function compileCinematicPrompt(options: CompilePromptOptions): CompiledPromptBundle {
  const {
    actionDescription,
    shotSize,
    cameraMovement,
    lighting,
    dialogue,
    voiceover,
    audioPrompt,
    characterName,
    characterDescription,
    wardrobeLock,
    locationDescription,
    aspectRatio,
    storyLanguage,
    targetDurationSeconds,
  } = options;

  const entities = detectPhysicalEntities(actionDescription);
  const lang = storyLanguage || "Tamil";
  const isCreditSaver = options.creditSaverMode !== false; // default true: 10 credits Standard mode
  const klingModeFlag = isCreditSaver ? "--mode std" : "--mode pro";
  const creditCostEstimate = isCreditSaver ? "10 credits (Standard Mode - 66 free daily credits allows ~6 videos)" : "25–35 credits (Pro Mode)";
  const qualityDescriptor = isCreditSaver ? "1080p Full HD" : "4K master grade";

  // 1. Duration Quantization (Google Flow / Omni 1.1 Flash minimum 8s standard)
  const rawDuration = targetDurationSeconds || 8;
  const normalizedDuration = rawDuration >= 9 ? 10 : 8;
  const targetDurationLabel = `${normalizedDuration} seconds`;

  // 2. Aspect Ratio & Framing
  const isPortrait = aspectRatio === "PORTRAIT_9_16";
  const isSquare = aspectRatio === "SQUARE_1_1";
  const arParam = isPortrait ? "9:16" : isSquare ? "1:1" : "16:9";
  const orientationLabel = isPortrait
    ? "9:16 Vertical / Portrait (1080x1920) - Mobile Fullscreen"
    : isSquare
    ? "1:1 Square (1080x1080)"
    : "16:9 Landscape (1920x1080) - Cinematic Film";
  const framingDesc = isPortrait ? "9:16 vertical mobile portrait" : "16:9 widescreen cinematic";

  const shotFraming = shotSize
    ? shotSize.toLowerCase().endsWith("shot")
      ? shotSize
      : `${shotSize} Shot`
    : "Medium Shot";

  // 3. Clean and normalize actions
  const rawAction = actionDescription.trim();
  const naturalAction = rawAction
    .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim();

  const actionCleaned = naturalAction
    .replace(/\((?:wearing|dressed in)[^)]*\)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".")
    .trim();

  // 4. Character Tagging and Wardrobe Lock
  const charName = characterName || "Character";
  const bracketedCharTag = `[@${charName.replace(/[^a-zA-Z0-9]/g, "")}]`;

  let taggedAction = rawAction;
  if (!taggedAction.includes("[@") && characterName) {
    taggedAction = `${bracketedCharTag} ${taggedAction}`;
  }
  if (wardrobeLock && taggedAction.includes(bracketedCharTag)) {
    const hasWardrobe = /wearing|dressed in|shorts|saree|dhoti|veshti|pants/i.test(taggedAction);
    if (!hasWardrobe) {
      taggedAction = taggedAction.replace(
        bracketedCharTag,
        `${bracketedCharTag} (wearing ${wardrobeLock})`,
      );
    }
  }

  // 5. Camera Movement Resolution
  let cameraMotion = "Subtle cinematic handheld camera motion at 24fps with natural organic float";
  if (cameraMovement && cameraMovement !== "Static" && !cameraMovement.includes("[PRODUCTION SPECS]")) {
    cameraMotion = cameraMovement;
  }
  const naturalCameraMotion = cameraMotion
    .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .trim();

  // 6. Dialogue vs Voiceover Mutual Exclusivity
  let formattedDialogue = dialogue ? dialogue.trim() : "";
  if (formattedDialogue) {
    if (!formattedDialogue.includes("[@") && !formattedDialogue.includes("@")) {
      formattedDialogue = `${bracketedCharTag} speaks: ${formattedDialogue}`;
    }
  }
  const hasDialogue = Boolean(formattedDialogue && formattedDialogue.length > 0);
  const naturalDialogue = formattedDialogue
    ? formattedDialogue.replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1").replace(/@([A-Za-z0-9_-]+)/g, "$1").trim()
    : "";

  const audioScriptLines: string[] = [];
  if (hasDialogue) {
    audioScriptLines.push(`- Spoken Dialogue: ${formattedDialogue} (with natural ${lang} lip-synchronization)`);
  } else if (voiceover && voiceover.trim().length > 0) {
    audioScriptLines.push(`- Voice-Over (Narrator): "${voiceover.trim()}"`);
  } else {
    audioScriptLines.push(`- Atmosphere: Pure visual action & ambient Foley (No spoken dialogue or voice-over)`);
  }
  if (audioPrompt) {
    audioScriptLines.push(`- Audio Atmosphere & Foley: ${audioPrompt.trim()}`);
  }

  // 7. Assemble Universal Negative Constraints Matrix
  const negativeList: string[] = [
    "CGI",
    "3D render",
    "cartoon",
    "anime",
    "plastic skin",
    "distorted anatomy",
    "extra limbs",
    "motion jitter",
    "blur",
    "subtitles",
    "watermark",
    "text",
  ];

  // Skeletal negatives
  negativeList.push(
    "backwards head",
    "twisted neck",
    "180 degree head rotation",
    "broken spine",
    "contorted body",
    "disjointed torso",
    "mismatched limbs",
  );

  // Mechanical / Draft animal negatives if vehicles or animals are detected
  if (entities.hasVehicleOrMount) {
    negativeList.push(
      "animals hitched to rear of cart",
      "bull tied behind vehicle",
      "animals hitched to both ends of vehicle",
      "duplicate bulls",
      "two-headed cart",
      "morphing livestock",
      "backwards bull",
      "detached wheels",
      "floating carriage",
    );
  }

  // Prop negatives if handheld props detected
  if (entities.hasHandheldProp) {
    negativeList.push("floating prop", "duplicated object", "extra fingers", "morphing weapon");
  }

  // Period setting negatives
  if (entities.hasPeriodSetting) {
    negativeList.push("modern western clothing", "full pants", "long trousers", "modern wristwatch", "sneakers");
  }

  const universalNegativePrompt = Array.from(new Set(negativeList)).join(", ");

  // 8. Build Google Flow / Veo Structured Master Prompt
  const flowRules: string[] = [
    `- Constraints & Negative Directives: Only the active speaking character moves their lips; accurate natural ${lang} lip synchronization; maintain exact locked character face, wardrobe, and clothing; avoid 3D render, CGI, cartoon, anime, plastic skin, morphing, multiple limbs, distorted hands, modern western faces, jittery camera motion, blur; no generated subtitles or on-screen text overlays.`,
    `- ${UNIVERSAL_PHYSICAL_LAWS.SKELETAL_ALIGNMENT}`,
    `- ${UNIVERSAL_PHYSICAL_LAWS.SPATIAL_DEPTH_SEPARATION}`,
  ];

  if (entities.hasVehicleOrMount) {
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.MECHANICAL_PROPULSION}`);
  }
  if (entities.hasHandheldProp) {
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.PROP_MANIPULATION}`);
  }

  const googleFlowPrompt = [
    taggedAction,
    "",
    `[PRODUCTION SPECS]:`,
    `- Target Duration: ${targetDurationLabel}`,
    `- Aspect Ratio & Orientation: ${orientationLabel}`,
    `- Camera Framing & Lens: ${shotFraming}, 35mm lens, 24fps motion blur`,
    `- Camera Movement & Dynamics: ${cameraMotion}`,
    `- Lighting: ${lighting || "Natural daylight, soft golden illumination, realistic shadows, documentary realism"}`,
    "",
    `[AUDIO & SCRIPT]:`,
    ...audioScriptLines,
    "",
    `[VISUAL STYLE & PHYSICAL INVARIANTS]:`,
    `- Visual Style: 4K photorealistic cinematic documentary film, 35mm lens, authentic cultural textures, shallow depth of field, 24fps`,
    wardrobeLock
      ? `- Character Wardrobe Lock: ${bracketedCharTag} strictly wears ${wardrobeLock}. Maintain 100% clothing and physical consistency across every scene.`
      : null,
    ...flowRules,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // 9. Build Kling / Sora Prompt (Credit-Optimized)
  const klingPrompt = [
    `A cinematic ${qualityDescriptor} ${framingDesc} film scene.`,
    characterName
      ? `Subject: ${characterName}, an authentic character with ${(characterDescription || "authentic regional traits").replace(/\.+$/, "")}, strictly wearing ${wardrobeLock || "traditional clothing"}.`
      : null,
    `Action & Dynamics: ${actionCleaned}.`,
    `Camera & Composition: ${shotFraming}, ${naturalCameraMotion}, shot on 35mm master anamorphic lens, realistic motion blur at 24fps.`,
    `Environment & Atmosphere: ${(locationDescription || "Authentic film location").replace(/\.+$/, "")}. Lighting: ${(lighting || "warm golden hour natural afternoon sunlight").replace(/\.+$/, "")}.${audioPrompt ? ` Foley ambience: ${audioPrompt.replace(/\.+$/, "")}.` : ""}`,
    hasDialogue
      ? `Dialogue & Lip Sync: ${charName} actively speaks dialogue with realistic, perfectly synchronized ${lang} lip movements and expressive facial animation.`
      : `Audio Pace: Pure visual cinema action and environmental Foley, no spoken character dialogue.`,
    entities.hasVehicleOrMount
      ? `Vehicular Invariant: Draft animals must be hitched strictly and exclusively to the front yoke facing forward; no animals at the rear.`
      : null,
    `Aesthetics: Photorealistic 1080p cinema footage, authentic human skin pores with subtle perspiration, natural textile cloth physics, grounded realism, shallow depth of field.`,
    `--ar ${arParam} ${klingModeFlag} --negative "${universalNegativePrompt}"`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".");

  // 10. Build FLUX.1 Still Reference Prompt (Fast, clean 1080p without token bloating)
  const fluxStillPrompt = [
    `A breathtaking 1080p cinematic documentary film still, ${shotFraming}.`,
    characterName
      ? `Subject: ${characterName}, ${(characterDescription || "authentic appearance").replace(/\.+$/, "")}${wardrobeLock ? `, strictly wearing ${wardrobeLock}` : ""}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${(locationDescription || "Authentic cinematic setting").replace(/\.+$/, "")}.`,
    `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting || "warm natural golden hour sunlight, soft shadows"}, shallow depth of field, authentic human skin pores, Kodak Portra 400 film grain, 24fps motion blur, realistic cloth textile folds.`,
    `Strict Aesthetics: Ultra-photorealistic documentary cinema masterpiece, true-to-life skin tones. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern western clothing.`,
    entities.hasVehicleOrMount
      ? `Vehicular & Animal Integrity: Any draft animals must be hitched strictly and exclusively to the front wooden yoke pole facing forward; strictly NO animals behind or at the rear of carts; strictly NO duplicate animals or animals on both sides of a vehicle.`
      : null,
    entities.hasHandheldProp
      ? `Prop Integrity: Handheld items must be firmly held by a single hand with fingers wrapped around the handle; no floating objects.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  // 11. Build ChatGPT / Gemini Prompts
  const chatgptPrompt = [
    `Create a highly detailed, photorealistic ${framingDesc} film still from a cinematic film.`,
    characterName
      ? `Subject: ${characterName}, ${characterDescription || "authentic character"}. Wardrobe lock: strictly wearing ${wardrobeLock || "traditional clothing"}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${locationDescription || "Cinematic setting"}.`,
    `Lighting & Mood: ${lighting || "Natural golden hour daylight, soft shadows, warm highlights"}.`,
    `Camera & Composition: ${shotFraming}, ${naturalCameraMotion}, 35mm prime lens, natural optical bokeh, 24fps film motion aesthetic.`,
    hasDialogue
      ? `Spoken Dialogue Beat: ${naturalDialogue} (Authentic ${lang} dialect, natural conversational pacing)`
      : voiceover
      ? `Voice-Over Beat: "${voiceover}"`
      : `Soundscape Atmosphere: ${audioPrompt || "Ambient rural environment"}`,
    `Style & Realism: Authentic documentary realism, true-to-life skin tones with subtle perspiration and dust, natural woven fabric folds, Kodak 35mm film grain, 1080p Full HD resolution.`,
    `Physical Invariants: Strict forward skeletal alignment; no backward head rotation; draft animals hitched exclusively at the front yoke of vehicles; no animals behind carts or on both ends.`,
    `Negative Constraints: ${universalNegativePrompt}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const geminiPrompt = [
    `Cinematic ${framingDesc} photorealistic film still.`,
    characterName
      ? `Character: ${characterName}, ${characterDescription || "authentic appearance"}. Attire: strictly wearing ${wardrobeLock || "traditional clothing"}.`
      : null,
    `Visual Action: ${actionCleaned}.`,
    `Setting & Background: ${locationDescription || "Cinematic setting"}.`,
    `Cinematography: ${shotFraming}, ${naturalCameraMotion}, 35mm anamorphic prime lens, high dynamic range with natural sunlight falloff.`,
    hasDialogue
      ? `Character Dialogue Context: ${naturalDialogue}`
      : voiceover
      ? `Voiceover Context: "${voiceover}"`
      : `Atmosphere: ${audioPrompt || "Quiet rural stillness"}`,
    `Film Aesthetics: 1080p Full HD, authentic cultural textures, grounded realism, neutral film grain, realistic depth of field.`,
    `Vehicular Integrity: Any draft animals (bullocks/oxen) must be hitched strictly and exclusively to the front wooden yoke pole facing forward; no animals behind carts or on both sides.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // 12. Video Motion & Script Display Cards
  const videoMotionPrompt = [
    actionCleaned,
    `Camera: ${naturalCameraMotion}`,
    hasDialogue
      ? `[Character Dialogue]: ${dialogue}`
      : voiceover
      ? `[Voice-Over Beat]: "${voiceover}"`
      : "",
    audioPrompt ? `[Soundscape / Foley]: ${audioPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const scriptPrompt = [
    `🎬 SHOT DURATION: ${normalizedDuration}s | FRAMING: ${shotFraming} | ORIENTATION: ${arParam}`,
    `💳 ESTIMATED KLING CREDITS: ${creditCostEstimate}`,
    `\n📍 LOCATION: ${locationDescription || "Scene Location"}`,
    characterName ? `\n👤 ACTIVE CHARACTER: ${charName} (Wardrobe: ${wardrobeLock || "Standard"})` : "",
    `\n🎥 CAMERA & ACTION:`,
    `${actionCleaned}`,
    `Camera Movement: ${naturalCameraMotion}`,
    hasDialogue
      ? `\n💬 CHARACTER SPOKEN DIALOGUE:\n${naturalDialogue}\n[ACTOR DIRECTION: Authentic regional ${lang} dialect, natural lip movement]`
      : "",
    !hasDialogue && voiceover ? `\n🎙️ VOICE-OVER (NARRATOR):\n"${voiceover}"` : "",
    audioPrompt ? `\n🔊 SOUND DESIGN & AMBIENCE:\n${audioPrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    googleFlowPrompt,
    klingPrompt,
    fluxStillPrompt,
    chatgptPrompt,
    geminiPrompt,
    videoMotionPrompt,
    scriptPrompt,
    entities,
    universalNegativePrompt,
    creditCostEstimate,
  };
}

