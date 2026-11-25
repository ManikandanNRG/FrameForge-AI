import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { handleDirectorChat } from "@/lib/story/chat-director";
import {
  createNewDirectorThread,
  listDirectorThreads,
  loadFormattedThreadMessages,
  resolveOrCreateDirectorThread,
} from "@/lib/story/director-memory";

const approvePlanSchema = z.object({
  episodeNumber: z.coerce.number(),
  title: z.string().min(1),
  sourceIdea: z.string().min(1),
  dishName: z.string().default("Custom ASMR Dish"),
  targetRuntime: z.coerce.number().default(20),
  comparisonTable: z
    .array(
      z.object({
        realElement: z.string(),
        inedibleCounterpart: z.string(),
        cookingMethod: z.string(),
      })
    )
    .optional(),
});

const postSchema = z.object({
  action: z.enum(["message", "create_thread", "delete_thread"]).optional(),
  threadId: z.string().optional(),
  title: z.string().max(120).optional(),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long").optional(),
  approvePlan: approvePlanSchema.optional(),
});

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
  const parsed = postSchema.safeParse(body);
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

  if (!parsed.data.message) {
    throw badRequest("Message cannot be empty");
  }

  const result = await handleDirectorChat({
    scope: "STUDIO",
    threadId: parsed.data.threadId,
    ownerId,
    userMessage: parsed.data.message,
    approvePlan: parsed.data.approvePlan,
  });

  const threads = await listDirectorThreads({ ownerId, scope: "STUDIO" });

  return {
    success: true,
    threadId: result.threadId,
    threads,
    reply: result.reply,
    actionsTaken: result.actionsTaken,
    qcReport: result.qcReport,
    createdEpisode: result.createdEpisode,
    proposedEpisodePlan: result.proposedEpisodePlan,
  };
});
