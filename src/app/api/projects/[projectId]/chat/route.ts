import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
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
  const parsed = postSchema.safeParse(body);
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

  if (!parsed.data.message) {
    throw badRequest("Message cannot be empty");
  }

  const result = await handleDirectorChat({
    scope: "PROJECT",
    projectId: projectId as string,
    threadId: parsed.data.threadId,
    ownerId,
    userMessage: parsed.data.message,
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
    qcReport: result.qcReport,
    createdEpisode: result.createdEpisode,
    proposedEpisodePlan: result.proposedEpisodePlan,
  };
});
