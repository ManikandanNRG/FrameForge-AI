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

export type CulinaryStation = "COUNTER_REVEAL" | "BOARD_PREP" | "STOVE_COOK" | "PLATING_SERVE";

export function detectCulinaryStation(actionText: string, cameraMotionText?: string | null): CulinaryStation {
  const lower = `${actionText || ""} ${cameraMotionText || ""}`.toLowerCase();

  // 1. Plating / Serving station
  if (/\b(plate|plating|garnish|serve|serving|platter|dining table)\b/.test(lower) && !/\b(cutting board|chopping|prep)\b/.test(lower)) {
    return "PLATING_SERVE";
  }

  // 2. Stove / Cookware station
  // Crucial: Distinguish cookware (frying pan, skillet, hot pan, in pan) from camera movements (camera pans, slow pan, panning across)!
  const hasStoveKeywords = /\b(skillet|sear|searing|sizzle|sizzling|baste|basting|simmer|simmering|boil|boiling|burner|stove|stovetop|hot oil|foaming butter|wok|charring|flamb|cast-iron skillet)\b/.test(lower);
  const hasCookwarePan = /(?:frying pan|saucepan|saut[eé] pan|cast-iron pan|hot pan|into the pan|in the pan|into pan|in pan|pan sear|pan-sear)\b/.test(lower) ||
    (/\bpan\b/.test(lower) && !/\b(?:camera|slowly|smooth|horizontal|lateral)\s+pans?\b/.test(lower) && !/\bpanning\b/.test(lower));

  const isStove = (hasStoveKeywords || hasCookwarePan) && !/\b(cutting board|chopping board|deftly chop|slices? seasoned|raw meat|reveal|ingredients like)\b/.test(lower);
  if (isStove) {
    return "STOVE_COOK";
  }

  // 3. Countertop / Ingredient Reveal station (Mise En Place)
  const isReveal = /\b(reveal|revealing|countertop|fresh ingredients|mise en place|showcase|ingredients like|table setting|overview)\b/.test(lower) &&
    !/\b(chopping|slicing|cutting|dicing|sear|sizzle|skillet|baste)\b/.test(lower);
  if (isReveal) {
    return "COUNTER_REVEAL";
  }

  // 4. Default: Cutting board / prep station
  return "BOARD_PREP";
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

  const isCulinaryGenreOrIdea =
    (genre || "").toLowerCase().includes("cooking") ||
    (genre || "").toLowerCase().includes("culinary") ||
    (genre || "").toLowerCase().includes("recipe") ||
    (genre || "").toLowerCase().includes("food") ||
    ideaLower.includes("cooking") ||
    ideaLower.includes("recipe") ||
    ideaLower.includes("culinary");

  const isCulinary =
    styleUpper === "CULINARY_MACRO_ASMR" ||
    (isCulinaryGenreOrIdea && entities.hasCulinaryAction);

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

  const isGhibli =
    styleUpper === "GHIBLI_ANIME" ||
    styleUpper === "GHIBLI" ||
    ideaLower.includes("ghibli") ||
    ideaLower.includes("zibly");
  const isCartoon = styleUpper === "CARTOON_2D" || styleUpper === "CARTOON";
  const is3DAnim = styleUpper === "ANIMATION_3D" || styleUpper === "KIDS_3D_ANIMATION" || styleUpper === "3D_ANIMATION";
  const isAnime = styleUpper === "ANIME" || isGhibli;
  const isAnimated = isAnime || isGhibli || isCartoon || is3DAnim;
  const isStopMotion = styleUpper === "STOP_MOTION" || styleUpper === "CLAYMATION";
  const isComic = styleUpper === "COMIC_BOOK" || styleUpper === "GRAPHIC_NOVEL";
  const isWatercolor = styleUpper === "WATERCOLOR";
  const isFantasy = styleUpper === "FANTASY_CONCEPT_ART" || styleUpper === "FANTASY";
  const isCommercial = styleUpper === "LIVE_ACTION_AD" || styleUpper === "COMMERCIAL";
  const isKids = isGhibli || isCartoon || is3DAnim || ideaLower.includes("rhyme") || ideaLower.includes("nursery") || ideaLower.includes("kid");
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
  } else if (isGhibli) {
    dynamicStyleDirective = "Enchanting Studio Ghibli hand-painted feature animation aesthetic, lush watercolor landscapes, vibrant rolling green hills, fluffy clouds in azure skies, warm whimsical character design with expressive eyes and fluid hand-drawn 24fps motion, Hayao Miyazaki pastoral nature";
    dynamicPeriodDirective = "- Ghibli & Nature Scenery Integrity: Vibrant pastoral scenery, soft watercolor meadows, sparkling clear daylight, joyful wholesome atmosphere. Strictly NO live-action, NO realistic human skin, NO dark or gritty themes.";
  } else if (isCartoon) {
    dynamicStyleDirective = "Charming 2D storybook kids cartoon animation, bright playful colors, bold expressive line art, cheerful character animation, joyful sunny atmosphere at 24fps";
    dynamicPeriodDirective = "- Kids Cartoon Integrity: Fun, vibrant, colorful storybook aesthetics. Child-friendly joyful expressions.";
  } else if (is3DAnim) {
    dynamicStyleDirective = "Vibrant Pixar/Disney-quality 3D kids animation, soft warm global illumination, expressive stylized character models, bouncy playful physics, saturated child-friendly color grading";
    dynamicPeriodDirective = "- 3D Kids Animation Integrity: Friendly stylized characters, soft warm lighting, joyful atmosphere.";
  } else if (isStopMotion) {
    dynamicStyleDirective = "Handcrafted tactile stop-motion animation, physical clay and miniature articulated puppet textures, subtle 12fps tactile frame cadence, miniature studio set lighting with shallow macro depth of field";
    dynamicPeriodDirective = "- Stop-Motion Integrity: Tactile handcrafted clay and miniature aesthetic. Strictly NO smooth digital CGI, NO live-action photorealism.";
  } else if (isComic) {
    dynamicStyleDirective = "Bold graphic novel comic-book illustration art, rich halftone dot printing patterns, expressive ink cross-hatching, high-contrast dynamic line work, cinematic comic panel composition";
    dynamicPeriodDirective = "- Comic-Book Integrity: Stylized graphic novel illustrations with dramatic ink lines and bold colors. Strictly NO photorealism.";
  } else if (isWatercolor) {
    dynamicStyleDirective = "Luminous hand-painted watercolor illustration, soft pigment washes on textured cotton paper, delicate expressive line work, luminous gentle natural lighting";
    dynamicPeriodDirective = "- Watercolor Integrity: Fine-art watercolor washes and gentle color gradients. Strictly NO harsh 3D plastic or live-action realism.";
  } else if (isFantasy) {
    dynamicStyleDirective = "Epic digital matte painting and fantasy concept art, sweeping atmospheric volumetric lighting, ethereal god-rays, grand cinematic scale, rich mystical detailing";
    dynamicPeriodDirective = "- Fantasy Art Direction: Mythical high-fantasy production design with grand atmospheric depth.";
  } else if (isCommercial) {
    dynamicStyleDirective = "Premium high-end commercial advertising cinematography, vibrant pristine color grading, Arri Alexa 65mm clarity, glamorous commercial studio lighting, 60fps high-definition fluid motion";
    dynamicPeriodDirective = "- Commercial Integrity: Clean commercial gloss, vibrant colors, premium studio lighting.";
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
    "plastic skin",
    "distorted anatomy",
    "extra limbs",
    "motion jitter",
    "blur",
    "subtitles",
    "watermark",
    "text",
  ];

  const isStylizedArt = isAnimated || isStopMotion || isComic || isWatercolor;

  if (isStylizedArt) {
    negativeList.push(
      "photorealistic live action",
      "real human photograph",
      "dark gritty horror",
      "grotesque",
      "scary",
      "dull drab colors"
    );
    if (isStopMotion) {
      negativeList.push("smooth digital CGI", "glossy 3D animation", "photorealism");
    }
  } else if (!isFantasy) {
    negativeList.push("CGI", "3D render", "cartoon", "anime");
  }

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

    const station = detectCulinaryStation(actionCleaned + " " + (actionDescription || ""), cameraMovement);

    if (station === "STOVE_COOK") {
      negativeList.push("cutting board", "wooden chopping board", "chopping knife", "slicing raw meat", "raw ingredient prep", "knife in hand", "cutting knife", "walking away from stove");
    } else if (station === "PLATING_SERVE") {
      negativeList.push("stove", "open flame", "frying pan", "sizzling skillet", "raw meat", "chopping knife");
    } else if (station === "COUNTER_REVEAL") {
      negativeList.push("stove", "frying pan", "skillet", "hot oil", "sizzle", "cooking", "flame", "boiling", "chopping knife", "picking up meat", "putting meat in pan", "throwing in pan", "dropping in pan", "teleporting");
    } else {
      // BOARD_PREP
      negativeList.push("stove", "frying pan", "skillet", "hot oil", "dropping herbs into pan", "curry leaf in pan", "burner flame", "cooking on stove", "knife turning into herbs", "knife turning into leaf", "blade morphing into plant", "transforming knife", "knife changing shape", "picking up raw steak", "putting meat in pan", "teleporting", "walking away from board");
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
      : isAnimated
      ? `- Constraints & Audio: High quality animated feature film visual style; expressive lively animation; natural lip synchronization; maintain exact locked character design, wardrobe, and clothing; avoid live-action realism, photorealistic humans, dark gritty tones, jittery camera motion, blur; no generated subtitles or on-screen text overlays.`
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
    : isGhibli
    ? `An enchanting Studio Ghibli hand-painted anime ${framingDesc} animation scene.`
    : isCartoon
    ? `A playful, colorful 2D cartoon ${framingDesc} animation scene.`
    : is3DAnim
    ? `A vibrant 3D animated ${framingDesc} feature scene.`
    : isAnime
    ? `A cinematic anime ${framingDesc} scene.`
    : `A cinematic ${qualityDescriptor} ${framingDesc} film scene.`;

  const klingAesthetics = isCulinary
    ? `Aesthetics: Ultra-high-definition macro food cinema, 85mm probe lens, f/1.8 shallow depth of field, glistening natural oils, 60fps fluid dynamics, appetizing sizzling textures.`
    : isVintage
    ? `Aesthetics: Authentic 1900s archival 35mm film aesthetic, subtle cellulose film grain, warm sepia and muted earth tones, soft optical lens halation, natural textile cloth physics, historical period authenticity.`
    : isGhibli
    ? `Aesthetics: Studio Ghibli hand-painted aesthetic, lush watercolor nature backgrounds, Hayao Miyazaki visual magic, expressive hand-drawn 24fps keyframe animation, warm joyful atmosphere.`
    : isCartoon
    ? `Aesthetics: Playful 2D cartoon animation, bright child-friendly colors, bouncy cheerful physics.`
    : is3DAnim
    ? `Aesthetics: 3D feature animation render, soft global illumination, vibrant playful character animation.`
    : isAnime
    ? `Aesthetics: Japanese anime feature animation aesthetic, expressive keyframe motion, cinematic lighting.`
    : `Aesthetics: Photorealistic 1080p cinema footage, authentic human skin pores with subtle perspiration, natural textile cloth physics, grounded realism, shallow depth of field.`;

  const klingPrompt = [
    klingSceneType,
    characterName
      ? `Subject: ${characterName}, an authentic character with ${(characterDescription || (isCulinary ? "experienced chef hands, rolled-up linen shirt sleeves" : isAnimated ? "charming expressive animated features" : "authentic regional traits")).replace(/\.+$/, "")}, strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
      : null,
    `Action & Dynamics: ${actionCleaned}.`,
    `Camera & Composition: ${dynamicLensFraming}, ${naturalCameraMotion}.`,
    `Environment & Atmosphere: ${(locationDescription || (isCulinary ? "Master kitchen workstation, end-grain walnut cutting board, seasoned cast-iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai town" : isGhibli ? "Lush vibrant green meadow under sunny blue sky with fluffy white clouds" : "Authentic film location")).replace(/\.+$/, "")}. Lighting: ${(lighting || (isCulinary ? "warm directional spotlight with soft background blur" : isVintage ? "soft warm historical golden hour sunlight" : isAnimated ? "bright joyful sunny daylight" : "warm golden hour natural afternoon sunlight")).replace(/\.+$/, "")}.${audioPrompt ? ` Foley ambience: ${audioPrompt.replace(/\.+$/, "")}.` : ""}`,
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
    : isGhibli
    ? `A breathtaking Studio Ghibli style hand-painted anime still, ${shotFraming}.`
    : isCartoon
    ? `A charming colorful 2D children's storybook cartoon illustration still, ${shotFraming}.`
    : is3DAnim
    ? `A stunning Pixar-quality 3D animated film still, ${shotFraming}.`
    : isStopMotion
    ? `A breathtaking handcrafted stop-motion clay animation still, ${shotFraming}.`
    : isComic
    ? `A striking graphic novel comic-book illustration still, ${shotFraming}.`
    : isWatercolor
    ? `A delicate luminous hand-painted watercolor illustration still, ${shotFraming}.`
    : isFantasy
    ? `An epic cinematic fantasy concept art still, ${shotFraming}.`
    : isCommercial
    ? `A crisp high-end commercial advertising film still, ${shotFraming}.`
    : isAnime
    ? `A stunning cinematic anime film still, ${shotFraming}.`
    : `A breathtaking 1080p cinematic documentary film still, ${shotFraming}.`;

  const fluxCinematography = isCulinary
    ? `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on active ingredient and cutting edge, creamy background bokeh, warm kitchen directional spotlight, appetizing natural food glistening.`
    : isVintage
    ? `Cinematography: Shot on early 20th-century vintage 35mm prime lens, authentic cellulose film grain, soft warm sepia and muted earth tones, period-accurate natural daylight, gentle optical bloom, authentic hand-spun khadi textile weave.`
    : isGhibli
    ? `Art Direction: Hand-painted Studio Ghibli background art, lush watercolor meadows, vibrant painted skies, whimsical soft lighting, Hayao Miyazaki aesthetic, warm nostalgic colors.`
    : isCartoon
    ? `Art Direction: Vibrant storybook illustration, playful character expression, bright saturated colors, cheerful sunny outdoor environment.`
    : is3DAnim
    ? `Art Direction: 3D feature animation render, soft ambient occlusion, warm golden sunlight, playful stylized character textures.`
    : isStopMotion
    ? `Art Direction: Handcrafted clay animation armature, subtle physical thumbprints and tactile clay textures, miniature studio spotlighting, shallow macro depth of field.`
    : isComic
    ? `Art Direction: High-contrast ink line art, rich halftone dot printing patterns, dynamic dramatic cross-hatching, vibrant primary comic palette.`
    : isWatercolor
    ? `Art Direction: Luminous watercolor on cold-press textured cotton paper, soft bleeding washes, transparent pigment layers, delicate pencil outlines.`
    : isFantasy
    ? `Art Direction: Epic fantasy matte painting, sweeping volumetric atmospheric lighting, majestic scale, ethereal god-rays, mythical production design.`
    : isCommercial
    ? `Cinematography: Shot on Arri Alexa 65mm sensor, pristine studio lighting, vibrant commercial color grade, razor-sharp focus.`
    : `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting || "warm natural golden hour sunlight, soft shadows"}, shallow depth of field, authentic human skin pores, Kodak Portra 400 film grain, 24fps motion blur, realistic cloth textile folds.`;

  const fluxAesthetics = isCulinary
    ? `Strict Aesthetics: Master food photography award winner, authentic fresh produce, natural meat marbling and sear, glistening olive oil. Strictly NO plastic or artificial food, NO CGI, NO 3D render, NO extra limbs, NO floating knives, NO morphing ingredients.`
    : isVintage
    ? `Strict Aesthetics: Authentic 1900s historical time-capsule realism. Strictly NO modern 4K digital crispness, NO modern collared shirts, NO modern buttoned clothing, NO modern western fashion, NO modern buildings or concrete, NO CGI, NO 3D animation.`
    : isStopMotion
    ? `Strict Aesthetics: Physical miniature tactile craftsmanship. Strictly NO smooth digital CGI, NO glossy 3D animation, NO live-action photorealism.`
    : isComic
    ? `Strict Aesthetics: Graphic novel printed page aesthetic. Strictly NO photographic realism, NO bland lighting, NO 3D plastic.`
    : isWatercolor
    ? `Strict Aesthetics: Fine art traditional watercolor painting. Strictly NO harsh digital lines, NO 3D CGI gloss, NO photographic realism.`
    : isAnimated
    ? `Strict Aesthetics: Child-friendly, joyful, and wholesome animated masterpiece. Strictly NO live-action photography, NO dark horror, NO grotesque elements, NO realistic human skin, NO text overlays.`
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

  // 11. Build ChatGPT / Gemini Prompts (Period-Aware, Culinary-Aware, Multi-Style)
  const chatgptPrompt = [
    isCulinary
      ? `Create an ultra-photorealistic macro culinary food photography still in ${framingDesc}.`
      : isVintage
      ? `Create an authentic 1900s vintage 35mm archival ${framingDesc} film still.`
      : isGhibli
      ? `Create an enchanting Studio Ghibli style hand-painted watercolor ${framingDesc} anime still.`
      : isCartoon
      ? `Create a charming 2D children's storybook cartoon ${framingDesc} still.`
      : is3DAnim
      ? `Create a vibrant Pixar-quality 3D animated ${framingDesc} feature film still.`
      : isStopMotion
      ? `Create a handcrafted tactile stop-motion clay animation ${framingDesc} still.`
      : isComic
      ? `Create a striking graphic novel comic-book illustration ${framingDesc} still.`
      : isWatercolor
      ? `Create a luminous hand-painted watercolor illustration ${framingDesc} still.`
      : isFantasy
      ? `Create an epic cinematic fantasy concept art ${framingDesc} still.`
      : isAnime
      ? `Create a stunning cinematic anime feature ${framingDesc} still.`
      : `Create a highly detailed, photorealistic ${framingDesc} film still from a cinematic film.`,
    characterName
      ? `Subject: ${characterName}, ${characterDescription || (isCulinary ? "skilled chef hands with rolled linen sleeves" : isAnimated ? "charming expressive animated features" : "authentic character")}. Wardrobe lock: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional unbleached khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${locationDescription || (isCulinary ? "Master culinary kitchen, end-grain walnut cutting board, seasoned cast iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai town" : isGhibli ? "Lush vibrant green meadow under sunny blue sky with fluffy white clouds" : isKids ? "Bright sunny meadow playground" : "Cinematic setting")}.`,
    `Lighting & Mood: ${lighting || (isCulinary ? "Warm culinary studio lighting, soft key illumination, appetizing natural highlights" : isVintage ? "Soft warm historical natural daylight, dusty atmosphere" : isAnimated ? "Bright joyful sunny daylight, warm glowing atmosphere" : "Natural golden hour daylight, soft shadows, warm highlights")}.`,
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
      : isGhibli
      ? `Style & Realism: Enchanting Studio Ghibli watercolor animation aesthetic, lush green rolling meadows, fluffy cumulus clouds, whimsical character design, fluid hand-drawn 24fps motion.`
      : isCartoon
      ? `Style & Realism: Charming 2D storybook cartoon animation, playful bouncy character physics, bright cheerful saturated colors.`
      : is3DAnim
      ? `Style & Realism: Pixar/Disney-quality 3D character animation, soft warm global illumination, expressive stylized character models.`
      : isStopMotion
      ? `Style & Realism: Handcrafted tactile stop-motion clay animation, miniature puppet armature textures, subtle 12fps tactile frame cadence.`
      : isComic
      ? `Style & Realism: Graphic novel comic-book illustration, bold ink outlines, rich halftone dot printing patterns, dynamic high-contrast framing.`
      : `Style & Realism: Authentic documentary realism, true-to-life skin tones with subtle perspiration and dust, natural woven fabric folds, Kodak 35mm film grain, 1080p Full HD resolution.`,
    isCulinary
      ? `Physical Invariants: Rigid knife grip; cutting board resting firmly on counter; cookware anchored to stove; ingredients divide cleanly without morphing.`
      : entities.hasVehicleOrMount
      ? `Physical Invariants: Strict forward skeletal alignment; no backward head rotation; draft animals hitched exclusively at the front yoke of vehicles; no animals behind carts or on both ends.`
      : null,
    `Negative Constraints: ${universalNegativePrompt}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const geminiPrompt = [
    isCulinary
      ? `Ultra-photorealistic macro culinary ASMR ${framingDesc} food still.`
      : isVintage
      ? `Authentic 1900s vintage 35mm archival ${framingDesc} film still.`
      : isGhibli
      ? `Enchanting Studio Ghibli style hand-painted watercolor ${framingDesc} anime still.`
      : isCartoon
      ? `Charming 2D children's storybook cartoon ${framingDesc} still.`
      : is3DAnim
      ? `Vibrant Pixar-quality 3D animated ${framingDesc} feature film still.`
      : isStopMotion
      ? `Handcrafted tactile stop-motion clay animation ${framingDesc} still.`
      : isComic
      ? `Striking graphic novel comic-book illustration ${framingDesc} still.`
      : isWatercolor
      ? `Luminous hand-painted watercolor illustration ${framingDesc} still.`
      : isFantasy
      ? `Epic cinematic fantasy concept art ${framingDesc} still.`
      : isAnime
      ? `Stunning cinematic anime feature ${framingDesc} still.`
      : `Cinematic ${framingDesc} photorealistic film still.`,
    characterName
      ? `Character: ${characterName}, ${characterDescription || (isCulinary ? "chef hands with precise knife grip" : isAnimated ? "expressive animated features" : "authentic appearance")}. Attire: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
      : null,
    `Visual Action: ${actionCleaned}.`,
    `Setting & Background: ${locationDescription || (isCulinary ? "Master kitchen workstation, end-grain walnut cutting board, seasoned cast iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai setting" : isGhibli ? "Lush vibrant green meadow under sunny blue sky with fluffy white clouds" : isKids ? "Bright sunny playground and meadow" : "Cinematic setting")}.`,
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
      : isGhibli
      ? `Film Aesthetics: Studio Ghibli hand-painted aesthetic, vibrant watercolor meadows, azure skies with fluffy cumulus clouds, warm whimsical character designs.`
      : isCartoon
      ? `Film Aesthetics: Colorful 2D storybook cartoon, expressive outlines, joyful children's book illustrations.`
      : is3DAnim
      ? `Film Aesthetics: High-end 3D character animation, warm soft lighting, expressive stylized textures.`
      : isStopMotion
      ? `Film Aesthetics: Physical tactile clay/puppet textures, subtle 12fps tactile shutter cadence, miniature studio lighting.`
      : isComic
      ? `Film Aesthetics: Graphic novel art, halftone print textures, dynamic ink lines, high-contrast comic framing.`
      : `Film Aesthetics: 1080p Full HD, authentic cultural textures, grounded realism, neutral film grain, realistic depth of field.`,
    isCulinary
      ? `Culinary Integrity: Rigid knife grip, stable workstation, clean slicing, no morphing food.`
      : entities.hasVehicleOrMount
      ? `Vehicular Integrity: Any draft animals (bullocks/oxen) must be hitched strictly and exclusively to the front wooden yoke pole facing forward; no animals behind carts or on both sides.`
      : isGhibli
      ? `Animation Integrity: Studio Ghibli watercolor aesthetic, lush pastoral scenery, wholesome character expressions, fluid 24fps hand-drawn motion.`
      : isCartoon
      ? `Animation Integrity: 2D storybook cartoon animation, playful expressions, bright cheerful colors.`
      : is3DAnim
      ? `Animation Integrity: 3D Pixar-style animation, soft global illumination, stylized child-friendly physics.`
      : isVintage
      ? `Period Integrity: Authentic historical setting and wardrobe, no modern clothing or contemporary artifacts.`
      : null,
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
          const station = detectCulinaryStation(actionCleaned + " " + (actionDescription || ""), cameraMovement);
          if (station === "STOVE_COOK") {
            return `Culinary Dynamics: Ingredients cook steadily in the hot skillet with rising aromatic steam and bubbling butter. The cookware remains firmly anchored to the stovetop burner.`;
          }
          if (station === "PLATING_SERVE") {
            return `Culinary Dynamics: Precision garnishing and plating. The finished dish rests stably on the serving dish.`;
          }
          if (station === "COUNTER_REVEAL") {
            return `Culinary Dynamics: The camera glides smoothly across the countertop, showcasing the fresh ingredients. All ingredients remain completely stationary in their natural state.`;
          }
          return `Culinary Dynamics: The knife cuts steadily through the ingredients on the wooden cutting board. The chef remains anchored at the cutting board workstation throughout the movement.`;
        })()
      : hasDialogue
      ? `Facial & Dialogue Dynamics: ${charName} actively speaks dialogue with realistic, perfectly synchronized ${lang} lip movements and emotional expression.`
      : null,
    isCulinary
      ? (() => {
          const station = detectCulinaryStation(actionCleaned + " " + (actionDescription || ""), cameraMovement);
          if (station === "STOVE_COOK") {
            return `Kinematic Invariant: Max two hands in frame. Station Lock: Stovetop station only. Cookware is permanently anchored to the burner. Chef manipulates cooking utensil with steady grip.`;
          }
          if (station === "PLATING_SERVE") {
            return `Kinematic Invariant: Max two hands in frame. Station Lock: Plating station only. Clean presentation.`;
          }
          if (station === "COUNTER_REVEAL") {
            return `Kinematic Invariant: Countertop showcase. Fresh ingredients remain stationary. Camera executes a smooth gliding motion.`;
          }
          return `Kinematic Invariant: Max two hands in frame (knife grip + claw grip); cutting board and pans firmly grounded; clean slicing. Tool Invariant: The solid stainless steel kitchen knife in chef's hand maintains rigid metallic geometry throughout the motion as a solid steel tool. Station Lock: Cutting board workstation only.`;
        })()
      : entities.hasVehicleOrMount
      ? `Vehicular Invariant: Draft animals move strictly forward at the front yoke only.`
      : null,
    `Start Frame Consistency: Animate directly from the uploaded reference start-frame image (Google Flow / Kling / Runway / Luma), preserving 100% of character appearance, kitchen workstation, lighting, and textures.`,
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

