import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const updateSeriesSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  visualStyle: z.string().optional(),
  genre: z.string().max(100).optional(),
  tone: z.string().max(100).optional(),
  dialogueMode: z.string().optional(),
  aspectRatio: z.string().optional(),
  targetRuntime: z.number().int().min(15).max(7200).optional(),
  storyLanguage: z.string().max(20).optional(),
  defaultStudioEnvironment: z.string().max(500).optional(),
  defaultChefWardrobe: z.string().max(500).optional(),
});

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { seriesId } = await ctx.params;
  const series = await prisma.series.findUnique({
    where: { id: seriesId as string },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
      },
    },
  });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  return { series };
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { seriesId } = await ctx.params;
  const series = await prisma.series.findUnique({ where: { id: seriesId as string } });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  const parsed = updateSeriesSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid series update", parsed.error.issues);

  const updated = await prisma.series.update({
    where: { id: seriesId as string },
    data: parsed.data,
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
      },
    },
  });

  return { ok: true, series: updated };
});

export const DELETE = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { seriesId } = await ctx.params;
  const series = await prisma.series.findUnique({ where: { id: seriesId as string } });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  await prisma.series.delete({ where: { id: seriesId as string } });
  return { ok: true, deletedId: seriesId };
});
