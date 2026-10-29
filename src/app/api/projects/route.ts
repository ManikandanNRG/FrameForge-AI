import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const createSchema = z.object({
  title:         z.string().min(1, "title is required").max(200),
  sourceIdea:    z.string().min(1, "sourceIdea is required"),
  description:   z.string().max(2000).optional(),
  genre:         z.string().max(100).optional(),
  tone:          z.string().max(100).optional(),
  visualStyle:   z.string().optional(),
  dialogueMode:  z.enum(["DIALOGUE", "VOICEOVER", "NO_DIALOGUE"]).optional(),
  targetRuntime: z.number().int().min(30).max(7200).optional(),
  aspectRatio:   z.string().optional(),
  audience:      z.string().max(200).optional(),
  storyLanguage: z.string().max(10).optional(),
});

export const GET = apiHandler(async () => {
  const ownerId = await requireUserId();
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
  return { projects };
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid project", parsed.error.issues);
  const { title, sourceIdea, description, genre, tone, visualStyle, dialogueMode, targetRuntime, aspectRatio, audience, storyLanguage } = parsed.data;

  const project = await prisma.project.create({
    data: { ownerId, title, sourceIdea, description, genre, tone, visualStyle, dialogueMode, targetRuntime, aspectRatio, audience, storyLanguage },
  });
  return { project };
});
