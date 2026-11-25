import { prisma } from "@/lib/db/client";
import { forbidden, notFound } from "@/lib/errors";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";
import { detectPhysicalEntities } from "@/lib/story/world-engine";
import { generateInediblePipelineScenes } from "@/lib/story/inedible-pipeline";

export interface CreateSeriesEpisodeInput {
  ownerId: string;
  seriesId: string;
  title: string;
  sourceIdea: string;
  episodeNumber?: number;
  description?: string;
  studioEnvironment?: string;
  chefWardrobeOverride?: string;
  targetRuntime?: number;
  storyLanguage?: string;
  aspectRatio?: string;
  visualStyle?: string;
  genre?: string;
  tone?: string;
  dialogueMode?: string;
}

/**
 * Creates a new episode inside a Series, cloning the lead character anchor,
 * generating scenes via the Inedible Pipeline, compiling cinematic prompts,
 * and persisting story foundation artifacts.
 */
export async function createSeriesEpisode(input: CreateSeriesEpisodeInput) {
  const { ownerId, seriesId } = input;

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      episodes: {
        orderBy: { episodeNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  const latestEpisode = series.episodes[0];
  const nextEpisodeNumber = input.episodeNumber ?? (latestEpisode?.episodeNumber ?? 0) + 1;
  const targetRuntime = input.targetRuntime ?? series.targetRuntime ?? 20;
  const visualStyle = input.visualStyle || series.visualStyle || "CULINARY_MACRO_ASMR";
  const genre = input.genre || series.genre || "Culinary & Cooking ASMR";
  const tone = input.tone || series.tone || "Satisfying, Crisp & Hypnotic";
  const dialogueMode = input.dialogueMode || series.dialogueMode || "PURE_ASMR_FOLEY";
  const aspectRatio = input.aspectRatio || series.aspectRatio || "PORTRAIT_9_16";
  const storyLanguage = input.storyLanguage || series.storyLanguage || "English";
  const studioEnvironment =
    input.studioEnvironment ||
    series.defaultStudioEnvironment ||
    "Dark Walnut End-Grain Butcher Block";
  const wardrobe =
    input.chefWardrobeOverride ||
    series.defaultChefWardrobe ||
    "vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, leather artisan apron, black grip gloves";

  // 1. Create the new Episode Project inheriting / configuring all user inputs
  const newProject = await prisma.project.create({
    data: {
      ownerId,
      seriesId: series.id,
      episodeNumber: nextEpisodeNumber,
      title: input.title,
      description:
        input.description ||
        `Episode ${nextEpisodeNumber} of ${series.title}: ${targetRuntime}s Film Masterpiece.`,
      sourceIdea: input.sourceIdea,
      visualStyle,
      genre,
      tone,
      dialogueMode,
      aspectRatio,
      targetRuntime,
      storyLanguage,
      studioEnvironment,
      chefWardrobeOverride: input.chefWardrobeOverride,
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
      audioPrompt: t.foley,
      dialogue: "PURE_ASMR_FOLEY",
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

  // 5. Persist Story Foundation Artifacts
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

  return { episode: completeEpisode, heroObject, nextEpisodeNumber };
}
