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

  // Dynamic Rendering Integrity Generator based on User Visual Style & Era
  getRenderingIntegrity: (visualStyle?: string | null, sourceIdea?: string | null, isPeriod = false): string => {
    const styleUpper = (visualStyle || "").toUpperCase();
    const ideaLower = (sourceIdea || "").toLowerCase();
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

    if (styleUpper === "ANIME") {
      return "Aesthetic Realism: High-end Japanese anime cinematic feature style, hand-drawn keyframe animation feel, expressive dynamic lighting, painterly background art, 24fps cinema pace. Strictly NO CGI 3D uncanny plastic, NO live-action film artifacts.";
    }

    if (styleUpper === "BLACK_AND_WHITE" || styleUpper === "FILM_NOIR") {
      return "Aesthetic Realism: Classic high-contrast black-and-white 35mm film photography, rich silver-halide tonal gradation, deep dramatic shadows, soft highlights, vintage optical grain at 24fps.";
    }

    if (styleUpper === "DOCUMENTARY") {
      return "Aesthetic Realism: Grounded documentary cinema realism, natural ambient lighting, true-to-life color grading, authentic human skin pores, natural textile cloth physics, 24fps motion blur. Strictly NO CGI, NO 3D animation, NO plastic skin.";
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

  const hasCulinaryAction = /\b(chop|chopping|slice|slicing|dice|dicing|sear|searing|sizzle|sizzling|fry|frying|boil|boiling|simmer|simmering|saut[eé]|pour|pouring|whisk|whisking|knead|kneading|knife|cutting board|skillet|pan|pot|stove|burner|ingredient|ingredients|garlic|steak|onion|butter|oil|asmr|recipe|dish|culinary|cook|cooking|plate|plating|garnish)\b/i.test(combined);
  let culinaryFocus: string | undefined = undefined;
  if (hasCulinaryAction) {
    if (/\b(chop|slice|dice|knife|cutting board)\b/i.test(combined)) culinaryFocus = "knife_prep";
    else if (/\b(sear|sizzle|fry|skillet|pan|flame)\b/i.test(combined)) culinaryFocus = "pan_sizzle";
    else if (/\b(simmer|boil|sauce|pot)\b/i.test(combined)) culinaryFocus = "simmer_reduction";
    else if (/\b(plate|plating|garnish|serve)\b/i.test(combined)) culinaryFocus = "plating_presentation";
    else culinaryFocus = "general_cooking";
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

