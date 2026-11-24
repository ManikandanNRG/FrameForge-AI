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
  groundActionComponentScale,
  resolveObjectComponentSpecs,
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
  heroPropLock?: string | null;
  heroObject?: string | null;
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
  culinaryStation?: CulinaryStation;
}

export type CulinaryStation = 
  | "RAPID_HOOK"
  | "OBJECT_SOURCING"
  | "TOOL_DISASSEMBLY"
  | "MANUAL_FRACTURE"
  | "KITCHEN_MACHINERY"
  | "CULINARY_CUTTING"
  | "LIQUID_MARINADE"
  | "STOVE_COOK"
  | "PLATING_SERVE"
  | "HERO_REACTION"
  | "COUNTER_REVEAL"
  | "BOARD_PREP";

export function detectCulinaryStation(actionText: string, cameraMotionText?: string | null): CulinaryStation {
  const lower = `${actionText || ""} ${cameraMotionText || ""}`.toLowerCase();

  // 0. Rapid Hook / Sensory Teaser (Scene 1 Opening)
  if (/\b(rapid[- ]fire|4[- ]beat|sensory teaser|crate slam|retention hook|viral hook|rapid hook)\b/i.test(lower)) {
    return "RAPID_HOOK";
  }

  // 1. Hero Reaction / Smirk / Reveal (End shot)
  if (/\b(smirk|look(?:s)? (?:straight )?into (?:the )?camera|lock(?:s)? eyes|tilt(?:s)? head|whisps? of steam curl|hero reveal|rogue smirk|quiet mastery|noodle lift|chopsticks?.*lift|overlooking his creation|ultimate sensory)\b/i.test(lower) &&
      !/\b(toss|chopping|cleaver|pan|wok|skillet|knife)\b/i.test(lower)) {
    return "HERO_REACTION";
  }

  // 2. Plating / Serving station (Final touch, tweezers, garnish, plate, thali, bowl)
  if (/\b(plate|plating|garnish|serving|platter|banquet|dining table|thali|banana[- ]leaf|coupe plate|bowl|tweezer(?:s)? (?:delicately |carefully )?(?:place|lower|deposit)|final (?:touch|ruby-red|key|piece))\b/i.test(lower) &&
      !/\b(chopping|cleaver|dicing|toss(?:ing)?|skillet|wok)\b/i.test(lower)) {
    return "PLATING_SERVE";
  }

  // 3. Stove / Cookware station (Active heat, fire, wok toss, boiling, searing, tadka, tawa)
  const hasStoveKeywords = /\b(skillet|sear|searing|sizzle|sizzling|baste|basting|simmer|simmering|boil|boiling|burner|stove|stovetop|hot oil|foaming butter|wok|charring|flamb|cast-iron skillet|gas flame|flames?|ignit(?:e|ion)|toss(?:ing)?|smoking oil|high-heat|pan sear|tadka|splutter|tawa|kadai|handi pot)\b/i.test(lower);
  const hasCookwarePan = /(?:frying pan|saucepan|saut[eé] pan|cast-iron pan|hot pan|into the pan|in the pan|into pan|in pan|pan sear|pan-sear)\b/i.test(lower) ||
    (/\bpan\b/i.test(lower) && !/\b(?:camera|slowly|smooth|horizontal|lateral)\s+pans?\b/i.test(lower) && !/\bpanning\b/i.test(lower));

  const isStove = (hasStoveKeywords || hasCookwarePan) && !/\b(cutting board|chopping board|deftly chop|slices? seasoned|raw meat|reveal|ingredients like)\b/i.test(lower);
  if (isStove) {
    return "STOVE_COOK";
  }

  // 4. Liquid Pour / Marinade (Rosin flux, oil drizzle, sauce dropper, glaze)
  if (/\b(pour(?:s|ing)?|marinade|marinating|flux|dropper|drizzl(?:e|ing)|glaz(?:e|ing)|bottle of)\b/i.test(lower) &&
      !/\b(chopping|cleaver|dicing|toss(?:ing)?|wok|flame|tadka)\b/i.test(lower)) {
    return "LIQUID_MARINADE";
  }

  // 5. Object Sourcing / Salvage (Shelf, rack, e-waste, unboxing, cable snap, grabbing raw object, crate dump)
  if (/\b(shelf|shelves|scrapyard|storage|reach(?:es)? up|rip(?:s|ping)? free|salvage|salvaging|unboxing|unplugs?|disconnect|retriev(?:e|ing)|grab(?:s|bing)? from|cable snaps?|crate dump|crate|dumps? \d+)\b/i.test(lower) &&
      !/\b(chopping|cleaver|dicing|knife|wok|burner|flame|sear)\b/i.test(lower)) {
    return "OBJECT_SOURCING";
  }

  // 6. Tool Disassembly / Harvest (Keycap puller, switch extractor, screwdriver, pliers, popping keys, tire levers, chain tool, spudger)
  const hasDisassemblyTools = /\b(keycap puller|switch puller|switch extractor|wire puller|puller|extractor|unscrew|screwdriver|pliers|pop(?:s|ping)? off|extract(?:s|ing)? switch|tire levers?|tire pry|chain breaker|chain tool|wrench|allen key|spoke cutters?|unbolt|unthread chain|unseat(?:s|ing|ed)?|peel(?:s|ing|ed)? off rim|prying off|spudger|unlatch(?:es)?|unlatching)\b/i.test(lower);
  const isDedicatedKnifeCadence = /\b(chef knife|cleaver)\s+(?:rapidly |deftly )?(?:chops|dices)\b/i.test(lower);
  if (hasDisassemblyTools && !isDedicatedKnifeCadence) {
    return "TOOL_DISASSEMBLY";
  }

  // 7. Manual Structural Fracture (Snapping board/frame with hands/palm across edge)
  if (/\b(snap(?:s|ping)? (?:the )?(?:board|chassis|frame|body)|fractur(?:e|ing)|crack(?:s|ing)? in two|breaks? in half|palm strike|bends? and snaps?)\b/i.test(lower) &&
      !/\b(knife|cleaver|blade|chop|dicing)\b/i.test(lower)) {
    return "MANUAL_FRACTURE";
  }

  // 7B. Kitchen Machinery / Grinder / Mechanical Crunch Press (Indian mixie, grinder, crunch press, mortar)
  if (/\b(mixie|mixer-grinder|grinder|blender|pulveriz(?:e|ing|es)|crunch press|crush press|stone pestle|mortar and pestle)\b/i.test(lower) &&
      !/\b(cleaver.*chop|dicing|skillet|tawa|wok)\b/i.test(lower)) {
    return "KITCHEN_MACHINERY";
  }

  // 8. Culinary Cutting / Dicing / Slicing (Damascus cleaver, chef knife, chiffonade, dicing)
  if (/\b(cleaver|chef knife|blade|chop(?:s|ping)?|dicing|dice|julienne|chiffonade|slic(?:e|ing)|cut(?:s|ting)? into|knife)\b/i.test(lower)) {
    return "CULINARY_CUTTING";
  }

  // 9. Countertop / Ingredient Reveal station (Mise En Place)
  const isReveal = /\b(reveal|revealing|countertop|fresh ingredients|mise en place|showcase|ingredients like|table setting|overview)\b/i.test(lower) &&
    !/\b(chopping|slicing|cutting|dicing|sear|sizzle|skillet|baste)\b/i.test(lower);
  if (isReveal) {
    return "COUNTER_REVEAL";
  }

  // 10. Default: Cutting board / prep station
  return "BOARD_PREP";
}

/**
 * Resolves high-speed linear robotic motion control camera kinematics for culinary/inedible ASMR.
 * Converts traditional handheld or generic movement into Bolt cinema rig / motorized rail linear trajectories.
 */
export function resolveLinearRoboticCameraMotion(rawMovement?: string | null, isCulinary?: boolean): string {
  if (!isCulinary) {
    if (rawMovement && rawMovement !== "Static" && !rawMovement.includes("[PRODUCTION SPECS]")) {
      return rawMovement;
    }
    return "Subtle cinematic handheld camera motion at 24fps with natural organic float";
  }

  const raw = (rawMovement || "").trim();
  const lower = raw.toLowerCase();

  if (lower.includes("snap") || lower.includes("drop")) {
    return "High-speed robotic motion control arm (Bolt rig) rapid vertical drop and linear snap-lock, perfectly steady mechanical stop, zero handheld wobble";
  }
  if (lower.includes("orbit") || lower.includes("360")) {
    return "Robotic motion control arm 360-degree linear motorized circular orbit on precision steel rail, perfectly constant angular velocity, mechanically locked framing";
  }
  if (lower.includes("flat lay") || lower.includes("top-down") || lower.includes("overhead")) {
    return "Motorized overhead 90-degree linear rig, mechanically locked top-down flat lay, rock-solid constant velocity linear framing, zero organic sway";
  }
  if (lower.includes("oil surface") || lower.includes("low angle") || lower.includes("surface push")) {
    return "High-speed robotic probe lens linear surface push at 60fps, razor-sharp mechanical track stabilization across sizzling surface, zero handheld shake";
  }
  if (lower.includes("pan") || lower.includes("slide") || lower.includes("glide") || lower.includes("track")) {
    return "Motorized linear slider high-speed constant-velocity tracking glide, perfectly linear horizontal move on precision motion rail, zero organic float";
  }
  if (lower.includes("tilt") || lower.includes("pull")) {
    return "Motorized linear pedestal pull-back and smooth robotic vertical tilt up on motion control arm, perfectly linear mechanical trajectory, zero handheld wobble";
  }
  if (raw && raw !== "Static" && !raw.includes("[PRODUCTION SPECS]")) {
    return `High-speed precision robotic motion control camera (Bolt rig / motorized linear slider) executing ${raw}, strictly linear mechanical trajectory, zero handheld float`;
  }

  return "High-speed precision robotic motion control arm (Bolt rig / motorized linear rail slider), perfectly linear push-in glide, constant-velocity mechanical probe lens movement at 60fps, zero handheld shake";
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
    heroPropLock,
    heroObject,
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
  const actionLower = (actionDescription || "").toLowerCase();

  const isExplicitCookingGenreOrIdea =
    styleUpper === "CULINARY_MACRO_ASMR" ||
    (genre || "").toLowerCase().includes("cooking") ||
    (genre || "").toLowerCase().includes("culinary") ||
    (genre || "").toLowerCase().includes("recipe") ||
    (genre || "").toLowerCase().includes("inedible") ||
    ideaLower.includes("cooking") ||
    ideaLower.includes("recipe") ||
    ideaLower.includes("culinary") ||
    ideaLower.includes("inedible");

  const isInedibleCooking =
    Boolean(entities.isInedibleCooking) ||
    (isExplicitCookingGenreOrIdea && (
      Boolean(heroObject) ||
      Boolean(heroPropLock) ||
      /\b(keyboard|keycaps?|cherry mx|switch(?:es)?|pcb|circuit board|motherboard|airbuds?|airpods?|earphones?|smartphones?|mobile phone|nokia|3310|1100|brick phone|battery|batteries|screws?|bolts?|copper wire|stones?|granite|rocks?|metal scrap|e-waste|hardware|tech scrap|non-food|inedible|wristwatches?|mechanical clock|sneakers?|light bulb|marbles?|soaps?|cleaning bars?|detergent bars?)\b/i.test(ideaLower + " " + actionLower + " " + (genre || ""))
    ));

  const heroTargetName = (heroObject || entities.inedibleHeroObject || "Hero Object").replace(/^(the|a|an)\s+/i, "");

  const isCulinaryGenreOrIdea =
    isInedibleCooking ||
    (genre || "").toLowerCase().includes("cooking") ||
    (genre || "").toLowerCase().includes("culinary") ||
    (genre || "").toLowerCase().includes("recipe") ||
    (genre || "").toLowerCase().includes("food") ||
    ideaLower.includes("cooking") ||
    ideaLower.includes("recipe") ||
    ideaLower.includes("culinary");

  const isCulinary =
    styleUpper === "CULINARY_MACRO_ASMR" ||
    isInedibleCooking ||
    (isCulinaryGenreOrIdea && entities.hasCulinaryAction);

  const isPureAsmr =
    isInedibleCooking ||
    (genre || "").toLowerCase().includes("asmr") ||
    (tone || "").toLowerCase().includes("asmr") ||
    ideaLower.includes("asmr") ||
    styleUpper === "CULINARY_MACRO_ASMR" ||
    dialogue === "PURE_ASMR_FOLEY" ||
    (!dialogue && !voiceover && isCulinary);

  const isDocumentary =
    styleUpper === "DOCUMENTARY" ||
    styleUpper === "DOCUMENTARY_CINEMA" ||
    styleUpper === "DOCUMENTARY_CINEMATIC" ||
    (genre || "").toLowerCase().includes("documentary");

  const isVintage =
    !isCulinary &&
    !isDocumentary &&
    (styleUpper === "VINTAGE_FILM" ||
      entities.hasPeriodSetting ||
      ideaLower.includes("1900") ||
      ideaLower.includes("vintage") ||
      ideaLower.includes("old years") ||
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
  const isBlackAndWhite = styleUpper === "BLACK_AND_WHITE" || styleUpper === "FILM_NOIR";

  // Dynamic Style Description for Google Flow / Veo
  let dynamicStyleDirective = "Photorealistic cinematic film, 35mm lens, authentic cultural textures, shallow depth of field, 24fps";
  let dynamicPeriodDirective = "";

  if (isInedibleCooking) {
    dynamicStyleDirective = `Ultra-high-definition macro craft-culinary cinema, 50mm/85mm probe macro lens optics, f/1.8 shallow depth of field, glistening translucent culinary glaze, authentic physical textures of ${heroTargetName}, warm industrial directional spotlight, 60fps high-speed fluid and spark physics, high-speed robotic motion control cinematography (Bolt cinema arm / motorized linear rail slider), strictly linear constant-velocity tracking and probe push-ins, zero handheld camera shake`;
    dynamicPeriodDirective = `- Inedible Craft-Culinary Continuity: Maintain 100% physical material integrity of ${heroTargetName}. Components must retain their authentic material shape, contours, labels, and textures; strictly PROHIBIT dissolving into generic cubes or dice. Plated dish must be composed 80% of authentic components of ${heroTargetName}, strictly not disguised as wheat noodles or grocery food.${heroPropLock ? ` Locked Prop DNA: ${heroPropLock}.` : ""}`;
  } else if (isCulinary) {
    dynamicStyleDirective = "Ultra-high-definition macro culinary cinema, 50mm/85mm probe macro lens optics, f/1.8 shallow depth of field, glistening natural oils, crisp fresh ingredient textures, natural warm kitchen directional lighting, 60fps high-speed fluid and rising steam physics, high-speed robotic linear slider camera movement, zero handheld camera shake";
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

  // 1. Duration Quantization (Google Flow / Omni 1.1 Flash minimum 8s standard; Kling / Veo / Wan 4s-5s for rapid ASMR shorts)
  const rawDuration = targetDurationSeconds || 8;
  const normalizedDuration = rawDuration <= 4 ? 4 : rawDuration <= 6 ? 5 : rawDuration >= 9 ? 10 : 8;
  const targetDurationLabel = `${normalizedDuration} seconds`;

  // 2. Aspect Ratio & Framing
  const isPortrait = aspectRatio === "PORTRAIT_9_16" || aspectRatio === "9:16";
  const isSquare = aspectRatio === "SQUARE_1_1" || aspectRatio === "1:1";
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
  if (isInedibleCooking) {
    const isSmallComponents = /\b(keycaps?|keys?|switches?|resistors?|diced|cubes?|chips?|screws?|wires?|ribbon|puller|springs?|earbuds?|tweezers?|plating)\b/i.test(actionLower);
    if (isSmallComponents || framingLower.includes("macro") || framingLower.includes("close")) {
      dynamicLensFraming = `${framingLower.includes("macro") ? shotFraming : "Macro Close-Up Shot"}, 85mm probe macro lens at 45° angle, f/1.8 shallow depth of field, razor-sharp focus on authentic components of ${heroTargetName}, surface textures, and culinary glaze`;
    } else if (framingLower.includes("top-down") || framingLower.includes("overhead") || framingLower.includes("bird") || framingLower.includes("flat lay")) {
      dynamicLensFraming = `${shotFraming}, 90-degree overhead bird's-eye flat lay perspective looking directly down at the workstation cutting board and ${heroTargetName} components`;
    } else if (framingLower.includes("close-up") || framingLower.includes("cu")) {
      dynamicLensFraming = `${shotFraming}, 50mm cinema prime lens, creamy background bokeh, appetizing lighting`;
    } else if (framingLower.includes("wide")) {
      dynamicLensFraming = `${shotFraming}, 24mm wide master lens, clean workshop background staging`;
    }
  } else if (isCulinary) {
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

  // 3. Clean, normalize, and sanitize actions against AI text hallucinations
  const sanitizeOnScreenText = (t: string): string =>
    t
      .replace(/\b(?:On-screen text|On screen text|Text on screen|Subtitles?|Caption|Title overlay|Watermark|Disclaimer)\s*:\s*['"][^'"]*['"]\.?/gi, "")
      .replace(/\b(?:On-screen text|On screen text|Text on screen|Subtitles?|Caption|Title overlay|Watermark|Disclaimer)\s*:\s*[^\n.]+\.?/gi, "")
      .replace(/["']?CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY[^"'\n.]*["']?\.?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const rawAction = sanitizeOnScreenText(actionDescription.trim());
  const naturalAction = sanitizeOnScreenText(
    rawAction
      .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
      .replace(/@([A-Za-z0-9_-]+)/g, "$1")
      .replace(/\s{2,}/g, " ")
      .replace(/\.{2,}/g, ".")
      .trim()
  );

  const scaleResolution = groundActionComponentScale(naturalAction, heroTargetName);
  const groundedActionText = scaleResolution.groundedText;

  // 4. Character Tagging and Wardrobe Lock
  const mentionsShadowAlchemist = /shadow\s*alchemist|alchemist/i.test(`${actionDescription} ${sourceIdea || ""}`);
  const isGenericCharName =
    (!characterName || characterName.trim().length === 0 || characterName.toLowerCase() === "character") &&
    !mentionsShadowAlchemist &&
    !isInedibleCooking;
  const hasRealCharacter = !isGenericCharName;
  const rawCharName = hasRealCharacter
    ? characterName?.trim() || (isInedibleCooking || mentionsShadowAlchemist ? "The Shadow Alchemist" : "")
    : "";
  const charName = /Shadow\s*Alchemist/i.test(rawCharName) ? "The Shadow Alchemist" : rawCharName;
  const bracketedCharTag = charName ? `[@${charName.replace(/[^a-zA-Z0-9]/g, "")}]` : "";

  const actionCleaned = sanitizeOnScreenText(
    groundedActionText
      .replace(/\((?:wearing|dressed in)[^)]*\)\s*/gi, "")
      .replace(/\bthe shadow alchemist\b/gi, bracketedCharTag || "The Shadow Alchemist")
      .replace(/\bthe alchemist\b/gi, bracketedCharTag || "The Shadow Alchemist")
      .replace(/\s{2,}/g, " ")
      .replace(/\.{2,}/g, ".")
      .trim()
  );

  const resolvedCharacterDescription =
    characterDescription ||
    (charName === "The Shadow Alchemist"
      ? "an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes, dark wavy hair with vintage brass dual-lens tinker goggles resting on crown, wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves"
      : "");

  const resolvedWardrobeLock =
    wardrobeLock ||
    (charName === "The Shadow Alchemist"
      ? "sleek matte-black tactical half-mask with vertical gold cheekline vents, vintage brass dual-lens tinker goggles on forehead, dark rolled-sleeve work shirt, distressed leather apron, and black textured grip gloves"
      : "");

  let taggedAction = rawAction;
  if (hasRealCharacter && bracketedCharTag) {
    if (/\bthe shadow alchemist\b/i.test(taggedAction)) {
      taggedAction = taggedAction.replace(/\bthe shadow alchemist\b/gi, bracketedCharTag);
    } else if (/\bthe alchemist\b/i.test(taggedAction)) {
      taggedAction = taggedAction.replace(/\bthe alchemist\b/gi, bracketedCharTag);
    } else if (!taggedAction.includes("[@")) {
      taggedAction = `${bracketedCharTag} ${taggedAction}`;
    }
  }

  if (hasRealCharacter && resolvedWardrobeLock && taggedAction.includes(bracketedCharTag)) {
    const hasWardrobe = /wearing|dressed in|shorts|saree|dhoti|veshti|pants/i.test(taggedAction);
    if (!hasWardrobe) {
      taggedAction = taggedAction.replace(
        bracketedCharTag,
        `${bracketedCharTag} (wearing ${resolvedWardrobeLock})`,
      );
    }
  }
  taggedAction = sanitizeOnScreenText(taggedAction);

  // 5. Camera Movement Resolution (Linear Robotic Motion Control for Culinary/Inedible)
  let cameraMotion = resolveLinearRoboticCameraMotion(cameraMovement, isInedibleCooking || isCulinary);
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

  // Culinary negatives to prevent phantom limbs, floating utensils, morphing food, or amateur handheld camera motion
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
      "disappearing food",
      "handheld camera",
      "handheld camera shake",
      "organic camera float",
      "organic sway",
      "breathing camera wobble",
      "traditional cooking video shoot",
      "amateur cooking video",
      "shaky cam",
      "casual handheld camera",
      "unsteady camera operator",
      "camera drift",
      "non-linear camera jitter",
      "accidental camera bump",
      "tilting wobble"
    );

    const station = detectCulinaryStation(actionCleaned + " " + (actionDescription || ""), cameraMovement);

    if (station === "RAPID_HOOK") {
      negativeList.push(
        "cooking stove",
        "iron tawa",
        "scrapers on tawa",
        "frying pan",
        "generic cubes",
        "plain plastic blocks",
        "tofu",
        "real food",
        "cooked chicken",
        "triangle",
        "triangle pyramids",
        "handheld camera wobble",
        "blur",
        "slow motion walking",
        "talking",
        "dialogue"
      );
    } else if (station === "OBJECT_SOURCING") {
      negativeList.push(
        "cutting board",
        "wooden chopping board",
        "chopping knife",
        "chef knife",
        "cleaver",
        "knife in hand",
        "slicing",
        "chopping",
        "dicing",
        "loose keys on table",
        "loose switches on table",
        "scattered keys",
        "stove",
        "open flame",
        "wok",
        "frying pan",
        "raw meat",
        "steak",
        "food",
        "onions",
        "vegetables",
        "cooking on stove",
        "frying ladle",
        "skimmer ladle",
        "skimmer spoon",
        "spoons on pan",
        "kadai on stove",
        "boiling oil",
        "deep frying",
        "premature cooking"
      );
    } else if (station === "TOOL_DISASSEMBLY") {
      negativeList.push(
        "kitchen knife",
        "chef knife",
        "cleaver",
        "slicing",
        "chopping",
        "stove",
        "open flame",
        "wok",
        "pre-scattered keys",
        "loose switches on table before extraction",
        "raw meat",
        "food"
      );
    } else if (station === "MANUAL_FRACTURE") {
      negativeList.push(
        "kitchen knife",
        "chef knife",
        "cleaver",
        "slicing",
        "chopping",
        "stove",
        "open flame",
        "wok",
        "raw meat",
        "food",
        "vanishing pieces"
      );
    } else if (station === "KITCHEN_MACHINERY") {
      negativeList.push(
        "chopping knife",
        "cleaver",
        "cutting board",
        "stove",
        "open flame",
        "frying pan",
        "wok",
        "raw meat",
        "food"
      );
    } else if (station === "CULINARY_CUTTING") {
      negativeList.push(
        "disappearing object",
        "vanishing chassis",
        "morphing into food",
        "generic cubes",
        "tofu",
        "stove",
        "open flame",
        "wok",
        "raw meat",
        "steak"
      );
    } else if (station === "LIQUID_MARINADE") {
      negativeList.push(
        "chopping knife",
        "cleaver",
        "stove",
        "open flame",
        "wok",
        "raw meat",
        "food"
      );
    } else if (station === "STOVE_COOK") {
      negativeList.push(
        "cutting board",
        "wooden chopping board",
        "chopping knife",
        "cleaver",
        "slicing raw meat",
        "raw ingredient prep",
        "knife in hand",
        "cutting knife",
        "walking away from stove",
        "untouched separate ingredients",
        "unmixed raw piles",
        "ingredients not mixing",
        "cutting in background"
      );
    } else if (station === "PLATING_SERVE") {
      negativeList.push(
        "stove",
        "open flame",
        "frying pan",
        "sizzling skillet",
        "raw meat",
        "chopping knife",
        "cleaver",
        "cleaver slicing",
        "cutting board",
        "wooden chopping board",
        "chopping on board",
        "knife slicing",
        "cutting in background",
        "bread wrap",
        "burrito wrap",
        "raw untouched piles",
        "separate unmerged ingredients",
        "unmixed raw piles"
      );
    } else if (station === "HERO_REACTION") {
      negativeList.push("chopping knife", "cleaver", "chopping", "slicing", "stove", "open flame", "raw meat", "food");
    } else if (station === "COUNTER_REVEAL") {
      negativeList.push("stove", "frying pan", "skillet", "hot oil", "sizzle", "cooking", "flame", "boiling", "chopping knife", "picking up meat", "putting meat in pan", "throwing in pan", "dropping in pan", "teleporting", "roaring flame", "wok", "gas burner", "burning stove", "cooking in background");
    } else {
      // BOARD_PREP
      negativeList.push("stove", "frying pan", "skillet", "hot oil", "dropping herbs into pan", "curry leaf in pan", "burner flame", "cooking on stove", "knife turning into herbs", "knife turning into leaf", "blade morphing into plant", "transforming knife", "knife changing shape", "picking up raw steak", "putting meat in pan", "teleporting", "walking away from board", "roaring flame", "wok", "gas burner", "burning stove", "cooking in background");
    }
  }

  // Universal negatives to eliminate burned-in text, subtitles, and watermarks across all models
  negativeList.push(
    "on-screen text",
    "subtitles",
    "burned-in text",
    "watermark",
    "captions",
    "letters",
    "words on screen",
    "disclaimer text",
    "typography",
    "logo"
  );

  // Inedible technical cooking negatives to eliminate generic cubes, dice, real food, and fast food hallucinations
  if (isInedibleCooking) {
    negativeList.push(
      "generic cubes",
      "plain plastic blocks",
      "tofu",
      "dice",
      "wheat noodles",
      "pasta",
      "flour spaghetti",
      "lo mein",
      "real food",
      "grocery food",
      "meat",
      "pork bacon",
      "real bacon",
      "cooked meat",
      "chicken",
      "beef",
      "tomatoes",
      "diced tomatoes",
      "onions",
      "diced onions",
      "salsa",
      "pico de gallo",
      "real cheese",
      "cheddar cheese",
      "dairy cheese",
      "dairy",
      "tortilla",
      "real bread",
      "edible food",
      "grocery vegetables",
      "broccoli",
      "blurry keys",
      "deformed components",
      "eating",
      "biting",
      "chewing",
      "tasting",
      "putting in mouth",
      "swallowing",
      "open mouth",
      "licking"
    );

    // Character identity & anatomy locks
    negativeList.push(
      "different actor",
      "face morphing",
      "character drift",
      "changing ethnicity",
      "circular respirator filters",
      "gas mask canister",
      "breathing tubes",
      "missing goggles",
      "extra fingers",
      "deformed thumb",
      "rubbery hands",
      "floating arm"
    );

    // Dynamic Sub-Component Scale & Anti-Drift Negatives
    if (scaleResolution.negativeTokens.length > 0) {
      negativeList.push(...scaleResolution.negativeTokens);
    }
    if (scaleResolution.isLargeObject) {
      negativeList.push(
        "tiny domestic frying pan",
        "small kitchen skillet",
        "household saucepan"
      );
    }

    // Hero Prop locks
    const isGameBoyTarget = /game\s*boy|gameboy|pokemon|nintendo/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isGameBoyTarget) {
      negativeList.push(
        "classic 1989 grey Game Boy",
        "beige DMG-01 brick",
        "grey handheld housing",
        "retro 1989 DMG"
      );
    }

    const isBicycleTarget = /bicycl|bycycl|cycle|bike|tire|chain|pedal|spoke/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isBicycleTarget) {
      negativeList.push(
        "car tire",
        "truck tire",
        "automotive tire",
        "tractor tire",
        "motorcycle tire",
        "fat vehicle tire",
        "giant automotive tire",
        "thick car rubber",
        "car wheel",
        "automotive rim",
        "semi truck wheel"
      );
    }

    const isNokiaTarget = /nokia|3310|1100|brick phone|feature phone|keypad phone/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isNokiaTarget) {
      negativeList.push(
        "modern touchscreen smartphone",
        "iPhone",
        "Android smartphone",
        "curved OLED glass",
        "single phone",
        "grocery food",
        "car battery",
        "household teacup"
      );
    }

    const isSoapOrBulkHotel = /\b(soap|soaps|laundry bar|bath soap|carbolic soap|kothu parotta)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isSoapOrBulkHotel) {
      negativeList.push(
        "few pieces",
        "sparse ingredients",
        "small portion",
        "tiny pile",
        "single soap bar",
        "small domestic pan",
        "domestic skillet",
        "small cutting board",
        "home kitchen",
        "empty table",
        "miniature serving",
        "scanty food",
        "solitary object",
        "triangle",
        "triangle shape",
        "pyramid",
        "pyramid shape",
        "geometric cone",
        "conical pile",
        "conical mound",
        "conical pyramid",
        "rigid pyramid",
        "identical triangle shape",
        "real meat",
        "real cooked chicken",
        "shredded chicken",
        "chicken kothu",
        "cooked chicken meat",
        "shredded poultry",
        "dull brown food",
        "brown cooked food",
        "brown chicken",
        "brown meat heap",
        "ordinary grocery food",
        "real wheat flour",
        "realistic edible food",
        "meat curry",
        "missing soap elements",
        "missing blue soap",
        "missing ruby soap",
        "missing emerald soap"
      );
    }

    const isBulbTarget = /\b(bulb|bulbs|light\s*bulb|serial\s*bulb|serial\s*lights|edison\s*bulb|filament|fairy\s*lights|samosas?)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isBulbTarget) {
      negativeList.push(
        "few bulbs",
        "single bulb",
        "small domestic pan",
        "domestic skillet",
        "empty table",
        "soap",
        "soap lather",
        "bubbles",
        "real potatoes",
        "real peas",
        "real chicken",
        "real meat",
        "shredded chicken",
        "curry sauce bottle",
        "ketchup bottle",
        "fluorescent tube",
        "LED flat panel",
        "plastic toys",
        "grocery food"
      );
    }

    const isStoneTarget = /\b(stones?|quartz|granite|rock|rocks?|boulder|boulders?|idiyappam|string hopper)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isStoneTarget) {
      negativeList.push(
        "yellow egg noodles",
        "instant ramen cake",
        "soft tofu cubes",
        "grocery flour sack",
        "plastic hand squeezer",
        "deep fried food",
        "brown pastry",
        "oil pouring",
        "frying oil ladle",
        "soap",
        "light bulbs",
        "meat",
        "chicken",
        "opaque white bakery dough",
        "bread dough",
        "pizza dough",
        "wheat dough",
        "grocery flour",
        "maida",
        "white rice vermicelli",
        "boiled pasta",
        "grocery noodles",
        "vegetable curry",
        "diced potatoes",
        "horizontal lathe press",
        "horizontal extruder",
        "overhead screw jack",
        "overhead ceiling screw column"
      );
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

  if (isInedibleCooking) {
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.getInedibleObjectPhysics(heroTargetName)}`);
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.PROGRESSIVE_CULINARY_FUSION}`);
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.ROBOTIC_LINEAR_CAMERA_KINEMATICS}`);
    flowRules.push(`- Inedible Prop & Food Negative Directives: Strictly NO on-screen text, NO subtitles, NO captions, NO burned-in watermarks. Strictly NO real grocery food, NO pork bacon, NO raw or diced tomatoes, NO onions, NO dairy cheese slices, NO edible fast food, NO separate unmerged raw piles. All elements must maintain authentic inedible hardware physics.`);
    const isGameBoyTarget = /game\s*boy|gameboy|pokemon|nintendo/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isGameBoyTarget) {
      flowRules.push(`- Console Prop DNA Invariant: Authentic Translucent Purple Game Boy Color (atomic purple translucent chassis clearly exposing green PCB circuitry, magenta A/B buttons); strictly PROHIBIT 1989 classic grey/beige Game Boy DMG-01 housing, strictly NO thick rectangular beige brick.`);
    }
    const isNokiaTarget = /nokia|3310|1100|brick phone|feature phone|keypad phone/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isNokiaTarget) {
      flowRules.push(`- Phone Prop DNA Invariant: Authentic Bulk Vintage Nokia Mobile Phones (15x Nokia 1100 & 3310 in classic navy blue, slate grey, and cyan shells with rubber keypads); strictly PROHIBIT modern smartphones, curved glass, or touchscreen iPhones.`);
    }
    const isStoneTarget = /\b(stones?|quartz|granite|rock|rocks?|boulder|boulders?|idiyappam|string hopper)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
    if (isStoneTarget) {
      flowRules.push(`- Stone & Noodle DNA Invariant: Authentic raw white quartz crystal boulders, rough granite, and crystalline mineral flour extruded into ultra-fine translucent silica noodle threads; strictly PROHIBIT yellow egg noodles, wheat pasta, instant ramen cakes, deep-fried pastry, or frying oil pouring.`);
    }
    if (charName || characterName) {
      flowRules.push(`- Master Character Lock: ${bracketedCharTag || `[@${charName.replace(/[^a-zA-Z0-9]/g, "")}]`} strictly maintains immutable facial geometry, intense hazel eyes, brass tinker goggles on crown, and sleek matte-black half-mask with gold cheekline slit vents. Strictly PROHIBIT circular respirator canisters, breathing tubes, or character face drift.`);
    }
    if (heroPropLock) {
      flowRules.push(`- Hero Prop DNA Lock: ${heroPropLock}`);
    }
    if (targetDurationSeconds && targetDurationSeconds <= 5) {
      flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.VIRAL_RAPID_ASMR_PACING}`);
    }
  } else if (isCulinary) {
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.CULINARY_ASMR_PHYSICS}`);
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.PROGRESSIVE_CULINARY_FUSION}`);
    flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.ROBOTIC_LINEAR_CAMERA_KINEMATICS}`);
    if (targetDurationSeconds && targetDurationSeconds <= 5) {
      flowRules.push(`- ${UNIVERSAL_PHYSICAL_LAWS.VIRAL_RAPID_ASMR_PACING}`);
    }
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
    hasRealCharacter && resolvedWardrobeLock && bracketedCharTag
      ? `- Character Wardrobe Lock: ${bracketedCharTag} strictly wears ${resolvedWardrobeLock}. Maintain 100% clothing and physical consistency across every scene.`
      : null,
    ...flowRules,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // 9. Build Kling / Sora Prompt (Credit-Optimized & Period-Aware)
  const klingSceneType = isInedibleCooking
    ? `An ultra-photorealistic macro technical-culinary ASMR ${framingDesc} scene.`
    : isCulinary
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
    : hasRealCharacter
    ? `Aesthetics: Photorealistic 1080p cinema footage, authentic human skin pores with subtle perspiration, natural textile cloth physics, grounded realism, shallow depth of field.`
    : `Aesthetics: Photorealistic 1080p cinema footage, natural organic textures, grounded realism, neutral film grain, shallow depth of field.`;

  const klingPrompt = [
    klingSceneType,
    hasRealCharacter && charName
      ? `Subject: ${charName}, an authentic character with ${(characterDescription || (isCulinary ? "experienced chef hands, rolled-up linen shirt sleeves" : isAnimated ? "charming expressive animated features" : "authentic regional traits")).replace(/\.+$/, "")}, strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
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
      ? `Culinary Invariant: Max two hands in frame (knife grip + claw grip); cutting board and pans firmly grounded; progressive culinary fusion (ingredients blend into one unified dish, no raw untouched piles); no morphing ingredients or floating knives.`
      : null,
    klingAesthetics,
    `--ar ${arParam} ${klingModeFlag} --negative "${universalNegativePrompt}"`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".");

  // 10. Build FLUX.1 Still Reference Prompt (Fast, clean 1080p, Period-Aware)
  const fluxStillOpening = isInedibleCooking
    ? `A breathtaking macro technical-culinary photography still, ${shotFraming}.`
    : isCulinary
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

  const isSoapTarget = /\b(soap|soaps|laundry bar|bath soap|glycerine soap|carbolic soap|kothu parotta)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
  const isBulbTarget = /\b(bulb|bulbs|light\s*bulb|serial\s*bulb|serial\s*lights|edison\s*bulb|filament|fairy\s*lights|samosas?)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);
  const isStoneTarget = /\b(stones?|quartz|granite|rock|rocks?|boulder|boulders?|idiyappam|string hopper)\b/i.test(`${actionDescription} ${heroTargetName} ${sourceIdea || ""}`);

  const fluxCinematography = isInedibleCooking
    ? isSoapTarget
      ? `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on dense unbranded soap bar textures, crisp manufactured edges, paper-thin translucent curly ribbon shavings, glistening golden oil reflections, creamy background bokeh, commercial hotel kitchen lighting.`
      : isBulbTarget
      ? `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on vintage amber Edison glass, glowing incandescent spiral tungsten filaments, vibrant multi-colored jewel glass serial rice bulbs, bubbling golden kadai oil reflections, creamy background bokeh, warm industrial directional spotlighting.`
      : isStoneTarget
      ? `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on crystalline white quartz facet planes, rough granite textures, silky pure white mineral flour, and continuous translucent silica noodle threads, creamy background bokeh, warm dramatic directional workshop spotlight.`
      : `Cinematography: Shot on 85mm f/1.8 macro probe lens, razor-sharp focus on authentic technical hardware components, laser-etched legends and metallic contacts, creamy background bokeh, warm industrial directional spotlight, glistening translucent rosin flux glaze.`
    : isCulinary
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
    : hasRealCharacter
    ? `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting || "warm natural golden hour sunlight, soft shadows"}, shallow depth of field, authentic human skin pores, Kodak Portra 400 film grain, 24fps motion blur, realistic cloth textile folds.`
    : `Cinematography: Shot on 35mm master anamorphic prime lens, ${lighting || "warm natural golden hour sunlight, soft shadows"}, shallow depth of field, natural organic textures, Kodak Portra 400 film grain, 24fps motion blur.`;

  const station = detectCulinaryStation(actionCleaned + " " + (actionDescription || ""), cameraMovement);

  const resolvedEnvironment = (() => {
    if (isInedibleCooking && (station === "OBJECT_SOURCING" || station === "RAPID_HOOK")) {
      if (isSoapTarget) {
        return locationDescription || "Commercial wholesale soap market warehouse with stacked wooden crates filled with hundreds of unbranded laundry washing bars and bath soaps under bright industrial market lighting";
      }
      if (isBulbTarget) {
        return locationDescription || "Atmospheric heavy industrial electrical workshop with reinforced steel workbench, yellow hydraulic JCB excavator claw or automated factory conveyor infrastructure, and rustic background brickwork under warm dramatic directional lighting";
      }
      if (isStoneTarget) {
        return locationDescription || "Dramatic mountain rock quarry extraction bench at dusk with rugged granite walls, vibrating industrial steel chute, heavy steel anvil counter, and warm directional golden-hour lighting";
      }
      if (locationDescription) {
        const cleaned = locationDescription
          .replace(/In the center is a heavy industrial steel workbench.*?wok burner\.?/gi, "")
          .replace(/dark walnut end-grain butcher block.*?wok burner\.?/gi, "")
          .replace(/roaring blue-flame gas wok burner\.?/gi, "")
          .trim();
        return cleaned || "Atmospheric electronics scrapyard with industrial steel shelving units, stacked retro CRT monitors, green motherboard racks, copper wire spools, and cool cyan neon fog";
      }
      return "Atmospheric electronics scrapyard with industrial steel shelving units, stacked retro CRT monitors, green motherboard racks, copper wire spools, and cool cyan neon fog";
    }
    if (isInedibleCooking && (station === "PLATING_SERVE" || station === "HERO_REACTION")) {
      if (isSoapTarget) {
        return locationDescription || "Commercial Madurai hotel feast table with a giant fresh vibrant green banana leaf on a massive 24-inch polished brass wedding thali, surrounded by small brass bowls";
      }
      if (isBulbTarget) {
        return locationDescription || "Traditional Indian festive banquet table with a colossal 24-inch embossed polished brass thali lined with fresh emerald banana leaf and small brass katori chutney bowls under warm dramatic directional lighting";
      }
      if (isStoneTarget) {
        return locationDescription || "Traditional South Indian banquet table with a colossal 24-inch embossed polished brass thali lined with fresh emerald banana leaf, brass katoris of pearly silica glaze and glowing gemstone kurma, with three massive raw uncut white quartz crystal boulders resting in the crisp foreground establishing indisputable proof of the raw mineral material under warm dramatic directional spotlight";
      }
      const isWhitePlate = /white plate|white ceramic|porcelain|coupe plate|swoosh|michelin|plated artwork/i.test(actionCleaned + " " + (locationDescription || ""));
      if (isWhitePlate) {
        return "Pristine minimalist restaurant studio table with pure black velvet background and focused overhead spotlight illuminating a bright white ceramic plate";
      }
    }
    return locationDescription || (isCulinary ? "Master culinary kitchen, end-grain walnut cutting board, seasoned cast iron skillet" : isVintage ? "Authentic 1900s historical Pudukkottai town" : isGhibli ? "Lush vibrant green meadow under sunny blue sky with fluffy white clouds" : isKids ? "Bright sunny meadow playground" : "Cinematic setting");
  })();

  const fluxAesthetics = isInedibleCooking
    ? (() => {
        if (isSoapTarget) {
          if (station === "PLATING_SERVE" || station === "HERO_REACTION") {
            return `Strict Aesthetics: Authentic transformed physical soap materials (80% visibly identifiable soap components in culinary street format). INEDIBLE ILLUSION & SOAP MATERIAL REALISM: In the immediate foreground directly in front of the colossal 24-inch polished brass thali, three pristine whole raw unbranded soap bars rest on the rustic dark wood table crowned with delicate frothy white soap lather bubbles and scattered marigold flower petals (a rectangular translucent ultramarine-blue laundry bar, a glowing radiant ruby-red glycerine bar, and a round green herbal soap cake) establishing indisputable visual proof of the raw inedible source materials. Plated generously across the giant vibrant green banana leaf, the glistening inedible soap kothu parotta fills the center: paper-thin translucent ivory soap ribbon curls, distinct vibrant seared ultramarine-blue laundry cubes, glowing glassy translucent ruby-red glycerine gems, and bright emerald-green herbal soap rings all tossed together in a shimmering amber glycerin glaze with delicate frothy iridescent soap lather micro-bubbles along the edges. Accompanied by three brass bowls of glossy white whipped shaving-foam raita dotted with ruby gems, bubbling golden glycerin salna, and crispy golden dried loofah shreds. Strictly NO real cooked chicken, NO shredded meat, NO real wheat flour, NO ordinary brown food, NO dull brown meat piles, NO triangle pyramid cones, NO stiff geometric pyramids, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "OBJECT_SOURCING" || station === "RAPID_HOOK") {
            return `Strict Aesthetics: Authentic intact physical bars of unbranded commercial laundry washing blocks and bath soaps in wholesale market volume (rustic heavy wooden crates, vibrant unbranded colors: ultramarine blue, carbolic yellow, brick red, white grooved, translucent ruby and emerald). Dark distressed timber prep counter under warm directional spotlight. Heavy carbon-steel cleaver split with crystalline shards. Strictly NO cooking stoves, NO black iron tawa, NO scrapers on tawa, NO domestic cookware, NO small frying pans, NO kothu pounding on tawa, NO food, NO meat, NO generic cubes, NO triangle pyramids, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "BOARD_PREP" || station === "CULINARY_CUTTING") {
            return `Strict Aesthetics: Traditional Japanese wood hand plane vigorously peeling voluminous mountain of paper-thin translucent curly soap ribbons, and sharp cleaver dicing red soap into ruby onion gems and slicing green loofah into emerald rings on dark end-grain wooden butcher block. Ingredients separated into polished brass katori bowls. Strictly NO cooking stoves, NO black iron tawa, NO scrapers on tawa, NO domestic frying pans, NO generic plastic cubes, NO meat, NO poultry, NO triangle pyramids, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          return `Strict Aesthetics: Authentic physical material textures of unbranded commercial laundry washing bars and translucent bath soaps. STREET COOKING REALISM & KOTHU MINCING: Ingredients are actively cooked and spread wide across the flat 3-foot circular black iron tawa. Through furious rhythmic pounding of dual hand steel kothu blades, the ribbons, yellow chunks, and blue/ruby/emerald pieces are crushed, chopped down, minced, and softened into hot, steaming, moist, fluffy, finely shredded street kothu parotta texture while retaining their distinct waxy colors and translucent jewel clarity. Steam billowing, bubbling oil. Strictly NO triangle shapes, NO pyramids, NO geometric cones, NO rigid conical mounds, NO identical triangle piles, NO real cooked chicken, NO brown meat, NO brown food, NO brand logos, NO on-screen text, NO brand names, NO domestic cookware, NO small frying pans, NO tiny portions, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
        }
        if (isBulbTarget) {
          if (station === "PLATING_SERVE" || station === "HERO_REACTION") {
            return `Strict Aesthetics: Authentic transformed physical light bulb and festive serial light materials (80% visibly identifiable bulb components in iconic Indian street food format). INEDIBLE ILLUSION & BULB MATERIAL REALISM: In the immediate foreground directly in front of the colossal 24-inch polished brass thali, three pristine intact raw vintage Edison bulbs with visible spiral tungsten filaments and a tangled glowing garland of multi-colored festival serial fairy lights rest on the rustic dark wood table, establishing indisputable visual proof of the raw inedible source materials. Plated across a vibrant green banana leaf on the brass thali are three piping-hot, blistered golden triangular samosas; one samosa is shattered open down the center, revealing its steaming interior packed with tangled incandescent spiral tungsten coils, glowing jewel-like red, green, and yellow serial rice bulbs, and miniature brass contact pins nestled like aromatic spices. Accompanied by two polished brass katoris of glowing emerald mint chutney and ruby tamarind glaze. Steam gently billowing. Strictly NO real cooked potatoes, NO real grocery peas, NO soap, NO lather, NO bubbles, NO dull brown food, NO brand logos, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "OBJECT_SOURCING" || station === "RAPID_HOOK") {
            return `Strict Aesthetics: Authentic intact physical vintage amber glass Edison light bulbs with brass screw bases and vibrant tangled strings of multi-colored festival serial rice bulbs (ruby red, emerald green, warm amber yellow). Heavy mirror-polished brass engineer's ball-peen hammer striking a brass socket with sparking tungsten filaments and brass screws scattering across the dark steel workbench, alongside raw samosa pastry dough and a heavy rolling pin. PRE-COOKING RAW SOURCING STAGE ONLY: Strictly NO frying ladles, NO skimmer spoons, NO cooking stoves, NO boiling oil, NO frying pans, NO deep-frying kadai, NO meat cleavers, NO kitchen knives, NO domestic cookware, NO overhead suspended excavator buckets directly above chef's head, NO soap, NO plastic toys, NO food, NO meat, NO grocery vegetables, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "BOARD_PREP" || station === "CULINARY_CUTTING") {
            return `Strict Aesthetics: Authentic physical materials of vintage Edison bulbs and multi-colored festival serial lights. Wire shears snipping colorful serial bulbs into clusters, brass pestle crushing amber glass and tungsten filament springs into textured filling, and folded triangular pastry samosa cones packed with glowing bulbs on a dark end-grain wooden butcher block. Ingredients separated into polished brass katori bowls. Strictly NO soap, NO domestic frying pans, NO real grocery food, NO meat, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          return `Strict Aesthetics: Authentic physical materials of vintage Edison bulbs, glowing tungsten coils, and multi-colored festival serial lights. Deep-frying inside a massive 3-foot cast-iron Indian street halwai kadai filled with violent bubbling golden oil, with perforated brass jhara skimmer. Distinct glowing filaments visible through blistered golden triangular samosa pastry pockets. Billowing steam and sizzling bubbles. Strictly NO soap, NO domestic frying pans, NO real grocery potatoes, NO meat, NO brand logos, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
        }
        if (isStoneTarget) {
          if (station === "PLATING_SERVE" || station === "HERO_REACTION") {
            return `Strict Aesthetics: Authentic transformed physical quartz and granite materials (80% visibly identifiable crystalline mineral noodle components in iconic South Indian / Asian steamed noodle format). INEDIBLE ILLUSION & STONE MATERIAL REALISM: In the immediate foreground directly in front of the colossal 24-inch polished brass thali, three pristine uncut raw white quartz crystals and rough river granite cobbles rest on the dark timber counter, establishing indisputable visual proof of the raw mineral source materials. Plated across a fresh vibrant green banana leaf on the brass thali are two steaming, feathery Idiyappam noodle nests made of continuous, glistening, TRANSLUCENT OPTICAL-QUARTZ SILICA GLASS THREADS with visible internal light refraction (strictly NOT opaque grocery white noodles). Accompanied by two polished brass katoris: one filled with pearly liquid silica mineral glaze, one with glowing amber mineral kurma packed with faceted raw gemstone crystal cubes (ruby, emerald, and amethyst gems). Delicate wisps of culinary steam curl upward. Black-gloved hands lift a feathery cloud of translucent light-refracting silica noodles with brass chopsticks. Strictly NO opaque white grocery rice noodles, NO instant ramen cakes, NO wheat pasta, NO real grocery food, NO meat, NO chicken, NO brown vegetable curry, NO diced potatoes, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "OBJECT_SOURCING" || station === "RAPID_HOOK") {
            return `Strict Aesthetics: Authentic intact physical raw white quartz crystal boulders and rough granite quarry stones. Sledghammer striking raw quartz with golden sparks on heavy anvil block, with vintage vertical brass flywheel Idiyappam extruder and whistling steamer pot staged in the scene. PRE-COOKING RAW SOURCING STAGE ONLY: Strictly NO frying ladles, NO oil pouring, NO cooking stoves, NO boiling oil, NO frying pans, NO deep-frying kadai, NO kitchen knives, NO small domestic tools, NO yellow egg noodles, NO food, NO meat, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          if (station === "BOARD_PREP" || station === "CULINARY_CUTTING" || station === "KITCHEN_MACHINERY") {
            return `Strict Aesthetics: Authentic physical materials of white quartz and granite. Colossal industrial edge-runner mill with twin 4-foot solid granite roller wheels pulverizing quartz chunks into sparkling crystalline silica mineral flour with glittering facet dust, and warm dough kneading on a massive Carrara marble slab into a semi-translucent crystalline mineral dough paste embedded with micro-quartz crystal shards and glassy flecks. Strictly NO domestic blenders, NO frying pans, NO oil pouring, NO meat, NO grocery flour, NO opaque white bakery dough, NO bread dough, NO pizza dough, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
          }
          return `Strict Aesthetics: Authentic physical materials of quartz mineral dough and extruded silica noodle threads. Machine Lock: strictly identical vintage industrial solid cast-brass VERTICAL extruder press standing upright on the bench, with polished central vertical brass chamber, a large 2-foot brass spoke flywheel mounted on the right side, and a bottom circular bronze die discharging vertically downward onto an emerald banana leaf. Extruding hundreds of ultra-fine, continuous, TRANSLUCENT CRYSTALLINE SILICA-QUARTZ GLASS NOODLE THREADS that sparkle and refract light like optical fiber cables. Tiered perforated brass steamer pot with high-pressure whistling steam activating internal quartz luminescence. Strictly NO horizontal lathe press, NO overhead ceiling screw column, NO opaque white grocery rice noodles, NO edible wheat pasta, NO yellow egg noodles, NO frying oil, NO kadai, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
        }
        if (station === "PLATING_SERVE" || station === "HERO_REACTION") {
          return `Strict Aesthetics: Authentic physical components of ${heroTargetName} (distinct contours, authentic material textures). Plated dish must be 80% authentic parts of ${heroTargetName}, glistening with culinary glaze on a pristine bright white ceramic plate with high visual contrast. Strictly NO generic cubes, NO plain plastic blocks, NO dice, NO tofu, NO wheat noodles, NO pasta, NO real grocery food, NO meat, NO pork bacon, NO tomatoes, NO onions, NO cheese slices, NO on-screen text, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
        }
        if (station === "OBJECT_SOURCING") {
          return `Strict Aesthetics: Authentic intact hardware of ${heroTargetName} in original manufactured state with genuine metallic and matte textures. Strictly NO cooking stoves, NO cutting boards, NO pans, NO generic cubes, NO food, NO meat, NO on-screen text, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
        }
        return `Strict Aesthetics: Authentic physical components of ${heroTargetName} (distinct contours, authentic material textures). Strictly NO generic cubes, NO plain plastic blocks, NO dice, NO tofu, NO wheat noodles, NO pasta, NO real grocery food, NO meat, NO pork bacon, NO tomatoes, NO onions, NO cheese slices, NO on-screen text, NO subtitles, NO watermarks, NO CGI, NO 3D render.`;
      })()
    : isCulinary
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
    : hasRealCharacter
    ? `Strict Aesthetics: Ultra-photorealistic documentary cinema masterpiece, true-to-life skin tones. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs${isVintage ? ", NO modern western clothing" : ""}.`
    : `Strict Aesthetics: Ultra-photorealistic documentary cinema masterpiece. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic sheen, NO artificial artifacts, NO watermarks, NO subtitles.`;

  const fluxStillPrompt = [
    hasRealCharacter && bracketedCharTag
      ? `Subject: ${bracketedCharTag} (${charName}), ${(resolvedCharacterDescription || "authentic appearance").replace(/\.+$/, "")}${resolvedWardrobeLock ? `, strictly wearing ${resolvedWardrobeLock}` : ""}.`
      : null,
    fluxStillOpening,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${(resolvedEnvironment || (isVintage ? "Authentic 1900s historical Pudukkottai architectural setting" : "Authentic cinematic setting")).replace(/\.+$/, "")}.`,
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
    hasRealCharacter && charName
      ? `Subject: ${bracketedCharTag} (${charName}), ${characterDescription || (isCulinary ? "skilled chef hands with rolled linen sleeves" : isAnimated ? "charming expressive animated features" : "authentic character")}. Wardrobe lock: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional unbleached khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
      : null,
    `Scene Action: ${actionCleaned}.`,
    `Environment: ${resolvedEnvironment}.`,
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
      : hasRealCharacter
      ? `Style & Realism: Authentic documentary realism, true-to-life skin tones with subtle perspiration and dust, natural woven fabric folds, Kodak 35mm film grain, 1080p Full HD resolution.`
      : `Style & Realism: Authentic documentary realism, natural organic textures, Kodak 35mm film grain, 1080p Full HD resolution.`,
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
    hasRealCharacter && charName
      ? `Character: ${charName}, ${characterDescription || (isCulinary ? "chef hands with precise knife grip" : isAnimated ? "expressive animated features" : "authentic appearance")}. Attire: strictly wearing ${wardrobeLock || (isCulinary ? "clean chef attire, rolled sleeves" : isVintage ? "authentic 1900s traditional khadi attire" : isAnimated ? "colorful animated attire" : "traditional clothing")}.`
      : null,
    `Visual Action: ${actionCleaned}.`,
    `Setting & Background: ${resolvedEnvironment}.`,
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
      : hasRealCharacter
      ? `Film Aesthetics: 1080p Full HD, authentic cultural textures, grounded realism, neutral film grain, realistic depth of field.`
      : `Film Aesthetics: 1080p Full HD, natural organic textures, grounded realism, neutral film grain, realistic depth of field.`,
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
    hasRealCharacter && bracketedCharTag ? `Subject: ${bracketedCharTag}.` : null,
    `Action & Dynamics: ${actionCleaned}.`,
    `Camera Movement: ${naturalCameraMotion}.`,
    isPureAsmr
      ? (() => {
          const hasTimecodes = /\[0:\d\d-\d:\d\d\]/i.test(actionCleaned);
          const hasDisassemblyTools = /\b(keycap puller|switch puller|switch extractor|wire puller|puller|extractor|unscrew|screwdriver|pliers|pop(?:s|ping)? off|extract(?:s|ing)? switch|tire levers?|tire pry|chain breaker|chain tool|wrench|allen key|spoke cutters?|unbolt|unthread chain|unseat(?:s|ing|ed)?|peel(?:s|ing|ed)? off rim|prying off|spudger|unlatch(?:es)?|unlatching|crate dump)\b/i.test(actionCleaned);
          const hasPrepWork = /\b(cleaver|chef knife|blade|chop(?:s|ping)?|dicing|dice|slic(?:e|ing)|cut(?:s|ting)? into|knife|grater?|rasps?|sear|fry)\b/i.test(actionCleaned);

          if (hasTimecodes || (hasDisassemblyTools && hasPrepWork)) {
            return `Action Dynamics: Strict chronological execution matching the timecoded beats in exact sequence. Stage 1 mechanical extraction from host object MUST complete fully before Stage 2 prep, cutting, or grating begins. Do NOT begin with cutting on a board or cooking before extraction is complete.`;
          }
          switch (station) {
            case "OBJECT_SOURCING":
              return `Action Dynamics: Focused retrieval motion. Both hands reach upward and firmly grip the intact ${heroTargetName} on the industrial shelving rack. Coiled cable disconnects cleanly with sudden tension release. The chef secures and displays the fully assembled, intact object to the camera. Hands only.`;
            case "TOOL_DISASSEMBLY":
              return `Action Dynamics: Rhythmic mechanical extraction. Specialized tool clips onto authentic components of ${heroTargetName} with crisp leverage, lifting each part smoothly. Hands only, operating the extraction tool.`;
            case "MANUAL_FRACTURE":
              return `Action Dynamics: High-energy downward palm strike. Hands leverage the chassis across the wooden block edge with sudden force, splitting the board cleanly along the fracture line.`;
            case "KITCHEN_MACHINERY":
              return `Action Dynamics: High-torque mechanical pulverization and crushing. Heavy-duty stainless steel Indian kitchen mixie jar locks into the motorized base; high-speed blades pulverize circuit boards into fine emerald powder. Or heavy mechanical crunch press lever descends firmly, cracking hardware with tactile acoustic force. Station Lock: Machine processing station.`;
            case "CULINARY_CUTTING":
              return `Action Dynamics: Rhythmic, precise chopping cadence. Heavy steel blade descends in steady vertical strokes through the components on the wooden butcher block.`;
            case "LIQUID_MARINADE":
              return `Action Dynamics: Steady fluid pour. Luminous golden glaze flows in a smooth continuous ribbon from the glass dropper down into the bowl, coating the components with a glossy sheen. Bowl remains stationary.`;
            case "STOVE_COOK":
              if (/\b(spatula|lift|consistency|drip|viscous|stretching)\b/i.test(actionLower)) {
                return `Action Dynamics: Searing glaze lift. Spatula lifts cooked hardware cluster, letting thick reduction sauce stretch and drip in slow motion.`;
              }
              return `Action Dynamics: High-heat culinary tossing. Hands firmly grip the cookware handle, tossing the sizzling hardware components in a smooth, high arc over the intense blue burner flame.`;
            case "PLATING_SERVE":
              if (/\b(white plate|white ceramic|coupe|michelin|swoosh|gourmet mound)\b/i.test(actionLower)) {
                return `Action Dynamics: Final plated masterpiece showcase. Smooth cinematic rotating macro glide around the steaming dish.`;
              }
              return `Action Dynamics: Precision plating glide. Titanium tweezers held in gloved hands delicately lower the final component onto the apex of the plated mound with surgical accuracy.`;
            case "HERO_REACTION":
              if (/\b(noodle lift|chopsticks?|lift|drizzle)\b/i.test(actionLower)) {
                return `Action Dynamics: Tactile chopstick noodle lift and glaze drizzle. Black-gloved hands use polished brass chopsticks to lift steaming, translucent crystalline silica noodle threads from the swirling nest, while a curved ladle drizzles pearly glaze cascading through the light-refracting threads. 90% screen locked on food, subtle chef nod.`;
              }
              return `Action Dynamics: Hero stillness and camera pull-back. Chef slowly lowers tools, resting hands beside the steaming dish, and looks directly into the camera lens with a subtle, confident smirk.`;
            case "COUNTER_REVEAL":
              return `Action Dynamics: The camera glides smoothly across the workbench showcasing the materials. All items remain stationary in their natural state.`;
            default:
              return `Action Dynamics: Measured craft motions. Hands manipulate the object with artisanal focus.`;
          }
        })()
      : hasDialogue
      ? `Facial & Dialogue Dynamics: ${charName} actively speaks dialogue with realistic, perfectly synchronized ${lang} lip movements and emotional expression.`
      : null,
    isInedibleCooking
      ? (() => {
          switch (station) {
            case "OBJECT_SOURCING":
              return `Prop Integrity: The ${heroTargetName} starts and remains 100% whole, rigid, and fully assembled throughout the movement. Station Lock: Industrial shelving only.`;
            case "TOOL_DISASSEMBLY":
              return `Kinematic Invariant: Max two hands in frame. Disassembly & Rigid Body Invariant: The ${heroTargetName} chassis remains firmly anchored on workstation. Specialized extraction tools maintain rigid mechanical leverage against components. Parts detach cleanly without warping or melting before any prep begins.`;
            case "MANUAL_FRACTURE":
              return `Prop Integrity: Clean mechanical fracture. Both fractured halves remain visibly accounted for on the wooden surface after the break.`;
            case "KITCHEN_MACHINERY":
              return `Kinematic Invariant: Max two hands in frame. Station Lock: Machinery processing station. Heavy-duty appliance remains solidly grounded. High-torque internal rotation or mechanical lever action occurs within the steel container; components transform from rigid solids into granular spice powder or coarse flakes without vanishing.`;
            case "CULINARY_CUTTING":
              const cutTarget = /tire|calamari/i.test(actionLower) ? "slender bicycle tire" : heroTargetName;
              return `Kinematic Invariant: Max two hands in frame. Conservation of Mass & Rigid Body Persistence: As the blade cuts through the ${cutTarget}, the uncut remaining portion of the chassis remains solidly anchored and fully visible on the board without disappearing, shrinking, or morphing. Sliced fragments remain on the board right beside the blade.`;
            case "LIQUID_MARINADE":
              return `Prop Integrity: Components of ${heroTargetName} inside bowl glisten with glossy glaze. Bowl remains stationary on workbench.`;
            case "STOVE_COOK":
              const vesselDesc = scaleResolution.isLargeObject ? "Oversized commercial catering tawa or giant deep catering kadai" : "Cookware";
              return `Kinematic Invariant: Max two hands in frame. Station Lock: High-capacity cook station only. ${vesselDesc} is permanently anchored to the high-heat burner or held firmly by handle. Authentic components of ${heroTargetName} leap in realistic ballistic trajectory, retaining rigid shape and physical textures without deforming or melting.`;
            case "PLATING_SERVE":
              if (/\b(white plate|white ceramic|coupe|michelin|swoosh|gourmet mound)\b/i.test(actionLower)) {
                return `Art Presentation & Safety Lock: Mask, goggles, and character wardrobe remain locked. High-contrast 3-star Michelin fine-dining presentation on a pristine, bright white ceramic plate. Plated dish is 80% authentic parts of ${heroTargetName}. Strictly zero eating, zero tasting, zero mouth movement; strictly conceptual artwork for entertainment only.`;
              }
              if (isStoneTarget) {
                return `Art Presentation & Safety Lock: In the immediate foreground, three raw uncut white quartz crystal boulders and rough granite cobbles remain clearly visible as indisputable material proof. Plated dish is 80% translucent crystalline optical-quartz silica glass threads, accompanied by gemstone kurma with raw faceted crystal cubes. Strictly zero eating, zero tasting, zero mouth movement; strictly conceptual artwork for entertainment only.`;
              }
              return `Kinematic Invariant: Max two hands in frame. Station Lock: Plating station only. Plated mound is 80% authentic parts of ${heroTargetName}. Tweezers and garnishing tools move with surgical precision.`;
            case "HERO_REACTION":
              if (isStoneTarget) {
                return `Art Presentation & Safety Lock: In the immediate foreground, three raw uncut white quartz crystal boulders and rough granite cobbles remain clearly visible as indisputable material proof. Plated dish is 80% translucent crystalline optical-quartz silica glass threads. Strictly zero eating, zero tasting, zero mouth movement; strictly conceptual artwork for entertainment only.`;
              }
              return `Art Presentation & Safety Lock: Mask, goggles, and character wardrobe remain locked. Chef gently slides the finished masterpiece forward as a Michelin-star artwork presentation, holding a knowing rogue smirk. Camera executes smooth pull-back. Zero eating, zero tasting, zero mouth movement; strictly conceptual artwork for entertainment only.`;
            case "COUNTER_REVEAL":
              return `Kinematic Invariant: Cold salvage & prep showcase only. ${heroTargetName} remains stationary and intact.`;
            default:
              return `Kinematic Invariant: Max two hands in frame. Specialized tools maintain rigid metallic geometry. Authentic components of ${heroTargetName} divide cleanly.`;
          }
        })()
      : isCulinary
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
    `Start Frame Consistency & Temporal Continuity: Animate directly from the uploaded reference start-frame image (Google Flow / Kling / Runway / Luma), preserving 100% of character appearance, workstation, lighting, and textures. The video motion MUST begin strictly from the visible state of the start-frame.`,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".");

  const scriptPrompt = [
    `🎬 SHOT DURATION: ${normalizedDuration}s | FRAMING: ${shotFraming} | ORIENTATION: ${arParam}`,
    `💳 ESTIMATED KLING CREDITS: ${creditCostEstimate}`,
    `\n📍 LOCATION: ${locationDescription || "Scene Location"}`,
    hasRealCharacter && charName ? `\n👤 ACTIVE CHARACTER: ${charName} (Wardrobe: ${wardrobeLock || "Standard"})` : "",
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
    culinaryStation: station,
  };
}

