import { prisma } from "@/lib/db/client";
import { forbidden, notFound } from "@/lib/errors";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";
import { detectPhysicalEntities } from "@/lib/story/world-engine";
import {
  generateInediblePipelineScenes,
  type InedibleComparisonRow,
} from "@/lib/story/inedible-pipeline";

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
  dishName?: string;
  comparisonTable?: InedibleComparisonRow[];
}

export interface ReviseSeriesEpisodeInput {
  ownerId: string;
  projectId: string;
  title?: string;
  sourceIdea: string;
  targetRuntime?: number;
  dishName?: string;
  comparisonTable?: InedibleComparisonRow[];
}

const DEFAULT_WARDROBE =
  "vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, leather artisan apron, black grip gloves";

/**
 * Generates scenes, compiles cinematic prompts, writes Shot/Scene records,
 * and versions StoryArtifacts for either a newly created or in-place revised episode.
 */
async function persistEpisodeProduction(params: {
  ownerId: string;
  project: {
    id: string;
    title: string;
    sourceIdea: string;
    episodeNumber: number | null;
    visualStyle: string;
    genre: string | null;
    tone: string | null;
    aspectRatio: string;
    targetRuntime: number;
    studioEnvironment: string | null;
    chefWardrobeOverride: string | null;
  };
  seriesTitle: string;
  leadChar: { name: string; description: string };
  wardrobe: string;
  studioEnvironment: string;
  dishName?: string;
  comparisonTable?: InedibleComparisonRow[];
  replaceExistingScenes: boolean;
}) {
  const {
    ownerId,
    project,
    seriesTitle,
    leadChar,
    wardrobe,
    studioEnvironment,
    dishName,
    comparisonTable,
    replaceExistingScenes,
  } = params;

  const detected = detectPhysicalEntities(
    `${project.title} ${project.sourceIdea}`,
    project.sourceIdea
  );
  const heroObject = detected.inedibleHeroObject || "Gourmet Subject";

  const pipeline = generateInediblePipelineScenes({
    heroObject,
    sourceIdea: project.sourceIdea,
    studioEnvironment,
    targetRuntime: project.targetRuntime,
    episodeNumber: project.episodeNumber ?? 1,
    seriesTitle,
    dishName,
    comparisonTable,
  });

  if (replaceExistingScenes) {
    await prisma.shot.deleteMany({ where: { projectId: project.id } });
    await prisma.scene.deleteMany({ where: { projectId: project.id } });
  }

  const sceneTemplates = pipeline.scenes;
  const fallbackDuration = Math.round(
    project.targetRuntime / (sceneTemplates.length || 1)
  );

  for (const t of sceneTemplates) {
    const shotDuration = t.estimatedDurationSeconds || fallbackDuration;
    const scene = await prisma.scene.create({
      data: {
        projectId: project.id,
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
      visualStyle: project.visualStyle,
      genre: project.genre,
      tone: project.tone,
      aspectRatio: project.aspectRatio,
      targetDurationSeconds: shotDuration,
      sourceIdea: project.sourceIdea,
      audioPrompt: t.foley,
      dialogue: "PURE_ASMR_FOLEY",
    });

    await prisma.shot.create({
      data: {
        sceneId: scene.id,
        projectId: project.id,
        shotNumber: 1,
        actionDescription: t.action,
        shotSize: t.shotSize,
        cameraMovement: t.cameraMovement,
        lighting:
          "Warm directional culinary studio lighting, soft key illumination, appetizing natural highlights",
        mood: "Satisfying, Crisp & Hypnotic",
        targetDurationSeconds: shotDuration,
        aspectRatio: project.aspectRatio,
        imagePrompt: bundle.fluxStillPrompt,
        videoPrompt: bundle.googleFlowPrompt,
        negativeConstraints: bundle.universalNegativePrompt,
        approvalStatus: "APPROVED",
      },
    });
  }

  const upsertArtifactVersion = async (
    artifactType: string,
    contentText: string,
    contentJson: Record<string, unknown> = {}
  ) => {
    const existing = await prisma.storyArtifact.findFirst({
      where: { projectId: project.id, artifactType },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (existing) {
      const nextVersion = (existing.versions[0]?.versionNumber ?? 0) + 1;
      const version = await prisma.artifactVersion.create({
        data: {
          artifactId: existing.id,
          versionNumber: nextVersion,
          contentText,
          contentJson: JSON.stringify(contentJson),
          source: "AI",
          createdByUserId: ownerId,
        },
      });
      await prisma.storyArtifact.update({
        where: { id: existing.id },
        data: { currentVersionId: version.id, approvalStatus: "APPROVED" },
      });
      return;
    }

    const art = await prisma.storyArtifact.create({
      data: {
        projectId: project.id,
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

  await upsertArtifactVersion("LOGLINE", pipeline.logline);
  await upsertArtifactVersion("PREMISE", pipeline.premise);
  await upsertArtifactVersion("SYNOPSIS", pipeline.synopsis);
  await upsertArtifactVersion(
    "SCREENPLAY",
    JSON.stringify(
      {
        title: project.title,
        heroObject,
        runtime: project.targetRuntime,
        scenes: pipeline.scenes,
      },
      null,
      2
    ),
    {
      title: project.title,
      heroObject,
      runtime: project.targetRuntime,
      scenes: pipeline.scenes,
    }
  );
  await upsertArtifactVersion("YOUTUBE_THUMBNAIL", pipeline.thumbnailPrompt, {
    prompt: pipeline.thumbnailPrompt,
  });

  const completeEpisode = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      series: true,
      productionAssets: true,
      scenes: {
        include: { shots: true },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });

  return { episode: completeEpisode, heroObject, sceneCount: sceneTemplates.length };
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
    input.chefWardrobeOverride || series.defaultChefWardrobe || DEFAULT_WARDROBE;

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

  const persisted = await persistEpisodeProduction({
    ownerId,
    project: newProject,
    seriesTitle: series.title,
    leadChar,
    wardrobe,
    studioEnvironment,
    dishName: input.dishName,
    comparisonTable: input.comparisonTable,
    replaceExistingScenes: false,
  });

  return {
    episode: persisted.episode,
    heroObject: persisted.heroObject,
    nextEpisodeNumber,
  };
}

/**
 * Rebuilds an already-open episode's scenes, shot prompts, and screenplay artifacts
 * IN-PLACE when the user alters its dish, steps, or comparison table via AI Director.
 * Avoids spawning duplicate project records and preserves the active episode & chat thread.
 */
export async function reviseSeriesEpisodeInPlace(input: ReviseSeriesEpisodeInput) {
  const { ownerId, projectId } = input;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      series: true,
      productionAssets: { where: { assetType: "CHARACTER" } },
    },
  });

  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.title?.trim() ? { title: input.title.trim() } : {}),
      sourceIdea: input.sourceIdea,
      ...(input.targetRuntime ? { targetRuntime: input.targetRuntime } : {}),
    },
  });

  const leadChar = project.productionAssets[0] ?? {
    name: "The Shadow Alchemist",
    description:
      "An athletic male artisan culinary alchemist with intense hazel eyes, swept dark tousled hair, brass vintage tinker goggles, and a matte-black tactical half-mask with vertical gold cheekline slit vents.",
    attributes: "{}",
  };

  let wardrobe = project.chefWardrobeOverride || DEFAULT_WARDROBE;
  try {
    const attrs = JSON.parse(leadChar.attributes || "{}");
    if (attrs.wardrobeLock || attrs.wardrobe) {
      wardrobe = attrs.wardrobeLock || attrs.wardrobe;
    }
  } catch {}

  const studioEnvironment =
    project.studioEnvironment ||
    project.series?.defaultStudioEnvironment ||
    "Dark Walnut End-Grain Butcher Block";

  const persisted = await persistEpisodeProduction({
    ownerId,
    project: updatedProject,
    seriesTitle: project.series?.title || "The Shadow Alchemist — Inedible ASMR",
    leadChar,
    wardrobe,
    studioEnvironment,
    dishName: input.dishName,
    comparisonTable: input.comparisonTable,
    replaceExistingScenes: true,
  });

  return {
    episode: persisted.episode,
    heroObject: persisted.heroObject,
    sceneCount: persisted.sceneCount,
  };
}
