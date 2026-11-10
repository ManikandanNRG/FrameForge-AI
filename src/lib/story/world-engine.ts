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

  // General Rendering Integrity
  RENDERING_INTEGRITY:
    "Aesthetic Realism: Ultra-photorealistic documentary cinema masterpiece, authentic human skin pores, natural textile cloth physics, grounded physical weight, 24fps motion blur, realistic optical depth of field. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern artifacts in period films.",
} as const;

/**
 * Scans any descriptive text to identify physical entities, vehicles, locomotion, and props.
 */
export function detectPhysicalEntities(text: string): DetectedEntities {
  const lower = text.toLowerCase();

  const isDraftCart = /\b(cart|wagon|carriage|chariot|bullock|bullocks|oxen|ox|horse-drawn|yoke)\b/i.test(lower);
  const isMount = /\b(riding a horse|on horseback|mounted on|elephant back|riding an elephant)\b/i.test(lower);
  const isMechanical = /\b(car|truck|train|locomotive|bicycle|bike|motorcycle|scooter|bus)\b/i.test(lower);
  const isWatercraft = /\b(boat|canoe|ship|vessel|ferry|raft|oar|rowing)\b/i.test(lower);

  const hasVehicleOrMount = isDraftCart || isMount || isMechanical || isWatercraft;
  let vehicleType: DetectedEntities["vehicleType"] = undefined;
  if (isDraftCart) vehicleType = "draft_cart";
  else if (isMount) vehicleType = "riding_mount";
  else if (isMechanical) vehicleType = "mechanical_vehicle";
  else if (isWatercraft) vehicleType = "watercraft";
  else if (hasVehicleOrMount) vehicleType = "other";

  const hasLocomotion = /\b(run|running|sprint|sprinting|walk|walking|flee|fleeing|chase|chasing|track|tracking|stride|striding|rush|rushing)\b/i.test(lower);
  const hasSpokenDialogue = /\b(speaks:|speak:|dialogue|shout|shouts|cries|yells|says|said)\b/i.test(lower) || lower.includes('"');
  const hasHandheldProp = /\b(holding|holds|carries|carrying|gripping|torch|lantern|lamp|sword|knife|stick|staff|map|book|scroll|coin|vessel|pitcher|pot|basket)\b/i.test(lower);
  const hasPeriodSetting = /\b(1900|1900s|vintage|ancient|historical|kingdom|palace|chettinad|pudukkottai|temple|dynasty|bazaar|handloom)\b/i.test(lower);

  return {
    hasVehicleOrMount,
    vehicleType,
    hasLocomotion,
    hasSpokenDialogue,
    hasHandheldProp,
    hasPeriodSetting,
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

