import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
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

/**
 * GET /api/chat?threadId=...
 * Returns saved Studio-level chat threads and the active thread's persistent message history.
 */
export const GET = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const { searchParams } = new URL(req.url);
  const requestedThreadId = searchParams.get("threadId") || undefined;

  const activeThread = await resolveOrCreateDirectorThread({
    ownerId,
    scope: "STUDIO",
    threadId: requestedThreadId,
  });

  const [messages, threads] = await Promise.all([
    loadFormattedThreadMessages(activeThread.id),
    listDirectorThreads({ ownerId, scope: "STUDIO" }),
  ]);

  return {
    scope: "STUDIO",
    threadId: activeThread.id,
    threadTitle: activeThread.title,
    threads,
    messages,
  };
});

/**
 * POST /api/chat
 * Handles Studio-level AI Director messages as well as New Thread / Delete Thread management.
 */
export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const body = await req.json().catch(() => ({}));
  const parsed = chatPostSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid chat request", parsed.error.issues);
  }

  if (parsed.data.action === "create_thread") {
    const created = await createNewDirectorThread({
      ownerId,
      scope: "STUDIO",
      title: parsed.data.title,
    });
    const threads = await listDirectorThreads({ ownerId, scope: "STUDIO" });
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
        scope: "STUDIO",
      },
    });
    const nextActive = await resolveOrCreateDirectorThread({
      ownerId,
      scope: "STUDIO",
    });
    const [messages, threads] = await Promise.all([
      loadFormattedThreadMessages(nextActive.id),
      listDirectorThreads({ ownerId, scope: "STUDIO" }),
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
    scope: "STUDIO",
    threadId: parsed.data.threadId,
    ownerId,
    userMessage: messageText,
    attachments: parsed.data.attachments,
    approvePlan: parsed.data.approvePlan,
  });

  const threads = await listDirectorThreads({ ownerId, scope: "STUDIO" });

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
