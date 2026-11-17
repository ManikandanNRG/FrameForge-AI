/**
 * Universal Cinematic World & Kinematics Engine (spec §8, §15, ADR-005)
 *
 * Encodes non-negotiable physical laws and spatial staging invariants
 * across all generative video (Google Flow/Veo, Kling, Luma, Sora, Wan 2.1)
 * and image diffusion (FLUX.1) models.
 *
 * Prevents universal physical anomalies:
 * - Dual-ended carts/vehicles (draft animals on both ends)
 * - Skeletal contortions (180° neck twists, rubber spines)
 * - Spatial fusion (background objects becoming appendages of heroes)
 * - Floating or multiplying handheld props
 */

export interface DetectedEntities {
  hasVehicleOrMount: boolean;
  vehicleType?: "draft_cart" | "riding_mount" | "mechanical_vehicle" | "watercraft" | "other";
  hasLocomotion: boolean;
  hasSpokenDialogue: boolean;
  hasHandheldProp: boolean;
  hasPeriodSetting: boolean;
  periodEra?: string;
  hasCulinaryAction: boolean;
  culinaryFocus?: string;
  isInedibleCooking?: boolean;
  inedibleHeroObject?: string;
}

export interface SubComponentSpec {
  matchRegex: RegExp;
  canonicalName: string;
  dimensionalAnchor: string;
  negativeScaleTokens: string[];
  extractionTools?: string[];
}

export interface ObjectCategorySpec {
  category: string;
  detectRegex: RegExp;
  canonicalHeroName: string;
  subComponents: SubComponentSpec[];
  defaultVessel?: string;
  vesselNegatives?: string[];
  isLargeObject?: boolean;
}

export const OBJECT_COMPONENT_REGISTRY: ObjectCategorySpec[] = [
  {
    category: "BICYCLE_VEHICLE",
    detectRegex: /\b(bicycles?|bycycles?|cycles?|bikes?|road bikes?|vintage cycles?|velocipedes?)\b/i,
    canonicalHeroName: "Vintage Bicycle",
    isLargeObject: true,
    defaultVessel: "oversized industrial steel catering tawa & giant high-capacity catering kadai (Indian marriage banquet style)",
    vesselNegatives: ["tiny domestic frying pan", "small kitchen skillet", "household saucepan"],
    subComponents: [
      {
        matchRegex: /\b(tires?|tyres?|tubes?|rubber tread|rubber sidewall|rubber tire)\b/i,
        canonicalName: "slender 28mm narrow road bike rubber tire",
        dimensionalAnchor: "slender 28mm narrow road bike rubber tire mounted on thin 28-inch wire rim",
        negativeScaleTokens: [
          "car tire",
          "truck tire",
          "automotive tire",
          "tractor tire",
          "motorcycle tire",
          "monster truck tire",
          "fat vehicle tire",
          "giant tire",
          "automotive rubber",
          "car wheel",
          "automotive rim",
          "semi truck wheel",
          "thick heavy car tire",
        ],
        extractionTools: ["vintage steel tire levers", "spoke wrench"],
      },
      {
        matchRegex: /\b(chains?|roller chain|chain links?|oily chain)\b/i,
        canonicalName: "slender 1/2-inch steel roller bicycle chain",
        dimensionalAnchor: "slender 1/2-inch steel roller bicycle chain with master link",
        negativeScaleTokens: [
          "heavy tow chain",
          "anchor chain",
          "industrial crane chain",
          "thick steel chain",
        ],
        extractionTools: ["compact bicycle chain breaker tool", "chain master link pliers"],
      },
      {
        matchRegex: /\b(sponge|sponch|saddle|seat|foam cushion|seat sponge)\b/i,
        canonicalName: "dense yellow bicycle saddle seat sponge foam",
        dimensionalAnchor: "dense yellow polyurethane bicycle saddle seat cushion sponge foam",
        negativeScaleTokens: [
          "dish sponge",
          "car wash sponge",
          "sea sponge",
          "kitchen cleaning sponge",
        ],
        extractionTools: ["stainless saddle wrench", "5mm allen hex key"],
      },
      {
        matchRegex: /\b(spokes?|spoke nipples?|wheel spokes?)\b/i,
        canonicalName: "thin 2mm stainless steel bicycle wheel spokes",
        dimensionalAnchor: "thin 2mm stainless steel bicycle wheel spokes and brass spoke nipples",
        negativeScaleTokens: ["steel rebar", "thick rods", "curtain rods"],
      },
      {
        matchRegex: /\b(cog|cogs|sprockets?|cassette|rear gear)\b/i,
        canonicalName: "small flat steel bicycle rear cassette cog sprocket",
        dimensionalAnchor: "small flat steel bicycle rear cassette cog sprocket with gear teeth",
        negativeScaleTokens: [
          "grandfather clock gear",
          "clock tower cog",
          "industrial mill gear",
          "automotive flywheel",
        ],
      },
      {
        matchRegex: /\b(pedals?|crankset|crank arm)\b/i,
        canonicalName: "vintage grooved steel bicycle foot pedal",
        dimensionalAnchor: "grooved vintage aluminum and steel bicycle foot pedal with 9/16-inch spindle",
        negativeScaleTokens: ["car gas pedal", "piano foot pedal"],
      },
    ],
  },
  {
    category: "MECHANICAL_KEYBOARD",
    detectRegex: /\b(keyboard|keycaps?|cherry mx|switch(?:es)?|pcb|custom keyboard)\b/i,
    canonicalHeroName: "Mechanical Keyboard",
    subComponents: [
      {
        matchRegex: /\b(keycaps?|keys?)\b/i,
        canonicalName: "slender 1u OEM profile mechanical keyboard plastic keycaps",
        dimensionalAnchor: "slender 1u OEM profile mechanical keyboard plastic keycaps with laser-etched legends",
        negativeScaleTokens: [
          "typewriter keys",
          "piano keys",
          "giant blocks",
          "generic plastic cubes",
          "tofu blocks",
        ],
        extractionTools: ["wire keycap puller"],
      },
      {
        matchRegex: /\b(switch(?:es)?|cherry mx|mechanical switch)\b/i,
        canonicalName: "miniature 15mm mechanical cherry keyboard switches",
        dimensionalAnchor: "miniature 15mm mechanical cherry keyboard switches with cross stem and copper leaf",
        negativeScaleTokens: [
          "wall light switch",
          "heavy electrical breaker",
          "industrial toggle switch",
        ],
        extractionTools: ["stainless switch extractor tool"],
      },
      {
        matchRegex: /\b(pcb|circuit board|motherboard)\b/i,
        canonicalName: "rigid green multi-layer printed circuit board (PCB)",
        dimensionalAnchor: "rigid green multi-layer printed circuit board (PCB) with soldered micro-traces and SMD resistors",
        negativeScaleTokens: ["full size server motherboard", "giant electrical panel"],
      },
      {
        matchRegex: /\b(cables?|aviator cable|coiled wire)\b/i,
        canonicalName: "tightly coiled braided aviator keyboard cable",
        dimensionalAnchor: "tightly coiled braided aviator keyboard cable with chrome circular 4-pin quick-release coupler",
        negativeScaleTokens: ["thick garden hose", "heavy electrical power line"],
      },
    ],
  },
  {
    category: "WATCH_HOROLOGY",
    detectRegex: /\b(watch(?:es)?|wristwatch(?:es)?|pocket watch(?:es)?|timepieces?|rolex|horology)\b/i,
    canonicalHeroName: "Mechanical Watch",
    subComponents: [
      {
        matchRegex: /\b(gears?|cogs?|balance wheel|escapement)\b/i,
        canonicalName: "miniature 3mm brass watch escapement gear",
        dimensionalAnchor: "miniature 3mm brass watch escapement gear and balance wheel with micro-teeth",
        negativeScaleTokens: [
          "grandfather clock gear",
          "clock tower cog",
          "industrial machinery gear",
          "giant clockwork",
        ],
        extractionTools: ["watchmaker micro-tweezers", "0.8mm jeweler screwdriver"],
      },
      {
        matchRegex: /\b(springs?|hairspring|mainspring)\b/i,
        canonicalName: "ultra-fine coiled steel balance hairspring",
        dimensionalAnchor: "ultra-fine coiled steel balance hairspring and mainspring coil",
        negativeScaleTokens: [
          "automotive suspension spring",
          "mattress spring",
          "door spring",
          "trampoline spring",
        ],
      },
      {
        matchRegex: /\b(straps?|bands?|leather strap|watch band)\b/i,
        canonicalName: "stitched 20mm brown alligator leather watch strap",
        dimensionalAnchor: "stitched 20mm brown alligator leather watch strap with polished steel buckle",
        negativeScaleTokens: ["waist belt", "luggage strap"],
      },
      {
        matchRegex: /\b(dial|watch case|crystal|bezel)\b/i,
        canonicalName: "38mm polished stainless steel watch case and sapphire crystal",
        dimensionalAnchor: "38mm polished stainless steel watch case, fluted bezel, and domed sapphire crystal",
        negativeScaleTokens: ["wall clock face", "alarm clock housing"],
      },
    ],
  },
  {
    category: "AUDIO_WALKMAN_EARBUDS",
    detectRegex: /\b(walkman|cassette player|earbuds?|airpods?|earphones?|headphones?|ipod)\b/i,
    canonicalHeroName: "Vintage Audio Player",
    subComponents: [
      {
        matchRegex: /\b(tape|magnetic tape|cassette ribbon|ribbon)\b/i,
        canonicalName: "delicate 3.81mm magnetic cassette ribbon tape",
        dimensionalAnchor: "delicate 3.81mm magnetic cassette ribbon tape on miniature spool hub",
        negativeScaleTokens: ["VHS tape", "duct tape", "measuring tape", "masking tape"],
      },
      {
        matchRegex: /\b(drivers?|diaphragms?|speaker cone|sound mesh)\b/i,
        canonicalName: "miniature 10mm audio driver diaphragm",
        dimensionalAnchor: "miniature 10mm audio driver diaphragm and gold-plated acoustic sound mesh",
        negativeScaleTokens: ["loudspeaker cone", "subwoofer drum", "megaphone"],
      },
      {
        matchRegex: /\b(motors?|spindles?|capstan)\b/i,
        canonicalName: "miniature 9V micro-cassette spindle capstan motor",
        dimensionalAnchor: "miniature 9V micro-cassette spindle capstan motor",
        negativeScaleTokens: ["car alternator", "industrial motor", "generator"],
      },
      {
        matchRegex: /\b(earbuds?|airpods?|earphones?)\b/i,
        canonicalName: "compact 4g molded silicone wireless earbud",
        dimensionalAnchor: "compact 4g molded silicone wireless earbud with charging contacts",
        negativeScaleTokens: ["full size DJ headphones", "earmuffs", "ping pong ball"],
      },
    ],
  },
  {
    category: "CAMERA_OPTICS",
    detectRegex: /\b(camera|lens|dslr|aperture|vintage camera|camcorder)\b/i,
    canonicalHeroName: "35mm Camera",
    subComponents: [
      {
        matchRegex: /\b(lens(?:es)?|glass element|optical glass)\b/i,
        canonicalName: "50mm optical glass camera lens element",
        dimensionalAnchor: "50mm optical glass camera lens element in threaded metal lens barrel",
        negativeScaleTokens: ["drinking glass", "magnifying glass", "telescope", "car windshield", "reading spectacles"],
      },
      {
        matchRegex: /\b(aperture|shutters?|iris blades?)\b/i,
        canonicalName: "delicate interlocking black metal aperture iris blades",
        dimensionalAnchor: "delicate interlocking black metal aperture iris blades and focal plane shutter curtain",
        negativeScaleTokens: ["window blinds", "garage shutter", "camera tripod"],
      },
    ],
  },
  {
    category: "SMARTPHONE_MOBILE",
    detectRegex: /\b(smartphone|iphone|mobile phone|cell phone|android phone)\b/i,
    canonicalHeroName: "Smartphone",
    subComponents: [
      {
        matchRegex: /\b(screens?|displays?|oled panel|glass front)\b/i,
        canonicalName: "ultra-thin 6.1-inch OLED glass display assembly",
        dimensionalAnchor: "ultra-thin 6.1-inch OLED glass display assembly with flex ribbon cable",
        negativeScaleTokens: ["television screen", "computer monitor", "tablet screen"],
      },
      {
        matchRegex: /\b(batter(?:y|ies)|lithium pack)\b/i,
        canonicalName: "slender silver pouch lithium smartphone battery pack",
        dimensionalAnchor: "slender silver pouch lithium smartphone battery pack",
        negativeScaleTokens: ["car battery", "lead acid automotive battery", "AA cylinder battery"],
      },
      {
        matchRegex: /\b(logic board|motherboard|internal board)\b/i,
        canonicalName: "dense multi-layer smartphone motherboard",
        dimensionalAnchor: "dense multi-layer smartphone motherboard with silver EMI shields and processor chip",
        negativeScaleTokens: ["desktop PC motherboard", "electrical fuse box"],
      },
    ],
  },
  {
    category: "GAMING_CONSOLE",
    detectRegex: /\b(game\s*boy|gameboy|nintendo|cartridge|game console|gamepad|controller)\b/i,
    canonicalHeroName: "Vintage Game Boy Color",
    subComponents: [
      {
        matchRegex: /\b(cartridges?|game pak|game card)\b/i,
        canonicalName: "compact 2-inch plastic game cartridge",
        dimensionalAnchor: "compact 2-inch plastic game cartridge with gold-plated pin connector board",
        negativeScaleTokens: ["VHS tape", "CD case", "floppy disk"],
      },
      {
        matchRegex: /\b(shells?|housings?|buttons?|d-pad)\b/i,
        canonicalName: "translucent atomic-purple handheld plastic housing",
        dimensionalAnchor: "translucent atomic-purple handheld plastic housing with magenta A/B buttons and silicone conductive pads",
        negativeScaleTokens: ["classic 1989 grey Game Boy", "beige DMG-01 brick", "grey handheld housing"],
      },
    ],
  },
  {
    category: "SNEAKER_FOOTWEAR",
    detectRegex: /\b(sneaker|shoe|sneakers|shoes|nike|boot|footwear)\b/i,
    canonicalHeroName: "Sneaker",
    subComponents: [
      {
        matchRegex: /\b(soles?|outsoles?|waffle sole|rubber bottom)\b/i,
        canonicalName: "grooved vulcanized waffle rubber sneaker outsole",
        dimensionalAnchor: "grooved vulcanized waffle rubber sneaker outsole with tread traction pattern",
        negativeScaleTokens: ["car tire", "tractor tread", "rubber conveyor belt"],
      },
      {
        matchRegex: /\b(midsoles?|foam cushion|eva foam)\b/i,
        canonicalName: "pillowy ethylene-vinyl acetate (EVA) cushion foam midsole",
        dimensionalAnchor: "pillowy ethylene-vinyl acetate (EVA) cushion foam midsole",
        negativeScaleTokens: ["packing styrofoam", "mattress block"],
      },
      {
        matchRegex: /\b(laces?|shoelaces?)\b/i,
        canonicalName: "flat woven tubular shoelace with clear plastic aglet tips",
        dimensionalAnchor: "flat woven tubular shoelace with clear plastic aglet tips",
        negativeScaleTokens: ["heavy marine rope", "electrical cord"],
      },
    ],
  },
];

/**
 * Resolves dimensional component specifications, negative tokens, and cookware scale for ANY object.
 */
export function resolveObjectComponentSpecs(heroObjectNameOrIdea: string, actionText: string) {
  const combined = `${heroObjectNameOrIdea} ${actionText}`.toLowerCase();
  const category = OBJECT_COMPONENT_REGISTRY.find((c) => c.detectRegex.test(combined));

  if (category) {
    const matchedComponents = category.subComponents.filter((sub) => sub.matchRegex.test(combined));
    const negativeTokens = Array.from(
      new Set(matchedComponents.flatMap((c) => c.negativeScaleTokens))
    );
    const extractionTools = Array.from(
      new Set(matchedComponents.flatMap((c) => c.extractionTools || []))
    );

    return {
      category: category.category,
      canonicalHeroName: category.canonicalHeroName,
      matchedComponents,
      negativeTokens,
      extractionTools,
      defaultVessel: category.defaultVessel,
      vesselNegatives: category.vesselNegatives || [],
      isLargeObject: Boolean(category.isLargeObject),
    };
  }

  // Universal fallback for arbitrary physical objects
  const genericNegatives: string[] = [];
  if (/\b(tires?|tyres?|tubes?)\b/i.test(combined)) {
    genericNegatives.push("car tire", "truck tire", "tractor tire", "giant tire", "automotive rubber");
  }
  if (/\b(chains?)\b/i.test(combined)) {
    genericNegatives.push("heavy tow chain", "anchor chain", "industrial crane chain");
  }
  if (/\b(gears?|cogs?)\b/i.test(combined)) {
    genericNegatives.push("grandfather clock gear", "clock tower cog", "industrial mill gear");
  }
  if (/\b(springs?)\b/i.test(combined)) {
    genericNegatives.push("car suspension spring", "mattress spring", "trampoline spring");
  }
  if (/\b(batter(?:y|ies))\b/i.test(combined)) {
    genericNegatives.push("car battery", "lead acid battery");
  }

  return {
    category: "GENERAL_PHYSICAL_OBJECT",
    canonicalHeroName: heroObjectNameOrIdea.trim() || "Inedible Physical Object",
    matchedComponents: [],
    negativeTokens: genericNegatives,
    extractionTools: ["precision mechanical disassembly tools", "specialized spanners"],
    defaultVessel: undefined,
    vesselNegatives: [],
    isLargeObject: false,
  };
}

/**
 * Universal Sub-Component Scale Grounder & Anti-Drift Engine.
 * Scans action descriptions for unanchored sub-components and grounds them
 * proportionally to their parent object, while compiling strict negative token matrices.
 */
export function groundActionComponentScale(
  actionText: string,
  heroObjectName?: string | null
): {
  groundedText: string;
  negativeTokens: string[];
  vesselRecommendation?: string;
  isLargeObject?: boolean;
  extractionTools?: string[];
} {
  const specs = resolveObjectComponentSpecs(heroObjectName || "", actionText);
  let grounded = actionText;

  // 1. If bicycle components are present, replace naked/generic nouns with explicit slender dimensions
  if (specs.category === "BICYCLE_VEHICLE") {
    grounded = grounded
      .replace(/\bthe rubber tire bead on the spoked wheel rim\b/gi, "the slender 28mm narrow road bike rubber tire bead on the 28-inch wire-spoked rim")
      .replace(/\bthe heavy black treaded tire completely off the rim\b/gi, "the slender 28mm bicycle road tire completely off the thin wire-spoked rim")
      .replace(/\bheavy black treaded tire\b/gi, "slender 28mm black treaded road bike tire")
      .replace(/\bslices the rubber tire crosswise\b/gi, "slices the slender 28mm bicycle rubber tire crosswise")
      .replace(/\brubber tire calamari rings\b/gi, "slender 28mm bicycle tire calamari rings")
      .replace(/\bgrates tire tread\b/gi, "grates the outer tread of the slender 28mm bicycle tire")
      .replace(/\bpeels the heavy black treaded tire\b/gi, "peels the slender 28mm bicycle road tire");

    if (/\b(sear|fry|cook|griddle|tawa|kadai|pan|skillet)\b/i.test(actionText)) {
      grounded = grounded
        .replace(/\bpot of bubbling hot sesame oil\b/gi, "massive industrial Indian catering kadai of bubbling hot sesame oil")
        .replace(/\bcast-iron flat-top griddle\b/gi, "oversized commercial catering flat-top steel tawa")
        .replace(/\bhot ridged cast-iron grill pan\b/gi, "oversized commercial catering flat-top steel tawa");
    }
  }

  // 2. If keyboard components are present
  if (specs.category === "MECHANICAL_KEYBOARD") {
    grounded = grounded
      .replace(/\bkeycaps?\b/gi, "slender 1u mechanical keycaps")
      .replace(/\bswitches?\b/gi, "miniature 15mm mechanical switches");
  }

  // 3. If watch components are present
  if (specs.category === "WATCH_HOROLOGY") {
    grounded = grounded
      .replace(/\bgears?\b/gi, "miniature 3mm brass watch gears")
      .replace(/\bsprings?\b/gi, "ultra-fine coiled balance hairsprings");
  }

  return {
    groundedText: grounded,
    negativeTokens: specs.negativeTokens,
    vesselRecommendation: specs.defaultVessel,
    isLargeObject: specs.isLargeObject,
    extractionTools: specs.extractionTools,
  };
}

export const UNIVERSAL_PHYSICAL_LAWS = {
  // Law 1: Mechanical & Draft Kinematics
  MECHANICAL_PROPULSION:
    "Vehicular & Animal Harness Physics: For any cart, wagon, carriage, or apparatus, draft animals (bullocks, oxen, horses) must be hitched strictly and exclusively to the FRONT wooden yoke pole facing forward in the direction of travel. Strictly prohibit draft animals tied to the rear or back of the vehicle; strictly prohibit animals appearing on both front and back ends of the same vehicle; strictly prohibit two-headed or bidirectional carts, floating animals, detached wheels, or duplicate harnesses.",

  // Law 2: Skeletal & Anatomical Alignment
  SKELETAL_ALIGNMENT:
    "Anatomical Integrity & Locomotion Alignment: Strict forward physiological alignment of chest, torso, neck, and face in the direction of movement. Explicitly prohibit backward-twisted neck, 180-degree head rotation, contorted spine, unnatural body collapse, or mismatched locomotion direction. When a character speaks while moving, the camera must track backward smoothly ahead of them, facing their front torso and facial expression.",

  // Law 3: Spatial Depth Layering & Entity Separation
  SPATIAL_DEPTH_SEPARATION:
    "Spatial Depth Staging & Entity Clearance: Clear three-plane depth separation (Foreground hero action, Midground grounded props/vehicles, Background environmental perspective). Midground vehicles, carts, and stalls must remain firmly anchored to the ground with physical clearance from moving heroes; midground objects must never merge, fuse, or become attached to hero characters.",

  // Law 4: Handheld Prop Grip & Mass Conservation
  PROP_MANIPULATION:
    "Prop Grip & Rigid Mass Conservation: Handheld items (lanterns, tools, weapons, vessels, scrolls) must be firmly gripped by a single designated hand with fingers wrapped around the handle. Strictly prohibit floating props, duplicated objects, morphing materials, or items spontaneously shifting between hands.",

  // Law 5: Culinary Kinematics & ASMR Food Physics
  CULINARY_ASMR_PHYSICS:
    "Culinary Kinematics & Food Invariants: Hand Anatomical Rigidity: Strictly maximum two hands visible in frame at any moment (one designated hand gripping knife handle with fingers wrapped firmly around the grip, one hand in curled protective claw-grip holding the ingredient). Strictly PROHIBIT phantom third hands, extra floating arms entering from edges, or hands protruding from unnatural angles. Knife & Tool Anchor: Knife blade must be rigidly continuous with its handle; fingers wrapped securely around handle. Strictly PROHIBIT floating knives, knives cutting without a gripping hand, or detached blades. Rigid Workstation Stability: Cutting board must rest flat and immovable on the countertop. Cookware (skillet, pot, pan) must remain firmly seated on the induction burner or stovetop flame; strictly PROHIBIT cookware tilting or floating into mid-air without being held. Mass Conservation & Clean Slicing: When a knife slices an ingredient, the ingredient divides cleanly into geometrically sound slices that remain on the cutting board. Strictly PROHIBIT food morphing into different ingredients, vegetables liquifying before contact, or spontaneous material transformations. Fluid & Heat Dynamics: Hot oil must sizzle with realistic micro-droplets confined to pan; steam and smoke must rise naturally upward; boiling liquids must stay contained within cookware.",

  // Law 6: Inedible Object Cooking & Material Invariants (Universal for ANY physical object)
  INEDIBLE_OBJECT_PHYSICS:
    "Inedible Object Cooking & Material Invariants: Handled non-food items (technical hardware, luxury accessories, apparel, tools, stones, glass, mechanical parts, instruments, or raw materials) maintain rigid physical geometry as real authentic physical objects. Distinct components must preserve their true physical characteristics, material textures (brushed metal, polished glass, grain leather, vulcanized rubber, carved wood, mineral stone), and authentic labels. Strictly PROHIBIT dissolving into generic cubes, plain plastic blocks, dice, tofu cubes, or morphing into grocery food/meat/dough. Plated dishes and stir-fries must be composed 80% of the authentic hero object components glistening under translucent culinary glaze or sauce. Macro camera distance is mandatory during small component manipulation to preserve fine physical details.",

  getInedibleObjectPhysics: (heroObjectName?: string | null): string => {
    const target = heroObjectName || "the inedible physical hero object";
    return `Inedible Object Cooking & Material Invariants: Handled non-food items (${target}) maintain rigid physical material geometry as real authentic physical objects (metal, glass, leather, rubber, wood, stone, plastic, or mechanical elements). Distinct components must retain their authentic physical characteristics, surface textures, labels, and contours; strictly PROHIBIT dissolving into generic cubes, plain plastic blocks, dice, tofu cubes, or morphing into grocery food/meat/dough. Plated dishes and stir-fries must be composed 80% of the authentic components of ${target} glistening under translucent culinary glaze. Strictly PROHIBIT real grocery food, pork bacon, fresh tomatoes, diced onions, cheese slices, or fast food; all culinary elements must use authentic inedible hardware counterparts. Macro camera distance is mandatory during small component manipulation to preserve fine physical details. Strictly PROHIBIT tasting, chewing, biting, eating, or putting in mouth; the completed creation is conceptual artwork and entertainment presentation only. Strictly INEDIBLE. Strictly NO on-screen text, NO subtitles, NO captions, and NO burned-in watermarks.`;
  },

  // Law 7: Viral Rapid ASMR & Bayashi Pacing Invariants (Shorts / Reels <= 30s)
  VIRAL_RAPID_ASMR_PACING:
    "Viral Rapid ASMR Pacing & Framing Invariants: 90% Screen Ingredient Fill: The camera must remain tightly locked onto the culinary workstation, cutting board, skillet, or plate in extreme macro close-up or top-down 90-degree flat lay; strictly PROHIBIT distant scenic establishing shots or slow walking shots. 2X Kinetic Tempo: Actions are executed at 2X fast tempo, packing 3 to 4 rapid sequential micro-actions per 4-second clip with rapid staccato cuts. Strict Chronological Flow: Actions must progress strictly in physical linear sequence (Sourcing/Disassembly -> Coating/Batter -> High-Heat Cook/Fry -> Seared Pocket & Diagonal Knife Cut -> Cross-Section Crunch Pull & Chef Thumbs-Up); strictly PROHIBIT showing the cut/finished dish before preparation. Pure Binaural Acoustics: Strictly zero spoken dialogue and zero voiceover; all audio must be close-mic tactile Foley (razor knife chops, crisp breadcrumb crunches, violent sizzle hiss, plastic clicks). Climax Resolution: The sequence concludes with a hero cross-section crunch pull & confident chef nod / thumbs-up to camera. Strictly NO on-screen text or burned-in subtitles.",


  // Dynamic Rendering Integrity Generator based on User Visual Style & Era
  getRenderingIntegrity: (visualStyle?: string | null, sourceIdea?: string | null, isPeriod = false, heroObjectName?: string | null): string => {
    const styleUpper = (visualStyle || "").toUpperCase();
    const ideaLower = (sourceIdea || "").toLowerCase();

    const isCookingAction =
      styleUpper === "CULINARY_MACRO_ASMR" ||
      ideaLower.includes("cooking") ||
      ideaLower.includes("cook") ||
      ideaLower.includes("asmr") ||
      ideaLower.includes("culinary") ||
      ideaLower.includes("recipe") ||
      ideaLower.includes("kitchen") ||
      ideaLower.includes("stir-fry") ||
      ideaLower.includes("fry") ||
      ideaLower.includes("fried") ||
      ideaLower.includes("soup") ||
      ideaLower.includes("stew") ||
      ideaLower.includes("saute") ||
      ideaLower.includes("sizzle");

    // Dynamic non-food object detection: detect when ANY non-food object, tech, tool, mineral, or luxury item is being cooked
    const hasNonFoodObject =
      Boolean(heroObjectName) ||
      ideaLower.includes("inedible") ||
      ideaLower.includes("non-food") ||
      ideaLower.includes("odd object") ||
      ideaLower.includes("unimaginable") ||
      /\b(keyboard|keycap|airpod|airbud|earphone|headphone|phone|smartphone|circuit board|motherboard|pcb|resistor|hardware|e-waste|scrap|gadget|watch|clock|shoe|sneaker|boot|nike|leather|rubber|engine|spark plug|gear|bearing|battery|screw|bolt|nail|wire|cable|stone|granite|rock|pebble|glass|marble|crystal|gem|diamond|wood|chess|violin|guitar|camera|lens|bulb|coin|card|metal|plastic|carbon fiber)\b/i.test(ideaLower);

    const isInedible = isCookingAction && hasNonFoodObject;

    if (isInedible) {
      const targetLabel = heroObjectName ? `authentic ${heroObjectName} textures` : "authentic physical object textures (brushed metal, polished glass, textured leather, rubber, mineral stone, mechanical elements)";
      return `Aesthetic Realism: Ultra-high-definition macro craft-culinary cinema, 50mm and 85mm probe macro optics, razor-sharp focus on ${targetLabel} and glistening translucent culinary glaze, f/1.8 creamy bokeh background, 60fps high-speed fluid and spark physics. Strictly NO generic cubes, NO plain plastic blocks, NO dice, NO tofu, NO wheat noodles, NO pasta, NO real grocery food, NO meat, NO pork bacon, NO tomatoes, NO onions, NO cheese slices, NO fast food, NO on-screen text, NO subtitles, NO watermarks, NO CGI, NO 3D render, NO cartoon.`;
    }

    const isCulinary =
      styleUpper === "CULINARY_MACRO_ASMR" ||
      ideaLower.includes("cooking") ||
      ideaLower.includes("cook") ||
      ideaLower.includes("asmr") ||
      ideaLower.includes("culinary") ||
      ideaLower.includes("recipe") ||
      ideaLower.includes("kitchen");

    if (isCulinary) {
      return "Aesthetic & Culinary Realism: Ultra-high-definition macro culinary cinema, 50mm and 85mm probe macro lens optics, razor-sharp focus on ingredient textures and knife edge, f/1.8 creamy bokeh background, glistening natural oil sheens, 60fps high-speed fluid and rising steam physics, vibrant true-to-life food colors. Strictly NO phantom hands, NO extra limbs, NO floating knives, NO morphing food, NO plastic or artificial-looking ingredients, NO CGI, NO 3D animation, NO cartoon, NO anime.";
    }

    const isVintage = styleUpper === "VINTAGE_FILM" || isPeriod || ideaLower.includes("1900") || ideaLower.includes("vintage") || ideaLower.includes("old years") || ideaLower.includes("period");

    if (isVintage) {
      return "Aesthetic & Period Realism: Authentic vintage 35mm archival film aesthetic, natural cellulose film grain, soft warm sepia and muted earth-tone palette, period-accurate historical atmosphere, gentle optical bloom and organic 24fps motion blur. Strictly NO modern 4K digital crispness, NO synthetic bright modern dyes, NO modern machine-stitched collared shirts, NO modern trousers or sneakers, NO modern concrete buildings or asphalt roads, NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin.";
    }

    const isGhibli =
      styleUpper === "GHIBLI_ANIME" ||
      styleUpper === "GHIBLI" ||
      ideaLower.includes("ghibli") ||
      ideaLower.includes("zibly");

    if (isGhibli) {
      return "Aesthetic & Animation Realism: Enchanting Studio Ghibli hand-painted feature animation aesthetic, lush watercolor landscapes, vibrant rolling green hills, fluffy clouds in azure skies, warm whimsical character design with expressive eyes and fluid hand-drawn motion, nostalgic and uplifting atmosphere, rich pastoral details. Strictly NO live-action film, NO photorealistic live humans, NO sterile CGI, NO uncanny 3D plastics.";
    }

    const isCartoon = styleUpper === "CARTOON_2D" || styleUpper === "CARTOON";
    if (isCartoon) {
      return "Aesthetic Realism: Classic whimsical 2D storybook cartoon animation, crisp expressive outlines, playful bouncy character animation, charming colorful scenery, joyful children's picture-book illustration style. Strictly NO photorealism, NO live-action.";
    }

    const is3DAnim = styleUpper === "ANIMATION_3D" || styleUpper === "KIDS_3D_ANIMATION" || styleUpper === "3D_ANIMATION";
    if (is3DAnim) {
      return "Aesthetic Realism: Vibrant Pixar/Disney-quality 3D kids animation, soft warm global illumination, expressive stylized character models, bouncy playful physics, vibrant saturated color palette, clean child-friendly aesthetics. Strictly NO dark horror, NO uncanny valley, NO photorealistic live-action.";
    }

    if (styleUpper === "ANIME") {
      return "Aesthetic Realism: High-end Japanese anime cinematic feature style, hand-drawn keyframe animation feel, expressive dynamic lighting, painterly background art, 24fps cinema pace. Strictly NO CGI 3D uncanny plastic, NO live-action film artifacts.";
    }

    if (styleUpper === "BLACK_AND_WHITE" || styleUpper === "FILM_NOIR") {
      return "Aesthetic Realism: Classic high-contrast black-and-white 35mm film photography, rich silver-halide tonal gradation, deep dramatic shadows, soft highlights, vintage optical grain at 24fps.";
    }

    if (styleUpper === "DOCUMENTARY") {
      return "Aesthetic Realism: Grounded documentary cinema realism, natural ambient lighting, true-to-life color grading, authentic human skin pores, natural textile cloth physics, 24fps motion blur. Strictly NO CGI, NO 3D animation, NO plastic skin.";
    }

    if (styleUpper === "STOP_MOTION" || styleUpper === "CLAYMATION") {
      return "Aesthetic Realism: Handcrafted tactile stop-motion animation, physical clay and miniature articulated puppet textures, subtle 12fps tactile frame cadence, miniature studio set lighting with shallow macro depth of field. Strictly NO smooth CGI, NO 3D digital gloss, NO live-action photorealism.";
    }

    if (styleUpper === "COMIC_BOOK" || styleUpper === "GRAPHIC_NOVEL") {
      return "Aesthetic Realism: Bold graphic novel and comic-book illustration aesthetic, rich halftone dot printing patterns, dramatic ink cross-hatching, high-contrast dynamic line work, vibrant superhero palette, expressive comic framing. Strictly NO photographic realism, NO bland lighting.";
    }

    if (styleUpper === "WATERCOLOR") {
      return "Aesthetic Realism: Expressive hand-painted watercolor illustration, soft pigment washes on textured cold-press cotton paper, luminous bleeding edges, gentle pastel and luminous color palette, fluid artistic movement. Strictly NO harsh digital lines, NO glossy 3D plastic, NO live-action film.";
    }

    if (styleUpper === "FANTASY_CONCEPT_ART" || styleUpper === "FANTASY") {
      return "Aesthetic Realism: Epic digital matte painting and fantasy concept art, sweeping atmospheric volumetric lighting, ethereal god-rays, grand cinematic scale, rich mystical detailing, legendary heroic atmosphere. Strictly NO mundane modern elements, NO digital compression artifacts.";
    }

    if (styleUpper === "LIVE_ACTION_AD" || styleUpper === "COMMERCIAL") {
      return "Aesthetic Realism: Premium high-end commercial advertising cinematography, vibrant pristine color grading, Arri Alexa 65mm sensor clarity, glamorous commercial studio lighting, razor-sharp product and talent focus. Strictly NO amateur home-video grain, NO washed-out lighting, NO deformed hands.";
    }

    return "Aesthetic Realism: Ultra-cinematic film masterpiece, authentic human skin pores, natural textile cloth physics, grounded physical weight, 24fps motion blur, realistic optical depth of field. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs.";
  },

  // Backwards compatibility constant
  RENDERING_INTEGRITY:
    "Aesthetic Realism: Ultra-photorealistic documentary cinema masterpiece, authentic human skin pores, natural textile cloth physics, grounded physical weight, 24fps motion blur, realistic optical depth of field. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern artifacts in period films.",
} as const;

/**
 * Scans descriptive text and user source idea to identify physical entities, vehicles, locomotion, props, and historical era.
 */
export function detectPhysicalEntities(text: string, sourceIdea?: string | null): DetectedEntities {
  const combined = `${text} ${sourceIdea || ""}`.toLowerCase();

  const isDraftCart = /\b(cart|wagon|carriage|chariot|bullock|bullocks|oxen|ox|horse-drawn|yoke)\b/i.test(combined);
  const isMount = /\b(riding a horse|on horseback|mounted on|elephant back|riding an elephant)\b/i.test(combined);
  const isMechanical = /\b(car|truck|train|locomotive|bicycle|bycycle|cycle|bike|motorcycle|scooter|bus)\b/i.test(combined);
  const isWatercraft = /\b(boat|canoe|ship|vessel|ferry|raft|oar|rowing)\b/i.test(combined);

  const hasVehicleOrMount = isDraftCart || isMount || isMechanical || isWatercraft;
  let vehicleType: DetectedEntities["vehicleType"] = undefined;
  if (isDraftCart) vehicleType = "draft_cart";
  else if (isMount) vehicleType = "riding_mount";
  else if (isMechanical) vehicleType = "mechanical_vehicle";
  else if (isWatercraft) vehicleType = "watercraft";
  else if (hasVehicleOrMount) vehicleType = "other";

  const hasLocomotion = /\b(run|running|sprint|sprinting|walk|walking|flee|fleeing|chase|chasing|track|tracking|stride|striding|rush|rushing)\b/i.test(combined);
  const hasSpokenDialogue = /\b(speaks:|speak:|dialogue|shout|shouts|cries|yells|says|said)\b/i.test(combined) || combined.includes('"');
  const hasHandheldProp = /\b(holding|holds|carries|carrying|gripping|torch|lantern|lamp|sword|knife|stick|staff|map|book|scroll|coin|vessel|pitcher|pot|basket)\b/i.test(combined);
  
  const has1900s = /\b(1900|1900s|early 1900|early 20th century|1910|1920)\b/i.test(combined);
  const hasGeneralPeriod = /\b(vintage|old years|ancient|historical|kingdom|palace|chettinad|pudukkottai|temple|dynasty|bazaar|handloom|pre-independence|colonial)\b/i.test(combined);
  const hasPeriodSetting = has1900s || hasGeneralPeriod;
  const periodEra = has1900s ? "1900s" : hasGeneralPeriod ? "historical_vintage" : undefined;

  const hasCulinaryAction = /\b(chop|chopping|slice|slicing|dice|dicing|diced|grate|grating|graiding|peel|peeling|sear|searing|sizzle|sizzling|pan-fry|stir-fry|deep-fry|fry|fried|simmer|simmering|saut[eé]|whisk|whisking|knead|kneading|cutting board|chopping board|skillet|saucepan|stovetop burner|raw meat|ribeye|garlic clove|olive oil drizzle|tawa|kadai|wok|cleaver|marinade|marinating|batter|breadcrumbs?|panko)\b/i.test(combined);
  let culinaryFocus: string | undefined = undefined;
  if (hasCulinaryAction) {
    if (/\b(chop|slice|dice|knife|cutting board|grate|peel)\b/i.test(combined)) culinaryFocus = "knife_prep";
    else if (/\b(sear|sizzle|fry|skillet|pan|flame|tawa|kadai|wok)\b/i.test(combined)) culinaryFocus = "pan_sizzle";
    else if (/\b(simmer|boil|sauce|pot)\b/i.test(combined)) culinaryFocus = "simmer_reduction";
    else if (/\b(plate|plating|garnish|serve)\b/i.test(combined)) culinaryFocus = "plating_presentation";
    else culinaryFocus = "general_cooking";
  }

  // Universal Inedible / Non-Food Object Discovery:
  const isCookingContext =
    hasCulinaryAction ||
    /\b(chef|chefs|cooks?|cooked|cooking|stir-fry|stir-fried|pan-fry|fry|fries|fried|frying|deep-fry|sizzle|sizzles|sizzling|sear|sears|searing|recipe|recipes|soup|soups|stew|stews|saute|masala|curry|roast|roasts|roasting|bake|bakes|baking|braise|braising|butcher block|cutting board|chopping board|board|wok|woks|skillet|skillets|pan|pans|kitchen|marinade|marinate|marinating|plating|garnish|garnishes|tweezers?|cleaver|cleavers|tawa|kadai)\b/i.test(combined);

  const hasExplicitNonFood =
    /\b(inedible|non-food|hardware|scrap|e-waste|tech|gadget|odd object|unimaginable|mechanical)\b/i.test(combined) ||
    /\b(bicycles?|bycycles?|cycles?|bikes?|motorcycles?|scooters?|skateboards?|chains?|tires?|tyres?|tiers?|sponge|sponch|wheels?|pedals?|spokes?|saddles?|seats?|handlebars?)\b/i.test(combined) ||
    /\b(walkman|cassette(?:s)?|cassette player|tape player|game\s*boy|gameboy|nintendo|cartridges?|pokemon|keyboards?|keycaps?|cherry mx|switch(?:es)?|pcb|circuit boards?|motherboards?|resistors?|capacitors?|airbuds?|airpods?|earphones?|headphones?|smartphones?|mobile phones?|cellphones?|batter(?:y|ies)|screws?|bolts?|copper wire|wires?|cables?|stones?|granite|rocks?|pebbles?|glass|marbles?|crystals?|gems?|diamonds?|watch(?:es)?|clock|gears?|bearings?|spark plugs?|engines?|motors?|sneakers?|shoes?|boots?|rubber|leather|chess|violins?|guitars?|cameras?|lens(?:es)?|light bulbs?|coins?|cards?|billiards?|drones?|tools?)\b/i.test(combined);

  const isInedibleCooking = isCookingContext && hasExplicitNonFood;

  let inedibleHeroObject: string | undefined = undefined;
  if (isInedibleCooking) {
    // 1. First priority: Check OBJECT_COMPONENT_REGISTRY for precise match
    for (const entry of OBJECT_COMPONENT_REGISTRY) {
      if (entry.category !== "GENERAL_PHYSICAL_OBJECT" && entry.detectRegex.test(combined)) {
        inedibleHeroObject = entry.canonicalHeroName;
        break;
      }
    }

    // 2. Second priority: Dynamic extraction for custom objects from phrases like "cooks a [object]" or "stir-fry [object]"
    if (!inedibleHeroObject) {
      const verbObjMatch = combined.match(/\b(?:cook(?:s|ing)?|fr(?:y|ies|ying)|stir-fr(?:y|ies|ying)|prepar(?:e|es|ing)|sizzl(?:e|es|ing)|roast(?:s|ing)?)\s+(?:a|an|the|some)?\s*([a-z0-9\s-]+?)(?:\s+(?:in|with|on|onto|into|for|inside|dish|masala|stir-fry|soup|fry|sauce)\b|$)/i);
      if (verbObjMatch && verbObjMatch[1]) {
        const candidate = verbObjMatch[1].trim().replace(/^(a|an|the|one|some)\s+/i, "").trim();
        const stopWords = new Set(["the", "a", "an", "one", "some", "this", "that", "it", "all", "its", "each", "these", "those"]);
        if (candidate.length > 2 && !stopWords.has(candidate.toLowerCase()) && !candidate.toLowerCase().includes("gourmet") && !candidate.toLowerCase().includes("hero object") && !candidate.toLowerCase().includes("inedible")) {
          inedibleHeroObject = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    // 3. Fallback to specialized keyword detector
    if (!inedibleHeroObject) {
      if (/\b(bicycles?|bycycles?|cycles?|bikes?)\b/i.test(combined)) inedibleHeroObject = "Vintage Bicycle";
      else if (/\b(game\s*boy|gameboy|nintendo|cartridge|pokemon)\b/i.test(combined)) inedibleHeroObject = "Vintage Game Boy Color";
      else if (/\b(keyboard|keycaps?)\b/i.test(combined)) inedibleHeroObject = "Mechanical Keyboard";
      else if (/\b(walkman|cassette player)\b/i.test(combined)) inedibleHeroObject = "Vintage Sony Walkman";
      else if (/\b(airbuds?|airpods?|earphones?)\b/i.test(combined)) inedibleHeroObject = "Wireless Earbuds";
      else if (/\b(smartphones?|mobile phone|phone)\b/i.test(combined)) inedibleHeroObject = "Smartphone";
      else if (/\b(sneakers?|shoes?|boots?)\b/i.test(combined)) inedibleHeroObject = "Sneaker";
      else if (/\b(watch|watches?|clock)\b/i.test(combined)) inedibleHeroObject = "Mechanical Watch";
      else if (/\b(stones?|granite|rocks?)\b/i.test(combined)) inedibleHeroObject = "Granite River Stones";
      else if (/\b(circuit board|pcb)\b/i.test(combined)) inedibleHeroObject = "Circuit Board";
      else if (/\b(camera|lens)\b/i.test(combined)) inedibleHeroObject = "Camera";
      else if (/\b(violin|guitar)\b/i.test(combined)) inedibleHeroObject = "Musical Instrument";
      else if (/\b(glass|marbles?|crystals?)\b/i.test(combined)) inedibleHeroObject = "Crystal Glass";
      else inedibleHeroObject = "Artisan Mechanical Hardware";
    }
  }

  return {
    hasVehicleOrMount,
    vehicleType,
    hasLocomotion,
    hasSpokenDialogue,
    hasHandheldProp,
    hasPeriodSetting,
    periodEra,
    hasCulinaryAction,
    culinaryFocus,
    isInedibleCooking,
    inedibleHeroObject,
  };
}

/**
 * Formats a clean 3-plane spatial staging block.
 */
export function formatThreePlaneStaging(params: {
  foreground: string;
  midground?: string;
  background?: string;
}): string {
  const lines: string[] = [];
  lines.push(`- Foreground Action: ${params.foreground.trim()}`);
  if (params.midground && params.midground.trim().length > 0) {
    lines.push(`- Midground Staging (firmly grounded, separated from foreground): ${params.midground.trim()}`);
  }
  if (params.background && params.background.trim().length > 0) {
    lines.push(`- Background Depth & Architecture: ${params.background.trim()}`);
  }
  return lines.join("\n");
}

