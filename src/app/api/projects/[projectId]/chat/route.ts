import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { handleDirectorChat } from "@/lib/story/chat-director";
import {
  chatPostSchema,
  createNewDirectorThread,
  listDirectorThreads,
  loadFormattedThreadMessages,
  resolveOrCreateDirectorThread,
} from "@/lib/story/director-memory";

export const GET = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const requestedThreadId = searchParams.get("threadId") || undefined;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    select: { id: true, ownerId: true, title: true },
  });

  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const activeThread = await resolveOrCreateDirectorThread({
    ownerId,
    scope: "PROJECT",
    projectId: project.id,
    threadId: requestedThreadId,
  });

  const [messages, threads] = await Promise.all([
    loadFormattedThreadMessages(activeThread.id),
    listDirectorThreads({ ownerId, scope: "PROJECT", projectId: project.id }),
  ]);

  return {
    projectId: project.id,
    projectTitle: project.title,
    threadId: activeThread.id,
    threadTitle: activeThread.title,
    threads,
    messages,
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
  const parsed = chatPostSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid chat message", parsed.error.issues);
  }

  if (parsed.data.action === "create_thread") {
    const created = await createNewDirectorThread({
      ownerId,
      scope: "PROJECT",
      projectId: projectId as string,
      title: parsed.data.title,
    });
    const threads = await listDirectorThreads({
      ownerId,
      scope: "PROJECT",
      projectId: projectId as string,
    });
    return {
      success: true,
      threadId: created.id,
      threadTitle: created.title,
      threads,
      messages: [],
    };
  }

  if (parsed.data.action === "delete_thread" && parsed.data.threadId) {
    await prisma.directorThread.deleteMany({
      where: {
        id: parsed.data.threadId,
        ownerId,
        scope: "PROJECT",
        projectId: projectId as string,
      },
    });
    const nextActive = await resolveOrCreateDirectorThread({
      ownerId,
      scope: "PROJECT",
      projectId: projectId as string,
    });
    const [messages, threads] = await Promise.all([
      loadFormattedThreadMessages(nextActive.id),
      listDirectorThreads({ ownerId, scope: "PROJECT", projectId: projectId as string }),
    ]);
    return {
      success: true,
      threadId: nextActive.id,
      threadTitle: nextActive.title,
      threads,
      messages,
    };
  }

  const hasAttachments = Boolean(parsed.data.attachments && parsed.data.attachments.length > 0);
  const messageText = parsed.data.message?.trim() || (hasAttachments ? "Please inspect this attached screenshot and advise how to fix it." : "");

  if (!messageText) {
    throw badRequest("Message or screenshot attachment is required");
  }

  const result = await handleDirectorChat({
    scope: "PROJECT",
    projectId: projectId as string,
    threadId: parsed.data.threadId,
    ownerId,
    userMessage: messageText,
    attachments: parsed.data.attachments,
    approvePlan: parsed.data.approvePlan,
  });

  const threads = await listDirectorThreads({
    ownerId,
    scope: "PROJECT",
    projectId: projectId as string,
  });

  return {
    success: true,
    threadId: result.threadId,
    threads,
    reply: result.reply,
    actionsTaken: result.actionsTaken,
    userAttachments: result.userAttachments,
    qcReport: result.qcReport,
    createdEpisode: result.createdEpisode,
    proposedEpisodePlan: result.proposedEpisodePlan,
  };
});
