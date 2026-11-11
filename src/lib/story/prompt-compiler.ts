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
  visualStyle?: string | null;
  sourceIdea?: string | null;
  genre?: string | null;
  tone?: string | null;
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
    visualStyle,
    sourceIdea,
    genre,
    tone,
  } = options;

  const entities = detectPhysicalEntities(actionDescription, sourceIdea);
  const lang = storyLanguage || "Tamil";
  const isCreditSaver = options.creditSaverMode !== false; // default true: 10 credits Standard mode
  const klingModeFlag = isCreditSaver ? "--mode std" : "--mode pro";
  const creditCostEstimate = isCreditSaver ? "10 credits (Standard Mode - 66 free daily credits allows ~6 videos)" : "25–35 credits (Pro Mode)";
  const qualityDescriptor = isCreditSaver ? "1080p Full HD" : "4K master grade";

  // Visual Style & Era Detection: Checks user input premise + visualStyle setting
  const styleUpper = (visualStyle || "").toUpperCase();
  const ideaLower = (sourceIdea || "").toLowerCase();

  const isCulinary =
    styleUpper === "CULINARY_MACRO_ASMR" ||
    entities.hasCulinaryAction ||
    ideaLower.includes("cook") ||
    ideaLower.includes("cooking") ||
    ideaLower.includes("asmr") ||
    ideaLower.includes("culinary") ||
    ideaLower.includes("recipe") ||
    ideaLower.includes("kitchen") ||
    (genre || "").toLowerCase().includes("cooking") ||
    (genre || "").toLowerCase().includes("culinary") ||
    (genre || "").toLowerCase().includes("asmr");

  const isPureAsmr =
    (genre || "").toLowerCase().includes("asmr") ||
    (tone || "").toLowerCase().includes("asmr") ||
    ideaLower.includes("asmr") ||
    styleUpper === "CULINARY_MACRO_ASMR" ||
    dialogue === "PURE_ASMR_FOLEY" ||
    (!dialogue && !voiceover && isCulinary);

  const isVintage =
    !isCulinary &&
    (styleUpper === "VINTAGE_FILM" ||
      entities.hasPeriodSetting ||
      ideaLower.includes("1900") ||
      ideaLower.includes("vintage") ||
      ideaLower.includes("old years") ||
      ideaLower.includes("historical") ||
      (genre || "").toLowerCase().includes("historical") ||
      (genre || "").toLowerCase().includes("period"));

  const isAnime = styleUpper === "ANIME";
  const isDocumentary = styleUpper === "DOCUMENTARY";
  const isBlackAndWhite = styleUpper === "BLACK_AND_WHITE" || styleUpper === "FILM_NOIR";

  // Dynamic Style Description for Google Flow / Veo
  let dynamicStyleDirective = "Photorealistic cinematic film, 35mm lens, authentic cultural textures, shallow depth of field, 24fps";
  let dynamicPeriodDirective = "";

  if (isCulinary) {
    dynamicStyleDirective = "Ultra-high-definition macro culinary cinema, 50mm/85mm probe macro lens optics, f/1.8 shallow depth of field, glistening natural oils, crisp fresh ingredient textures, natural warm kitchen directional lighting, 60fps high-speed fluid and rising steam physics";
    dynamicPeriodDirective = "- Master Workstation Continuity: Maintain exact same kitchen countertop material, wooden cutting board grain, and cookware style across every shot. Consistent warm kitchen background with soft creamy background bokeh.";
  } else if (isVintage) {
    dynamicStyleDirective = "Authentic 1900s vintage 35mm archival film aesthetic, natural cellulose film grain, soft warm sepia and muted earth-tone palette, period-accurate historical lighting, gentle optical lens bloom, organic 24fps motion blur";
    dynamicPeriodDirective = "- Period & Wardrobe Integrity: Strictly authentic 1900s early 20th-century historical era. Characters strictly wear period-accurate hand-spun unbleached khadi attire, traditional dhotis, veshti, angavastram. Strictly PROHIBIT modern machine-stitched collared shirts, modern t-shirts, modern synthetic fabrics, sneakers, modern wristwatches, or contemporary buildings.";
  } else if (isAnime) {
    dynamicStyleDirective = "High-end Japanese anime cinematic feature style, rich expressive dynamic lighting, painterly hand-crafted backgrounds, 24fps animation pace";
  } else if (isBlackAndWhite) {
    dynamicStyleDirective = "Classic high-contrast black-and-white 35mm film photography, rich silver-halide tonal gradation, deep dramatic shadows, vintage optical grain at 24fps";
  } else if (isDocumentary) {
    dynamicStyleDirective = "Grounded documentary cinema realism, natural ambient daylight, true-to-life color grading, 35mm lens, 24fps motion blur";
  }

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

  // Dynamic lens framing tailored to shot size & culinary camera angle
  let dynamicLensFraming = `${shotFraming}, 35mm lens, 24fps motion blur`;
  const framingLower = (shotFraming + " " + (shotSize || "")).toLowerCase();
  if (isCulinary) {
    if (framingLower.includes("macro") || framingLower.includes("extreme close") || framingLower.includes("ecu")) {
      dynamicLensFraming = `${shotFraming}, 85mm probe macro lens at 45° angle, f/1.8 shallow depth of field, razor-sharp focus on active ingredient contact or bubbling oil`;
    } else if (framingLower.includes("top-down") || framingLower.includes("overhead") || framingLower.includes("bird") || framingLower.includes("flat lay")) {
      dynamicLensFraming = `${shotFraming}, 90-degree overhead bird's-eye flat lay perspective looking directly down at the workstation cutting board`;
    } else if (framingLower.includes("pov") || framingLower.includes("chef") || framingLower.includes("first-person") || framingLower.includes("hands")) {
      dynamicLensFraming = `${shotFraming}, first-person chef hands perspective, natural eye-level cooking view`;
    } else if (framingLower.includes("close-up") || framingLower.includes("cu")) {
      dynamicLensFraming = `${shotFraming}, 50mm cinema prime lens, creamy background bokeh, appetizing natural lighting`;
    } else if (framingLower.includes("wide")) {
      dynamicLensFraming = `${shotFraming}, 24mm wide master lens, clean kitchen background staging`;
    }
  }

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
  if (isPureAsmr) {
    audioScriptLines.push(`- Audio Atmosphere & Foley: Pure Binaural ASMR Culinary Foley — Ultra-crisp close-mic Foley sound design (crisp knife chop on end-grain wood, intense sizzling oil crackle, butter foaming, water pouring, steam hiss). Strictly ZERO spoken dialogue, ZERO voice-over narration, and ZERO background music.`);
  } else if (hasDialogue) {
    audioScriptLines.push(`- Spoken Dialogue: ${formattedDialogue} (with natural ${lang} lip-synchronization)`);
  } else if (voiceover && voiceover.trim().length > 0) {
    audioScriptLines.push(`- Voice-Over (Narrator): "${voiceover.trim()}"`);
  } else {
    audioScriptLines.push(`- Atmosphere: Pure visual action & ambient Foley (No spoken dialogue or voice-over)`);
  }
  if (audioPrompt && !isPureAsmr) {
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

  // Culinary negatives to prevent phantom limbs, floating utensils, or morphing food
  if (isCulinary) {
    negativeList.push(
      "phantom hand",
      "third hand",
      "extra arm",
      "floating knife",
      "detached blade",
      "morphing vegetable",
      "morphing meat",
      "plastic food",
      "synthetic sheen",
      "spontaneous burning",
      "floating pan",
      "extra fingers",
      "deformed hands",
      "unnatural slicing",
      "disappearing food"
    );

    const fullActionText = (actionCleaned + " " + (actionDescription || "")).toLowerCase();
    const isPanStation = fullActionText.includes("pan") || fullActionText.includes("skillet") || fullActionText.includes("sear") || fullActionText.includes("sizzle") || fullActionText.includes("fry") || fullActionText.includes("baste") || fullActionText.includes("simmer") || fullActionText.includes("stove");
    const isPlateStation = fullActionText.includes("plate") || fullActionText.includes("plating") || fullActionText.includes("garnish") || fullActionText.includes("serve");

    if (isPanStation) {
      negativeList.push("cutting board", "wooden chopping board", "chopping knife", "slicing raw meat", "raw ingredient prep", "walking away from stove");
    } else if (isPlateStation) {
      negativeList.push("stove", "open flame", "frying pan", "sizzling skillet", "raw meat", "chopping knife");
    } else {
      // Cutting board / Prep Station
      negativeList.push("stove", "frying pan", "skillet", "hot oil", "dropping herbs into pan", "curry leaf in pan", "burner flame", "cooking on stove", "teleporting", "walking away from board");
    }
  }

  // Pure ASMR negatives to enforce zero speech or loud tracks
  if (isPureAsmr) {
    negativeList.push(
      "talking",
      "speaking",
      "speech",
      "spoken dialogue",
      "voiceover",
      "singing",
      "loud music",
      "synthesizer music",
      "soundtrack",
      "subtitles",
      "on-screen text"
    );
  }

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

  // Period setting negatives: heavily penalize modern items if vintage/period setting
  if (isVintage || entities.hasPeriodSetting) {
    negativeList.push(
      "modern western clothing",
      "modern collared shirt",
      "modern button shirt",
      "modern casual shirt",
      "t-shirt",
      "jeans",
      "full pants",
      "long trousers",
      "modern wristwatch",
      "sneakers",
      "modern shoes",
      "plastic",
      "asphalt road",
      "concrete buildings",
      "modern digital camera look",
      "modern HDR digital sheen",
      "synthetic bright dyes"
    );
  }

  const universalNegativePrompt = Array.from(new Set(negativeList)).join(", ");

  // 8. Build Google Flow / Veo Structured Master Prompt
  const flowRules: string[] = [
    isPureAsmr
      ? `- Constraints & Audio: Pure visual culinary cinema & pristine binaural ASMR sound design. Strictly NO spoken words, NO voiceover, NO lip movement, and NO background music.`
      : `- Constraints & Negative Directives: Only the active speaking character moves their lips; accurate natural ${lang} lip synchronization; maintain exact locked character face, wardrobe, and clothing; avoid 3D render, CGI, cartoon, anime, plastic skin, morphing, multiple limbs, distorted hands, modern western faces, jittery camera motion, blur; no generated subtitles or on-screen text overlays.`,
    `- ${UNIVERSAL_PHYSICAL_LAWS.SKELETAL_ALIGNMENT}`,
    `- ${UNIVERSAL_PHYSICAL_LAWS.SPATIAL_DEPTH_SEPARATION}`,
  ];

  if (isCulinary) {
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.CULINARY_ASMR_PHYSICS}`);
  }
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
    `- Camera Framing & Lens: ${dynamicLensFraming}`,
    `- Camera Movement & Dynamics: ${cameraMotion}`,
    `- Lighting: ${lighting || (isCulinary ? "Warm directional culinary studio lighting, soft key illumination on cutting board/pan, appetizing natural food glistening" : isVintage ? "Soft warm natural daylight, gentle dust motes, historical period ambience" : "Natural daylight, soft golden illumination, realistic shadows, documentary realism")}`,
    "",
    `[AUDIO & SCRIPT]:`,
    ...audioScriptLines,
    "",
    `[VISUAL STYLE & PHYSICAL INVARIANTS]:`,
    `- Visual Style: ${dynamicStyleDirective}`,
    dynamicPeriodDirective || null,
    wardrobeLock
      ? `- Character Wardrobe Lock: ${bracketedCharTag} strictly wears ${wardrobeLock}. Maintain 100% clothing and physical consistency across every scene.`
      : null,
    ...flowRules,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // 9. Build Kling / Sora Prompt (Credit-Optimized & Period-Aware)
  const klingSceneType = isCulinary
    ? `An ultra-photorealistic macro culinary ASMR ${framingDesc} cooking scene.`
    : isVintage
    ? `An authentic 1900s vintage 35mm archival ${framingDesc} film scene.`
    : isAnime
    ? `A cinematic anime ${framingDesc} scene.`
    : `A cinematic ${qualityDescriptor} ${framingDesc} film scene.`;

  const klingAesthetics = isCulinary
    ? `Aesthetics: Ultra-high-definition macro food cinema, 85mm probe lens, f/1.8 shallow depth of field, glistening natural oils, 60fps fluid dynamics, appetizing sizzling textures.`
    : isVintage
    ? `Aesthetics: Authentic 1900s archival 35mm film aesthetic, subtle cellulose film grain, warm sepia and muted earth tones, soft optical lens halation, natural textile cloth physics, historical period authenticity.`
    : isAnime
    ? `Aesthetics: Japanese anime feature animation aesthetic, expressive keyframe motion, cinematic lighting.`
    : `Aesthetics: Photorealistic 1080p cinema footage, authentic human skin pores with subtle perspiration, natural textile cloth physics, grounded realism, shallow depth of field.`;

  const klingPrompt = [
    klingSceneType,
    characterName
      ? `Subject: ${characterName}, an authentic character with ${(characterDescription || (isCulinary ? "experienced chef hands, rolled-up linen shirt sleeves" : "authentic regional traits")).replace(/\.+$/, "")}, strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : "traditional clothing")}.`
      : null,
    `Action & Dynamics: ${actionCleaned}.`,
    `Camera & Composition: ${dynamicLensFraming}, ${naturalCameraMotion}.`,
    `Environment & Atmosphere: ${(locationDescription || (isCulinary ? "Master kitchen workstation, end-grain walnut cutting board, seasoned cast-iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai town" : "Authentic film location")).replace(/\.+$/, "")}. Lighting: ${(lighting || (isCulinary ? "warm directional spotlight with soft background blur" : isVintage ? "soft warm historical golden hour sunlight" : "warm golden hour natural afternoon sunlight")).replace(/\.+$/, "")}.${audioPrompt ? ` Foley ambience: ${audioPrompt.replace(/\.+$/, "")}.` : ""}`,
    isPureAsmr
      ? `Audio Pace: Pure binaural ASMR culinary Foley (crisp knife chops, oil sizzle, liquid pour, steam hiss), strictly no dialogue or background music.`
      : hasDialogue
      ? `Dialogue & Lip Sync: ${charName} actively speaks dialogue with realistic, perfectly synchronized ${lang} lip movements and expressive facial animation.`
      : `Audio Pace: Pure visual cinema action and environmental Foley, no spoken character dialogue.`,
    entities.hasVehicleOrMount
      ? `Vehicular Invariant: Draft animals must be hitched strictly and exclusively to the front yoke facing forward; no animals at the rear.`
      : null,
    isCulinary
      ? `Culinary Invariant: Max two hands in frame (knife grip + claw grip); cutting board and pans firmly grounded; no morphing ingredients or floating knives.`
      : null,
    klingAesthetics,
    `--ar ${arParam} ${klingModeFlag} --negative "${universalNegativePrompt}"`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".");

  // 10. Build FLUX.1 Still Reference Prompt (Fast, clean 1080p, Period-Aware)
  const fluxStillOpening = isCulinary
    ? `A breathtaking macro culinary food photography still, ${shotFraming}.`
    : isVintage
    ? `An authentic 1900s vintage 35mm archival film still, ${shotFraming}.`
    : isAnime
    ? `A stunning cinematic anime film still, ${shotFraming}.`
    : `A breathtaking 1080p cinematic documentary film still, ${shotFraming}.`;

  const fluxCinematography = isCulinary
    ? `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on active ingredient and cutting edge, creamy background bokeh, warm kitchen directional spotlight, appetizing natural food glistening.`
    : isVintage
    ? `Cinematography: Shot on early 20th-century vintage 35mm prime lens, authentic cellulose film grain, soft warm sepia and muted earth tones, period-accurate natural daylight, gentle optical bloom, authentic hand-spun khadi textile weave.`
    : `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting || "warm natural golden hour sunlight, soft shadows"}, shallow depth of field, authentic human skin pores, Kodak Portra 400 film grain, 24fps motion blur, realistic cloth textile folds.`;

  const fluxAesthetics = isCulinary
    ? `Strict Aesthetics: Master food photography award winner, authentic fresh produce, natural meat marbling and sear, glistening olive oil. Strictly NO plastic or artificial food, NO CGI, NO 3D render, NO extra limbs, NO floating knives, NO morphing ingredients.`
    : isVintage
    ? `Strict Aesthetics: Authentic 1900s historical time-capsule realism. Strictly NO modern 4K digital crispness, NO modern collared shirts, NO modern buttoned clothing, NO modern western fashion, NO modern buildings or concrete, NO CGI, NO 3D animation.`
    : `Strict Aesthetics: Ultra-photorealistic documentary cinema masterpiece, true-to-life skin tones. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern western clothing.`;

  const fluxStillPrompt = [
    fluxStillOpening,
    characterName
      ? `Subject: ${characterName}, ${(characterDescription || "authentic appearance").replace(/\.+$/, "")}${wardrobeLock ? `, strictly wearing ${wardrobeLock}` : ""}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${(locationDescription || (isVintage ? "Authentic 1900s historical Pudukkottai architectural setting" : "Authentic cinematic setting")).replace(/\.+$/, "")}.`,
    fluxCinematography,
    fluxAesthetics,
    entities.hasVehicleOrMount
      ? `Vehicular & Animal Integrity: Any draft animals must be hitched strictly and exclusively to the front wooden yoke pole facing forward; strictly NO animals behind or at the rear of carts; strictly NO duplicate animals or animals on both sides of a vehicle.`
      : null,
    entities.hasHandheldProp
      ? `Prop Integrity: Handheld items must be firmly held by a single hand with fingers wrapped around the handle; no floating objects.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  // 11. Build ChatGPT / Gemini Prompts (Period-Aware & Culinary-Aware)
  const chatgptPrompt = [
    isCulinary
      ? `Create an ultra-photorealistic macro culinary food photography still in ${framingDesc}.`
      : isVintage
      ? `Create an authentic 1900s vintage 35mm archival ${framingDesc} film still.`
      : `Create a highly detailed, photorealistic ${framingDesc} film still from a cinematic film.`,
    characterName
      ? `Subject: ${characterName}, ${characterDescription || (isCulinary ? "skilled chef hands with rolled linen sleeves" : "authentic character")}. Wardrobe lock: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional unbleached khadi attire" : "traditional clothing")}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${locationDescription || (isCulinary ? "Master culinary kitchen, end-grain walnut cutting board, seasoned cast iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai town" : "Cinematic setting")}.`,
    `Lighting & Mood: ${lighting || (isCulinary ? "Warm culinary studio lighting, soft key illumination, appetizing natural highlights" : isVintage ? "Soft warm historical natural daylight, dusty atmosphere" : "Natural golden hour daylight, soft shadows, warm highlights")}.`,
    `Camera & Composition: ${dynamicLensFraming}, ${naturalCameraMotion}.`,
    isPureAsmr
      ? `Soundscape & Audio Foley: Pure binaural ASMR culinary Foley (crisp knife chops on wood, oil sizzle, liquid pouring, steam hissing). Strictly no spoken dialogue, no voiceover, no background music.`
      : hasDialogue
      ? `Spoken Dialogue Beat: ${naturalDialogue} (Authentic ${lang} dialect, natural conversational pacing)`
      : voiceover
      ? `Voice-Over Beat: "${voiceover}"`
      : `Soundscape Atmosphere: ${audioPrompt || "Ambient rural environment"}`,
    isCulinary
      ? `Style & Realism: Ultra-high-definition macro culinary cinema, 85mm probe macro lens optics, razor-sharp focus on ingredient textures, glistening natural oil sheens, 60fps high-speed fluid and rising steam physics, vibrant fresh food colors. Max two hands in frame (knife grip + claw grip); strictly NO extra arms, NO floating knives, NO morphing food.`
      : isVintage
      ? `Style & Realism: Authentic 1900s vintage 35mm film aesthetic, subtle cellulose grain, soft warm sepia and muted earth tones, gentle optical lens halation, authentic hand-spun khadi textile weave. Strictly NO modern collared shirts, NO modern clothing, NO modern buildings.`
      : `Style & Realism: Authentic documentary realism, true-to-life skin tones with subtle perspiration and dust, natural woven fabric folds, Kodak 35mm film grain, 1080p Full HD resolution.`,
    isCulinary
      ? `Physical Invariants: Rigid knife grip; cutting board resting firmly on counter; cookware anchored to stove; ingredients divide cleanly without morphing.`
      : `Physical Invariants: Strict forward skeletal alignment; no backward head rotation; draft animals hitched exclusively at the front yoke of vehicles; no animals behind carts or on both ends.`,
    `Negative Constraints: ${universalNegativePrompt}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const geminiPrompt = [
    isCulinary
      ? `Ultra-photorealistic macro culinary ASMR ${framingDesc} food still.`
      : isVintage
      ? `Authentic 1900s vintage 35mm archival ${framingDesc} film still.`
      : `Cinematic ${framingDesc} photorealistic film still.`,
    characterName
      ? `Character: ${characterName}, ${characterDescription || (isCulinary ? "chef hands with precise knife grip" : "authentic appearance")}. Attire: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : "traditional clothing")}.`
      : null,
    `Visual Action: ${actionCleaned}.`,
    `Setting & Background: ${locationDescription || (isCulinary ? "Master kitchen workstation, end-grain walnut cutting board, seasoned cast iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai setting" : "Cinematic setting")}.`,
    `Cinematography: ${dynamicLensFraming}, ${naturalCameraMotion}.`,
    isPureAsmr
      ? `Audio Foley Context: Pristine binaural ASMR culinary sound effects (chop, sizzle, pour, hiss) with zero dialogue.`
      : hasDialogue
      ? `Character Dialogue Context: ${naturalDialogue}`
      : voiceover
      ? `Voiceover Context: "${voiceover}"`
      : `Atmosphere: ${audioPrompt || "Quiet rural stillness"}`,
    isCulinary
      ? `Film Aesthetics: Ultra-high-definition macro food cinema, 85mm probe macro lens optics, appetizing oil sheen, rising steam, zero phantom limbs, zero floating knives.`
      : isVintage
      ? `Film Aesthetics: Authentic 1900s archival 35mm cellulose grain, muted period palette, soft sepia highlights, period-authentic hand-spun khadi, strictly no modern clothing or contemporary artifacts.`
      : `Film Aesthetics: 1080p Full HD, authentic cultural textures, grounded realism, neutral film grain, realistic depth of field.`,
    isCulinary
      ? `Culinary Integrity: Rigid knife grip, stable workstation, clean slicing, no morphing food.`
      : `Vehicular Integrity: Any draft animals (bullocks/oxen) must be hitched strictly and exclusively to the front wooden yoke pole facing forward; no animals behind carts or on both sides.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // 12. Video Motion & Script Display Cards (Universal Image-to-Video I2V for Google Flow, Kling, Runway, Luma, Wan 2.1)
  const videoMotionPrompt = [
    characterName ? `Subject: [@${charName.replace(/[^a-zA-Z0-9]/g, "")}].` : null,
    `Action & Dynamics: ${actionCleaned}.`,
    `Camera Movement: ${naturalCameraMotion}.`,
    isPureAsmr
      ? (() => {
          const text = (actionCleaned + " " + (actionDescription || "")).toLowerCase();
          const isPan = text.includes("pan") || text.includes("skillet") || text.includes("sear") || text.includes("sizzle") || text.includes("fry") || text.includes("baste") || text.includes("simmer") || text.includes("stove");
          const isPlate = text.includes("plate") || text.includes("plating") || text.includes("garnish") || text.includes("serve");
          if (isPan) {
            return `Culinary Foley Dynamics: Ingredients cook in hot skillet with rising aromatic steam and foaming butter bubbles; skillet stays firmly anchored to stove; chef remains at the stove; zero morphing food.`;
          }
          if (isPlate) {
            return `Culinary Foley Dynamics: Precision garnishing and plating; food rests stably on dish; zero morphing food.`;
          }
          return `Culinary Foley Dynamics: Knife cuts cleanly and steadily on the wooden cutting board; chef remains entirely anchored at the cutting board workstation; strictly no stove, no frying pan, no dropping herbs into oil; zero morphing food.`;
        })()
      : hasDialogue
      ? `Facial & Dialogue Dynamics: ${charName} actively speaks dialogue with realistic, perfectly synchronized ${lang} lip movements and emotional expression.`
      : null,
    isCulinary
      ? (() => {
          const text = (actionCleaned + " " + (actionDescription || "")).toLowerCase();
          const isPan = text.includes("pan") || text.includes("skillet") || text.includes("sear") || text.includes("sizzle") || text.includes("fry") || text.includes("baste") || text.includes("simmer") || text.includes("stove");
          const isPlate = text.includes("plate") || text.includes("plating") || text.includes("garnish") || text.includes("serve");
          if (isPan) {
            return `Kinematic Invariant: Max two hands in frame. Station Lock: Chef is firmly anchored at the stove/skillet station. Cookware is permanently anchored to the burner with rising steam and sizzling oil. Strictly NO cutting board, NO prep slicing. Zero morphing food.`;
          }
          if (isPlate) {
            return `Kinematic Invariant: Max two hands in frame. Station Lock: Plating station. Food rests stably on serving plate. Strictly NO active cooking or chopping. Clean presentation.`;
          }
          return `Kinematic Invariant: Max two hands in frame (knife grip + claw grip); cutting board and pans firmly grounded; clean slicing. Station Lock: Chef remains 100% anchored at the wooden cutting board workstation performing a single steady slicing/prep action. Strictly NO stove, NO frying pan, NO skillet, NO dropping herbs into oil. Rigid knife blade geometry and zero morphing ingredients.`;
        })()
      : entities.hasVehicleOrMount
      ? `Vehicular Invariant: Draft animals move strictly forward at the front yoke only.`
      : null,
    `Start Frame Consistency: Animate directly from the uploaded reference start-frame image (Google Flow / Kling / Runway / Luma), preserving 100% of character appearance, kitchen workstation, lighting, and textures.`,
    `--mode std --negative "${universalNegativePrompt}"`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".");

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

