import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { requireUserId } from "@/lib/auth/session";
import { createSeriesEpisode } from "@/lib/series/episode-service";

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

  const body = await req.json();
  const parsed = createEpisodeSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid episode data", parsed.error.issues);
  }

  const { episode } = await createSeriesEpisode({
    ownerId,
    seriesId: seriesId as string,
    title: parsed.data.title,
    sourceIdea: parsed.data.sourceIdea,
    description: parsed.data.description,
    studioEnvironment: parsed.data.studioEnvironment,
    chefWardrobeOverride: parsed.data.chefWardrobeOverride,
    targetRuntime: parsed.data.targetRuntime ?? parsed.data.runtimeSeconds,
    storyLanguage: parsed.data.storyLanguage,
    aspectRatio: parsed.data.aspectRatio,
    visualStyle: parsed.data.visualStyle,
    genre: parsed.data.genre,
    tone: parsed.data.tone,
    dialogueMode: parsed.data.dialogueMode,
  });

  return { ok: true, episode };
});
