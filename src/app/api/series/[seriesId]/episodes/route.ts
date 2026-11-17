import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";
import { detectPhysicalEntities } from "@/lib/story/world-engine";
import { generateInediblePipelineScenes } from "@/lib/story/inedible-pipeline";

const createEpisodeSchema = z.object({
  title: z.string().min(1).max(200),
  sourceIdea: z.string().min(1).max(5000),
  description: z.string().max(2000).optional(),
  studioEnvironment: z.string().max(500).optional(),
  chefWardrobeOverride: z.string().max(500).optional(),
  runtimeSeconds: z.number().int().min(15).max(7200).optional(),
  targetRuntime: z.number().int().min(15).max(7200).optional(),
  storyLanguage: z.string().max(50).optional(),
  aspectRatio: z.string().optional(),
  visualStyle: z.string().optional(),
  genre: z.string().max(100).optional(),
  tone: z.string().max(100).optional(),
  dialogueMode: z.string().optional(),
  audience: z.string().max(200).optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { seriesId } = await ctx.params;
  const series = await prisma.series.findUnique({
    where: { id: seriesId as string },
    include: {
      episodes: {
        orderBy: { episodeNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  const body = await req.json();
  const parsed = createEpisodeSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid episode data", parsed.error.issues);
  }

  const latestEpisode = series.episodes[0];
  const nextEpisodeNumber = (latestEpisode?.episodeNumber ?? 0) + 1;
  const targetRuntime =
    parsed.data.targetRuntime ??
    parsed.data.runtimeSeconds ??
    series.targetRuntime ??
    20;
  const visualStyle = parsed.data.visualStyle || series.visualStyle || "CULINARY_MACRO_ASMR";
  const genre = parsed.data.genre || series.genre || "Culinary & Cooking ASMR";
  const tone = parsed.data.tone || series.tone || "Satisfying, Crisp & Hypnotic";
  const dialogueMode = parsed.data.dialogueMode || series.dialogueMode || "PURE_ASMR_FOLEY";
  const aspectRatio = parsed.data.aspectRatio || series.aspectRatio || "PORTRAIT_9_16";
  const storyLanguage = parsed.data.storyLanguage || series.storyLanguage || "English";
  const studioEnvironment =
    parsed.data.studioEnvironment ||
    series.defaultStudioEnvironment ||
    "Dark Walnut End-Grain Butcher Block";
  const wardrobe =
    parsed.data.chefWardrobeOverride ||
    series.defaultChefWardrobe ||
    "vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, leather artisan apron, black grip gloves";

  // 1. Create the new Episode Project inheriting / configuring all user inputs
  const newProject = await prisma.project.create({
    data: {
      ownerId,
      seriesId: series.id,
      episodeNumber: nextEpisodeNumber,
      title: parsed.data.title,
      description:
        parsed.data.description ||
        `Episode ${nextEpisodeNumber} of ${series.title}: ${targetRuntime}s Film Masterpiece.`,
      sourceIdea: parsed.data.sourceIdea,
      visualStyle,
      genre,
      tone,
      dialogueMode,
      aspectRatio,
      targetRuntime,
      storyLanguage,
      studioEnvironment,
      chefWardrobeOverride: parsed.data.chefWardrobeOverride,
      currentStage: "STORY",
      status: "ACTIVE",
    },
  });

  // 2. Clone or Link Lead Character from Previous Episodes
  const existingChar = await prisma.productionAsset.findFirst({
    where: {
      project: { seriesId: series.id },
      assetType: "CHARACTER",
    },
    orderBy: { createdAt: "desc" },
  });

  const leadCharName = existingChar?.name
    ? existingChar.name.replace(/\s+Chef$/i, "")
    : "The Shadow Alchemist";

  const leadChar = await prisma.productionAsset.create({
    data: {
      projectId: newProject.id,
      assetType: "CHARACTER",
      name: leadCharName,
      description:
        existingChar?.description ||
        "An athletic male artisan culinary alchemist with intense hazel eyes, swept dark tousled hair, brass vintage tinker goggles with dark circular glass resting on forehead, and a bespoke aerodynamic matte-black tactical half-mask with vertical gold cheekline slit vents.",
      canonicalMediaId: existingChar?.canonicalMediaId || null,
      attributes: JSON.stringify({
        wardrobeLock: wardrobe,
        role: "LEAD_CHEF",
        channelId: series.id,
      }),
      continuityRules: JSON.stringify([
        "Strictly wears vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, black grip gloves, leather apron.",
        "Maintain 100% facial and wardrobe consistency across every scene.",
      ]),
      approvalStatus: "APPROVED",
    },
  });

  // 3. Auto-detect Inedible Hero Object
  const detected = detectPhysicalEntities(
    `${newProject.title} ${newProject.sourceIdea}`,
    newProject.sourceIdea
  );
  const heroObject = detected.inedibleHeroObject || "Gourmet Subject";

  // 4. Generate the Universal 4-Stage Inedible Craft-Culinary Pipeline
  const pipeline = generateInediblePipelineScenes({
    heroObject,
    sourceIdea: newProject.sourceIdea,
    studioEnvironment,
    targetRuntime,
    episodeNumber: nextEpisodeNumber,
    seriesTitle: series.title,
  });

  const sceneTemplates = pipeline.scenes;
  const fallbackDuration = Math.round(targetRuntime / (sceneTemplates.length || 1));

  for (const t of sceneTemplates) {
    const shotDuration = t.estimatedDurationSeconds || fallbackDuration;
    const scene = await prisma.scene.create({
      data: {
        projectId: newProject.id,
        sceneNumber: t.num,
        heading: t.heading,
        location: studioEnvironment,
        timeOfDay: "NIGHT",
        actionSummary: t.action,
        estimatedDurationSeconds: shotDuration,
        approvalStatus: "APPROVED",
      },
    });

    const bundle = compileCinematicPrompt({
      actionDescription: t.action,
      shotSize: t.shotSize,
      cameraMovement: t.cameraMovement,
      characterName: leadChar.name,
      characterDescription: leadChar.description,
      wardrobeLock: wardrobe,
      locationDescription: studioEnvironment,
      heroObject,
      visualStyle: newProject.visualStyle,
      genre: newProject.genre,
      tone: newProject.tone,
      aspectRatio: newProject.aspectRatio,
      targetDurationSeconds: shotDuration,
      sourceIdea: newProject.sourceIdea,
    });

    await prisma.shot.create({
      data: {
        sceneId: scene.id,
        projectId: newProject.id,
        shotNumber: 1,
        actionDescription: t.action,
        shotSize: t.shotSize,
        cameraMovement: t.cameraMovement,
        lighting: "Warm directional culinary studio lighting, soft key illumination, appetizing natural highlights",
        mood: "Satisfying, Crisp & Hypnotic",
        targetDurationSeconds: shotDuration,
        aspectRatio: newProject.aspectRatio,
        imagePrompt: bundle.fluxStillPrompt,
        videoPrompt: bundle.googleFlowPrompt,
        negativeConstraints: bundle.universalNegativePrompt,
        approvalStatus: "APPROVED",
      },
    });
  }

  // 5. Persist Story Foundation Artifacts (LOGLINE, PREMISE, SYNOPSIS, SCREENPLAY, YOUTUBE_THUMBNAIL)
  const createOrUpdateArtifact = async (artifactType: string, contentText: string, contentJson: any = {}) => {
    const art = await prisma.storyArtifact.create({
      data: {
        projectId: newProject.id,
        artifactType,
        approvalStatus: "APPROVED",
        versions: {
          create: {
            versionNumber: 1,
            contentText,
            contentJson: JSON.stringify(contentJson),
            source: "AI",
            createdByUserId: ownerId,
          },
        },
      },
      include: { versions: true },
    });
    await prisma.storyArtifact.update({
      where: { id: art.id },
      data: { currentVersionId: art.versions[0]?.id },
    });
  };

  await createOrUpdateArtifact("LOGLINE", pipeline.logline);
  await createOrUpdateArtifact("PREMISE", pipeline.premise);
  await createOrUpdateArtifact("SYNOPSIS", pipeline.synopsis);
  await createOrUpdateArtifact(
    "SCREENPLAY",
    JSON.stringify(
      {
        title: newProject.title,
        heroObject,
        runtime: targetRuntime,
        scenes: pipeline.scenes,
      },
      null,
      2
    ),
    { title: newProject.title, heroObject, runtime: targetRuntime, scenes: pipeline.scenes }
  );
  await createOrUpdateArtifact("YOUTUBE_THUMBNAIL", pipeline.thumbnailPrompt, { prompt: pipeline.thumbnailPrompt });

  // Fetch full project with scenes & series info
  const completeEpisode = await prisma.project.findUnique({
    where: { id: newProject.id },
    include: {
      series: true,
      productionAssets: true,
      scenes: {
        include: { shots: true },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });

  return { ok: true, episode: completeEpisode };
});
