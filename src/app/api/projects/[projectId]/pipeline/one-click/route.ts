import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { generateStory } from "@/lib/story/service";
import { extractBible } from "@/lib/bible/service";
import { generateShotPlan } from "@/lib/shots/service";
import type { ProjectBrief } from "@/lib/story/prompts";
import { logger } from "@/lib/logger";

const oneClickSchema = z.object({
  useMock: z.boolean().optional(),
  autoGenerateVideos: z.boolean().optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = oneClickSchema.safeParse(await req.json().catch(() => ({})));
  const { useMock = false, autoGenerateVideos = false } = parsed.success ? parsed.data : {};

  logger.info({ projectId, useMock, autoGenerateVideos }, "starting 1-click full studio pipeline");

  const { provider, modelId } = await resolveTextProvider(ownerId, useMock);

  // Step 1: Generate Full Story & Screenplay
  const brief: ProjectBrief = {
    title: project.title,
    sourceIdea: project.sourceIdea,
    genre: project.genre ?? undefined,
    tone: project.tone ?? undefined,
    visualStyle: project.visualStyle,
    dialogueMode: project.dialogueMode,
    targetRuntimeMinutes: Math.max(1, Math.round((project.targetRuntime || 60) / 60)),
    targetRuntimeSeconds: project.targetRuntime || 60,
    audience: project.audience ?? undefined,
    storyLanguage: project.storyLanguage || "Tamil",
  };

  const storyJobId = `story-1click-${Date.now()}`;
  await generateStory(provider, modelId, projectId as string, brief, storyJobId);

  // Approve screenplay automatically for frictionless pipeline
  const screenplayArtifact = await prisma.storyArtifact.findFirst({
    where: { projectId: projectId as string, artifactType: "SCREENPLAY" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (screenplayArtifact) {
    await prisma.storyArtifact.update({
      where: { id: screenplayArtifact.id },
      data: { approvalStatus: "APPROVED" },
    });
  }
  const screenplayText = screenplayArtifact?.versions[0]?.contentText ?? "";

  // Step 2: Extract Production Bible (Characters, Locations, Props with Google Flow prompts)
  const bibleJobId = `bible-1click-${Date.now()}`;
  await extractBible(provider, modelId, projectId as string, screenplayText, bibleJobId);

  // Approve all extracted characters
  await prisma.productionAsset.updateMany({
    where: { projectId: projectId as string },
    data: { approvalStatus: "APPROVED" },
  });

  // Step 3: Plan Shots with [@CharacterName] tags and full production specs
  await generateShotPlan(provider, modelId, projectId as string, screenplayText);

  // Update project stage
  await prisma.project.update({
    where: { id: projectId as string },
    data: { currentStage: "STORYBOARD", status: "ACTIVE" },
  });

  // Query results summary
  const [scenes, characters] = await Promise.all([
    prisma.scene.findMany({
      where: { projectId: projectId as string },
      include: { shots: true },
    }),
    prisma.productionAsset.findMany({
      where: { projectId: projectId as string, assetType: "CHARACTER" },
    }),
  ]);

  const shotsCount = scenes.reduce((acc, s) => acc + s.shots.length, 0);

  // Optional: Auto-queue video generation if requested
  let queuedVideosCount = 0;
  if (autoGenerateVideos && shotsCount > 0) {
    const videoRes = await fetch(`http://localhost:3000/api/projects/${projectId}/shots/generate-videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true, useLocalMotion: true }),
    }).catch(() => null);
    if (videoRes && videoRes.ok) {
      const vd = await videoRes.json();
      queuedVideosCount = vd.data?.queued ?? 0;
    }
  }

  logger.info({ projectId, scenesCount: scenes.length, shotsCount, charactersCount: characters.length }, "1-click pipeline completed successfully");

  return {
    ok: true,
    stage: "STORYBOARD",
    scenesCount: scenes.length,
    shotsCount,
    charactersCount: characters.length,
    queuedVideosCount,
  };
});

