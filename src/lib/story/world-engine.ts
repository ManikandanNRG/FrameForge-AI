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
  const isMechanical = /\b(car|truck|train|locomotive|bicycle|bike|motorcycle|scooter|bus)\b/i.test(combined);
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

  const hasCulinaryAction = /\b(chop|chopping|slice|slicing|dice|dicing|sear|searing|sizzle|sizzling|pan-fry|stir-fry|simmer|simmering|saut[eé]|whisk|whisking|knead|kneading|cutting board|chopping board|skillet|saucepan|stovetop burner|raw meat|ribeye|garlic clove|olive oil drizzle)\b/i.test(combined);
  let culinaryFocus: string | undefined = undefined;
  if (hasCulinaryAction) {
    if (/\b(chop|slice|dice|knife|cutting board)\b/i.test(combined)) culinaryFocus = "knife_prep";
    else if (/\b(sear|sizzle|fry|skillet|pan|flame)\b/i.test(combined)) culinaryFocus = "pan_sizzle";
    else if (/\b(simmer|boil|sauce|pot)\b/i.test(combined)) culinaryFocus = "simmer_reduction";
    else if (/\b(plate|plating|garnish|serve)\b/i.test(combined)) culinaryFocus = "plating_presentation";
    else culinaryFocus = "general_cooking";
  }

  // Universal Inedible / Non-Food Object Discovery:
  const isCookingContext =
    hasCulinaryAction ||
    /\b(chef|cook|cooking|stir-fry|fry|fried|deep-fry|sizzle|sear|recipe|soup|stew|saute|masala|curry|roast|bake|braise|butcher block|cutting board|chopping board|board|wok|skillet|pan|kitchen|marinade|marinate|marinating|plating|garnish|tweezers?|cleaver)\b/i.test(combined);

  const hasExplicitNonFood =
    /\b(inedible|non-food|hardware|scrap|e-waste|tech|gadget|odd object|unimaginable)\b/i.test(combined) ||
    /\b(bicycle|bycycle|cycle|bike|motorcycle|scooter|skateboard|chain|chains|tire|tires|tier|tiers|sponge|sponch|wheel|wheels|pedals?|spokes?|saddle|seat|handlebars?)\b/i.test(combined) ||
    /\b(game\s*boy|gameboy|nintendo|cartridge|pokemon|keyboard|keycaps?|cherry mx|switch(?:es)?|pcb|circuit board|motherboard|resistors?|capacitors?|airbuds?|airpods?|earphones?|headphones?|smartphones?|mobile phone|battery|batteries|screws?|bolts?|copper wire|wires?|cables?|stones?|granite|rocks?|pebbles?|glass|marbles?|crystals?|gems?|diamonds?|watch|watches?|clock|gears?|bearings?|spark plugs?|engine|motor|sneakers?|shoes?|boots?|rubber|leather|chess|violin|guitar|camera|lens|light bulb|coins?|cards?|billiard)\b/i.test(combined);

  const isInedibleCooking = isCookingContext && hasExplicitNonFood;

  let inedibleHeroObject: string | undefined = undefined;
  if (isInedibleCooking) {
    // Dynamic extraction: Try to extract the direct object from phrases like "cooks a [object]" or "stir-fry [object]"
    const verbObjMatch = combined.match(/\b(?:cook(?:s|ing)?|fr(?:y|ies|ying)|stir-fr(?:y|ies|ying)|prepar(?:e|es|ing)|sizzl(?:e|es|ing)|roast(?:s|ing)?)\s+(?:a|an|the|some)?\s*([a-z0-9\s-]+?)(?:\s+(?:in|with|on|into|for|dish|masala|stir-fry|soup|fry|sauce)|$)/i);
    if (verbObjMatch && verbObjMatch[1] && verbObjMatch[1].trim().length > 2 && verbObjMatch[1].trim().length < 35) {
      const candidate = verbObjMatch[1].trim().replace(/^(a|an|the|one)\s+/i, "");
      if (candidate.length > 2 && !candidate.toLowerCase().includes("gourmet")) {
        inedibleHeroObject = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }

    if (!inedibleHeroObject || inedibleHeroObject.toLowerCase().includes("gourmet") || inedibleHeroObject.toLowerCase() === "physical hero object") {
      if (/\b(bicycl|bycycl|cycle|bike)\b/i.test(combined)) inedibleHeroObject = "Vintage Bicycle";
      else if (/\b(game\s*boy|gameboy|nintendo|cartridge|pokemon)\b/i.test(combined)) inedibleHeroObject = "Vintage Game Boy Color";
      else if (/\b(keyboard|keycaps?)\b/i.test(combined)) inedibleHeroObject = "Mechanical Keyboard";
      else if (/\b(airbuds?|airpods?|earphones?)\b/i.test(combined)) inedibleHeroObject = "Wireless Earbuds";
      else if (/\b(smartphones?|mobile phone|phone)\b/i.test(combined)) inedibleHeroObject = "Smartphone";
      else if (/\b(sneakers?|shoes?|boots?)\b/i.test(combined)) inedibleHeroObject = "Sneaker";
      else if (/\b(watch|watches?|clock)\b/i.test(combined)) inedibleHeroObject = "Mechanical Watch";
      else if (/\b(stones?|granite|rocks?)\b/i.test(combined)) inedibleHeroObject = "Granite River Stones";
      else if (/\b(circuit board|pcb)\b/i.test(combined)) inedibleHeroObject = "Circuit Board";
      else if (/\b(camera|lens)\b/i.test(combined)) inedibleHeroObject = "Camera";
      else if (/\b(violin|guitar)\b/i.test(combined)) inedibleHeroObject = "Musical Instrument";
      else if (/\b(glass|marbles?|crystals?)\b/i.test(combined)) inedibleHeroObject = "Crystal Glass";
      else inedibleHeroObject = "Vintage Mechanical Bicycle";
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

