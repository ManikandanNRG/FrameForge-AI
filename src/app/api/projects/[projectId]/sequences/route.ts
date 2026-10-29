import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { TimelineSchema, emptyTimeline } from "@/lib/edit/timeline";

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const sequences = await prisma.editSequence.findMany({
    where: { projectId: projectId as string },
    orderBy: { createdAt: "desc" },
  });
  return { sequences };
});

const createSchema = z.object({
  name:      z.string().optional(),
  frameRate: z.number().optional(),
  width:     z.number().int().optional(),
  height:    z.number().int().optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid body");

  const fps = parsed.data.frameRate ?? 24;
  const w   = parsed.data.width  ?? 1920;
  const h   = parsed.data.height ?? 1080;
  const tl  = emptyTimeline(fps, w, h);

  const seq = await prisma.editSequence.create({
    data: {
      projectId: projectId as string,
      name: parsed.data.name ?? "Main sequence",
      frameRate: fps,
      width: w,
      height: h,
      timelineJson: JSON.stringify(tl),
    },
  });

  await prisma.project.update({ where: { id: projectId as string }, data: { currentStage: "EDITING" } });

  return { sequence: seq };
});
