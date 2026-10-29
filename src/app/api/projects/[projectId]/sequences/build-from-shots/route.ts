import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { emptyTimeline, secondsToFrames } from "@/lib/edit/timeline";
import type { TimelineItem } from "@/lib/edit/timeline";
import { nanoid } from "nanoid";

/**
 * POST /api/projects/[projectId]/sequences/build-from-shots
 * Assembles an EditSequence timeline from all shots that have an approved
 * (or draft) VIDEO_CLIP, ordered by scene and shot number.
 */
export const POST = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  // Get all shots with their latest VIDEO_CLIP, in order
  const scenes = await prisma.scene.findMany({
    where: { projectId: projectId as string },
    include: {
      shots: {
        include: {
          mediaVersions: {
            where: { kind: "VIDEO_CLIP" },
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
        orderBy: { shotNumber: "asc" },
      },
    },
    orderBy: { sceneNumber: "asc" },
  });

  // Flatten shots that have a video clip
  const clipsInOrder = scenes
    .flatMap((sc) => sc.shots)
    .filter((sh) => sh.mediaVersions.length > 0)
    .map((sh) => ({ shot: sh, clip: sh.mediaVersions[0]! }));

  if (clipsInOrder.length === 0) {
    throw badRequest("No video clips found. Import or generate video clips for your shots first.");
  }

  const fps = 24;
  const width = project.aspectRatio === "PORTRAIT_9_16" ? 1080 : 1920;
  const height = project.aspectRatio === "PORTRAIT_9_16" ? 1920 : 1080;

  const timeline = emptyTimeline(fps, width, height);

  let cursorFrames = 0;
  const videoItems: TimelineItem[] = [];

  for (const { shot, clip } of clipsInOrder) {
    const durationSecs = clip.durationSeconds ?? shot.targetDurationSeconds ?? 5;
    const durationFrames = secondsToFrames(durationSecs, fps);

    videoItems.push({
      id: nanoid(),
      mediaId: clip.id,
      storagePath: clip.storagePath,
      timelineStartFrames: cursorFrames,
      sourceInFrames: 0,
      sourceOutFrames: durationFrames,
      layer: 0,
      transitionIn: null,
      transitionOut: null,
      transitionDurationFrames: 0,
      volume: 1,
      label: `Scene ${shot.shotNumber} Shot ${shot.shotNumber}`,
    });

    cursorFrames += durationFrames;
  }

  // Replace video track items
  const trackIdx = timeline.tracks.findIndex((t) => t.type === "VIDEO");
  if (trackIdx >= 0) timeline.tracks[trackIdx]!.items = videoItems;

  // Upsert the edit sequence
  const existing = await prisma.editSequence.findFirst({
    where: { projectId: projectId as string },
    orderBy: { createdAt: "desc" },
  });

  let seq;
  if (existing) {
    seq = await prisma.editSequence.update({
      where: { id: existing.id },
      data: { timelineJson: JSON.stringify(timeline), frameRate: fps, width, height },
    });
  } else {
    seq = await prisma.editSequence.create({
      data: {
        projectId: projectId as string,
        name: "Main sequence",
        frameRate: fps,
        width,
        height,
        timelineJson: JSON.stringify(timeline),
      },
    });
  }

  await prisma.project.update({
    where: { id: projectId as string },
    data: { currentStage: "EDITING" },
  });

  return {
    sequenceId: seq.id,
    clipsAdded: videoItems.length,
    totalDurationSeconds: cursorFrames / fps,
  };
});
