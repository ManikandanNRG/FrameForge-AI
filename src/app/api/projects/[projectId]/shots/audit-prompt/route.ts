import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";
import { detectPhysicalEntities } from "@/lib/story/world-engine";

const auditSchema = z.object({
  shotId: z.string().optional(),
  actionDescription: z.string().min(1),
  cameraMovement: z.string().optional(),
  dialogue: z.string().optional(),
  voiceover: z.string().optional(),
  audioPrompt: z.string().optional(),
  shotSize: z.string().optional(),
  lighting: z.string().optional(),
  characterName: z.string().optional(),
  wardrobeLock: z.string().optional(),
  applyFix: z.boolean().optional().default(false),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: { productionAssets: true },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = auditSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid audit parameters");

  const {
    shotId,
    actionDescription,
    cameraMovement,
    dialogue,
    voiceover,
    audioPrompt,
    shotSize,
    lighting,
    characterName,
    wardrobeLock,
    applyFix,
  } = parsed.data;

  // 1. Detect physical entities
  const entities = detectPhysicalEntities(actionDescription, project.sourceIdea);
  const issues: string[] = [];
  let score = 100;

  // Audit 1: Vehicular & Draft Animal Harness Check
  if (entities.hasVehicleOrMount) {
    const hasFrontHarness = /front yoke|harnessed strictly|front wooden yoke|exclusively to the front/i.test(actionDescription);
    const hasRearProhibition = /no animals (at the rear|behind)/i.test(actionDescription);
    if (!hasFrontHarness || !hasRearProhibition) {
      issues.push("Vehicle/Mount detected without explicit single-point front-yoke harness constraint (risks dual-ended or rear-attached animals).");
      score -= 30;
    }
  }

  // Audit 2: Skeletal Alignment & Camera Facing Check
  if (entities.hasLocomotion && entities.hasSpokenDialogue) {
    const hasBackwardTracking = /track(ing)? backward|moving smoothly ahead|facing (their|his|her) front/i.test(
      `${actionDescription} ${cameraMovement || ""}`
    );
    if (!hasBackwardTracking) {
      issues.push("Moving character speaking dialogue without forward-facing backward tracking camera (risks 180° neck twist).");
      score -= 25;
    }
  }

  // Audit 3: Spatial Depth Grounding Check
  if (entities.hasVehicleOrMount) {
    const hasGrounding = /roadside|grounded|resting|packed cobblestone|dirt path|on the side/i.test(actionDescription);
    if (!hasGrounding) {
      issues.push("Vehicle lacks explicit ground anchoring or roadside staging (risks floating or fusing into characters).");
      score -= 15;
    }
  }

  // 2. Synthesize enhanced action description with universal physics auto-repair
  let enhancedAction = actionDescription.trim();

  if (entities.hasVehicleOrMount && (!enhancedAction.includes("front wooden yoke") && !enhancedAction.includes("front yoke"))) {
    // Auto-inject front harness and rear prohibition seamlessly
    if (/cart|wagon|carriage/i.test(enhancedAction)) {
      enhancedAction = enhancedAction.replace(
        /(cart|wagon|carriage)([^,.]*)/i,
        `$1$2 with draft animals hitched strictly and exclusively to the front wooden yoke pole facing forward (absolutely no animals at the rear)`
      );
    }
  }

  if (entities.hasLocomotion && entities.hasSpokenDialogue && !enhancedAction.includes("track") && !enhancedAction.includes("ahead")) {
    enhancedAction = `Low-angle tracking shot moving backward smoothly ahead of the character, facing their front torso and facial expression as ${enhancedAction.replace(/^[A-Z][a-z]+-angle [^,]+,\s*/i, "")}`;
  }

  // 3. Compile full prompt bundle with universal compiler
  const locationAsset = project.productionAssets.find((a) => a.assetType === "LOCATION");
  const bundle = compileCinematicPrompt({
    actionDescription: enhancedAction,
    shotSize: shotSize || "Medium Shot",
    cameraMovement: cameraMovement || "Subtle cinematic handheld camera motion",
    lighting: lighting || "Warm natural golden hour light",
    dialogue: dialogue || "",
    voiceover: voiceover || "",
    audioPrompt: audioPrompt || "",
    characterName: characterName || project.productionAssets.find((a) => a.assetType === "CHARACTER")?.name,
    wardrobeLock: wardrobeLock,
    locationDescription: locationAsset?.description || "Authentic setting",
    aspectRatio: project.aspectRatio,
    storyLanguage: project.storyLanguage,
    visualStyle: project.visualStyle,
    sourceIdea: project.sourceIdea,
    genre: project.genre,
    tone: project.tone,
  });

  // 4. If applyFix is true and shotId is provided, persist to database
  if (applyFix && shotId) {
    const existingShot = await prisma.shot.findUnique({ where: { id: shotId } });
    if (existingShot) {
      await prisma.shot.update({
        where: { id: shotId },
        data: {
          actionDescription: enhancedAction,
          imagePrompt: bundle.fluxStillPrompt,
          videoPrompt: bundle.googleFlowPrompt,
        },
      });
    }
  }

  return {
    ok: true,
    score: Math.max(0, score),
    isPhysicsVerified: score >= 90,
    issues,
    enhancedAction,
    bundle,
  };
});

