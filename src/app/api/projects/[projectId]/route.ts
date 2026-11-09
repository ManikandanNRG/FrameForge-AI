import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const updateSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  description:  z.string().max(2000).optional(),
  sourceIdea:   z.string().min(1).max(5000).optional(),
  genre:        z.string().max(100).optional(),
  tone:         z.string().max(100).optional(),
  visualStyle:  z.string().optional(),
  dialogueMode: z.enum(["DIALOGUE", "VOICEOVER", "NO_DIALOGUE"]).optional(),
  targetRuntime: z.number().int().min(15).max(7200).optional(),
  aspectRatio:  z.string().optional(),
  audience:     z.string().max(200).optional(),
  storyLanguage: z.string().max(20).optional(),
});

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();
  return { project };
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid update", parsed.error.issues);

  const updated = await prisma.project.update({
    where: { id: projectId as string },
    data:  parsed.data,
  });
  return { project: updated };
});

export const DELETE = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();
  await prisma.project.delete({ where: { id: projectId as string } });
  return { ok: true };
});
