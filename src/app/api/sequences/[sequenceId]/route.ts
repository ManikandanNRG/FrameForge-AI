import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { TimelineSchema, validateTimeline } from "@/lib/edit/timeline";

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { sequenceId } = await ctx.params;
  const seq = await prisma.editSequence.findUnique({
    where: { id: sequenceId as string },
    include: { project: true },
  });
  if (!seq) throw notFound();
  if (seq.project.ownerId !== ownerId) throw forbidden();
  return { sequence: seq };
});

const patchSchema = z.object({
  name:         z.string().optional(),
  timelineJson: z.string().optional(),
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { sequenceId } = await ctx.params;
  const seq = await prisma.editSequence.findUnique({ where: { id: sequenceId as string }, include: { project: true } });
  if (!seq) throw notFound();
  if (seq.project.ownerId !== ownerId) throw forbidden();

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid body");

  // Validate timeline JSON if provided
  if (parsed.data.timelineJson) {
    const tl = TimelineSchema.safeParse(JSON.parse(parsed.data.timelineJson));
    if (!tl.success) throw badRequest("Invalid timeline schema", tl.error.issues);
    const { errors } = validateTimeline(tl.data);
    if (errors.length) throw badRequest("Timeline validation failed", errors);
  }

  const updated = await prisma.editSequence.update({
    where: { id: sequenceId as string },
    data: {
      name: parsed.data.name,
      timelineJson: parsed.data.timelineJson,
    },
  });
  return { sequence: updated };
});
