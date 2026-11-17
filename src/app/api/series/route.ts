import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const createSeriesSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/i, "Slug must be alphanumeric and dashes only"),
  description: z.string().max(2000).optional(),
  visualStyle: z.string().default("CULINARY_MACRO_ASMR"),
  genre: z.string().default("Culinary & Cooking ASMR"),
  tone: z.string().default("Satisfying, Crisp & Hypnotic"),
  dialogueMode: z.string().default("PURE_ASMR_FOLEY"),
  aspectRatio: z.string().default("PORTRAIT_9_16"),
  targetRuntime: z.number().int().min(15).max(7200).default(20),
  storyLanguage: z.string().default("en"),
  defaultStudioEnvironment: z.string().max(500).optional(),
  defaultChefWardrobe: z.string().max(500).optional(),
});

export const GET = apiHandler(async () => {
  const ownerId = await requireUserId();
  const seriesList = await prisma.series.findMany({
    where: { ownerId },
    include: {
      episodes: {
        select: {
          id: true,
          title: true,
          episodeNumber: true,
          status: true,
          currentStage: true,
          studioEnvironment: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { episodeNumber: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { series: seriesList };
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const body = await req.json();
  const parsed = createSeriesSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid series data", parsed.error.issues);
  }

  const existing = await prisma.series.findFirst({
    where: { ownerId, slug: parsed.data.slug.toLowerCase() },
  });
  if (existing) {
    throw badRequest(`A series with slug "${parsed.data.slug}" already exists.`);
  }

  const series = await prisma.series.create({
    data: {
      ownerId,
      title: parsed.data.title,
      slug: parsed.data.slug.toLowerCase(),
      description: parsed.data.description,
      visualStyle: parsed.data.visualStyle,
      genre: parsed.data.genre,
      tone: parsed.data.tone,
      dialogueMode: parsed.data.dialogueMode,
      aspectRatio: parsed.data.aspectRatio,
      targetRuntime: parsed.data.targetRuntime,
      storyLanguage: parsed.data.storyLanguage,
      defaultStudioEnvironment: parsed.data.defaultStudioEnvironment,
      defaultChefWardrobe: parsed.data.defaultChefWardrobe,
    },
    include: { episodes: true },
  });

  return { ok: true, series };
});
