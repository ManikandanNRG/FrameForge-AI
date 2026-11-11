import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

const fixSchema = z.object({
  issue: z.string().min(2, "Issue description is required"),
  targetTab: z.enum(["flux", "video", "flow"]).default("video"),
  apply: z.boolean().default(true),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, shotId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: { productionAssets: true },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const shot = await prisma.shot.findUnique({ where: { id: shotId as string } });
  if (!shot || shot.projectId !== projectId) throw notFound("Shot not found");

  const body = await req.json().catch(() => ({}));
  const parsed = fixSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid parameters", parsed.error.issues);

  const { issue, targetTab, apply } = parsed.data;

  // Analyze the issue and classify diagnosis
  const lowerIssue = issue.toLowerCase();
  let diagnosis = "";
  let correction = "";
  let addedNegative = "";
  let fortifiedAction = shot.actionDescription;

  const isCulinary = project.visualStyle === "CULINARY_MACRO_ASMR" || /cooking|culinary|chef|steak|food|pan/i.test(project.genre || "" + project.sourceIdea);

  if (isCulinary && (/jump|teleport|curry leaf|herb|rosemary|leaf|leaves|threw|throw|put|putting|pan|stove|skillet|oil|sizzle|fry/i.test(lowerIssue))) {
    diagnosis = "Workstation Conflict & Jump-Cut: The prep shot lacked explicit stove/pan exclusion, causing AI to hallucinate a mid-video jump into oil frying.";
    correction = "Locked chef strictly to cutting board workstation; banned stove, skillets, oil sizzle, and dropping herbs.";
    addedNegative = "stove, frying pan, skillet, hot oil, dropping herbs into pan, curry leaf in pan, burner flame, teleporting, walking away";
    fortifiedAction = `${shot.actionDescription.replace(/\.\s*$/, "")}. The chef remains strictly anchored at the wooden cutting board workstation, never touching or approaching the stove or frying pan.`;
  } else if (/morph|change|shape-shift|blend|disappear|transform|liquid|melt/i.test(lowerIssue)) {
    diagnosis = "Object Persistence Failure: Mass conservation was not rigid enough during cutting or motion.";
    correction = "Enforced rigid object boundaries, clean separation, and mass-preserving physics.";
    addedNegative = "morphing, rubber food, dissolving ingredients, synthetic melting, disappearing objects";
    fortifiedAction = `${shot.actionDescription.replace(/\.\s*$/, "")}. Ingredients divide with rigid geometric separation without shape-shifting or morphing.`;
  } else if (/hand|finger|arm|third|extra|phantom|float|blade/i.test(lowerIssue)) {
    diagnosis = "Anatomical Discrepancy: AI hallucinated secondary or phantom appendages.";
    correction = "Strictly locked max two hands in frame (knife grip + claw grip) and rigid tool attachment.";
    addedNegative = "phantom hand, third arm, extra limbs, detached knife, floating blade, deformed fingers";
    fortifiedAction = `${shot.actionDescription.replace(/\.\s*$/, "")}. Exactly two human hands visible: one holding knife handle, one in steady claw grip.`;
  } else if (/camera|shaky|fast|jitter|zoom|speed/i.test(lowerIssue)) {
    diagnosis = "Cinematic Kinetic Instability: Camera movement was too erratic or fast.";
    correction = "Anchored camera to a slow, smooth optical dolly slider push-in at 24fps.";
    addedNegative = "shaky cam, rapid zoom, jerky camera, motion blur, fast panning";
  } else if (/face|wardrobe|clothes|shirt|character|person|hair|identity/i.test(lowerIssue)) {
    diagnosis = "Character Consistency Drift: Character facial structure or clothing drifted during video generation.";
    correction = "Reinforced strict wardrobe anchor and facial fidelity lock from reference image.";
    addedNegative = "changing face, different person, costume change, inconsistent clothes, morphing face";
  } else {
    diagnosis = `AI Hallucination Detected: ${issue}`;
    correction = `Reinforced physical boundary constraints and targeted negative filters against "${issue}".`;
    addedNegative = issue.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  }

  // Compile new fortified prompt bundle
  const locationAsset = project.productionAssets.find((a) => a.assetType === "LOCATION");
  const characterAsset = project.productionAssets.find((a) => a.assetType === "CHARACTER");

  let audioData: { dialogue?: string; voiceover?: string; audioPrompt?: string } = {};
  try {
    if (shot.negativeConstraints) {
      audioData = JSON.parse(shot.negativeConstraints);
    }
  } catch {}

  const bundle = compileCinematicPrompt({
    actionDescription: fortifiedAction,
    shotSize: shot.shotSize,
    cameraMovement: /camera|shaky|fast/i.test(lowerIssue) ? "Slow smooth mechanical slider dolly push-in at 24fps" : shot.cameraMovement,
    lighting: shot.lighting,
    dialogue: audioData.dialogue || "",
    voiceover: audioData.voiceover || "",
    audioPrompt: audioData.audioPrompt || "",
    characterName: characterAsset?.name,
    locationDescription: locationAsset?.description,
    aspectRatio: project.aspectRatio,
    storyLanguage: project.storyLanguage,
    visualStyle: project.visualStyle,
    sourceIdea: project.sourceIdea,
    genre: project.genre,
    tone: project.tone,
  });

  // Inject user's specific negative fix into the prompt
  let fixedPrompt =
    targetTab === "flux"
      ? bundle.fluxStillPrompt
      : targetTab === "video"
      ? bundle.videoMotionPrompt
      : bundle.googleFlowPrompt;

  if (addedNegative) {
    if (fixedPrompt.includes('--negative "')) {
      fixedPrompt = fixedPrompt.replace('--negative "', `--negative "${addedNegative}, `);
    } else {
      fixedPrompt = `${fixedPrompt} --negative "${addedNegative}"`;
    }
  }

  // Apply to shot in database if apply is true
  if (apply) {
    await prisma.shot.update({
      where: { id: shotId as string },
      data: {
        actionDescription: fortifiedAction,
        imagePrompt: bundle.fluxStillPrompt,
        videoPrompt: fixedPrompt,
      },
    });
  }

  return {
    ok: true,
    diagnosis,
    correction,
    addedNegative,
    fixedPrompt,
    bundle,
    shotId,
  };
});
