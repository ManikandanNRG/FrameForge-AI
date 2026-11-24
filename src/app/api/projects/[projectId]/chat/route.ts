import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { handleDirectorChat } from "@/lib/story/chat-director";

const postSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
});

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    select: { id: true, ownerId: true, title: true },
  });

  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const messages = await prisma.projectChatMessage.findMany({
    where: { projectId: projectId as string },
    orderBy: { createdAt: "asc" },
  });

  return {
    projectId: project.id,
    projectTitle: project.title,
    messages: messages.map((m) => {
      let actions = [];
      try {
        if (m.actionsTaken) actions = JSON.parse(m.actionsTaken);
      } catch {}
      return {
        id: m.id,
        sender: m.sender,
        message: m.message,
        actionsTaken: actions,
        createdAt: m.createdAt,
      };
    }),
  };
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    select: { id: true, ownerId: true },
  });

  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid chat message", parsed.error.issues);
  }

  const result = await handleDirectorChat({
    projectId: projectId as string,
    ownerId,
    userMessage: parsed.data.message,
  });

  return {
    success: true,
    reply: result.reply,
    actionsTaken: result.actionsTaken,
    qcReport: result.qcReport,
  };
});
