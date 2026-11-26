import { prisma } from "@/lib/db/client";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type {
  CreatedEpisodeLink,
  DirectorAction,
  ProposedEpisodePlan,
} from "./chat-director";

export type ThreadScope = "STUDIO" | "PROJECT";

export const RECENT_MESSAGE_LIMIT = 16;

export const chatApprovePlanSchema = z.object({
  episodeNumber: z.coerce.number(),
  title: z.string().min(1),
  sourceIdea: z.string().min(1),
  dishName: z.string().default("Custom ASMR Dish"),
  targetRuntime: z.coerce.number().default(20),
  mode: z.enum(["CREATE_NEW", "REVISE_CURRENT"]).optional(),
  targetProjectId: z.string().optional(),
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

export const chatPostSchema = z.object({
  action: z.enum(["message", "create_thread", "delete_thread"]).optional(),
  threadId: z.string().optional(),
  title: z.string().max(120).optional(),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long").optional(),
  approvePlan: chatApprovePlanSchema.optional(),
});

export interface FormattedChatMessageDto {
  id: string;
  sender: string;
  message: string;
  actionsTaken: DirectorAction[];
  proposedEpisodePlan?: ProposedEpisodePlan;
  proposalStatus?: "PENDING" | "APPROVED" | "SUPERSEDED";
  createdEpisode?: CreatedEpisodeLink;
  createdAt: string;
}

export interface DirectorThreadSummaryDto {
  id: string;
  scope: ThreadScope;
  title: string;
  projectId: string | null;
  seriesId: string | null;
  messageCount: number;
  updatedAt: string;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function assertDirectorClientReady() {
  if (!(prisma as unknown as { directorThread?: unknown }).directorThread) {
    throw new Error(
      "Chat tables updated in database — please restart your app server (Ctrl+C, then run `npm run dev`) so Prisma loads the new history models."
    );
  }
}

/**
 * Formats an existing DB DirectorMessage row into the API / UI message shape,
 * restoring tables, proposal cards, proposal statuses, and createdEpisode links.
 */
export function serializeDirectorMessage(m: {
  id: string;
  sender: string;
  message: string;
  actionsTaken: string | null;
  proposedEpisodePlan: string | null;
  proposalStatus: string | null;
  createdEpisodeJson: string | null;
  createdAt: Date;
}): FormattedChatMessageDto {
  const actionsTaken = safeJsonParse<DirectorAction[]>(m.actionsTaken, []);
  let proposedEpisodePlan = safeJsonParse<ProposedEpisodePlan | undefined>(
    m.proposedEpisodePlan,
    undefined
  );

  if (!proposedEpisodePlan && actionsTaken.length > 0) {
    const found = actionsTaken.find(
      (a) => a.type === "PROPOSE_EPISODE" && a.proposedEpisodePlan
    );
    if (found?.proposedEpisodePlan) {
      proposedEpisodePlan = found.proposedEpisodePlan;
    }
  }

  const createdEpisode = safeJsonParse<CreatedEpisodeLink | undefined>(
    m.createdEpisodeJson,
    undefined
  );

  const proposalStatus =
    (m.proposalStatus as "PENDING" | "APPROVED" | "SUPERSEDED" | null) ??
    (proposedEpisodePlan ? (createdEpisode ? "APPROVED" : "PENDING") : undefined);

  return {
    id: m.id,
    sender: m.sender,
    message: m.message,
    actionsTaken,
    proposedEpisodePlan,
    proposalStatus,
    createdEpisode,
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * Lazily imports legacy ProjectChatMessage records into a PROJECT-scoped
 * DirectorThread so prior episode conversations never disappear after upgrade.
 */
async function backfillLegacyProjectMessages(threadId: string, projectId: string) {
  const existingCount = await prisma.directorMessage.count({ where: { threadId } });
  if (existingCount > 0) return;

  const legacyMessages = await prisma.projectChatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  if (legacyMessages.length === 0) return;

  for (const lm of legacyMessages) {
    const actions = safeJsonParse<DirectorAction[]>(lm.actionsTaken, []);
    const propAction = actions.find(
      (a) => a.type === "PROPOSE_EPISODE" && a.proposedEpisodePlan
    );
    await prisma.directorMessage.create({
      data: {
        threadId,
        sender: lm.sender,
        message: lm.message,
        actionsTaken: lm.actionsTaken,
        proposedEpisodePlan: propAction?.proposedEpisodePlan
          ? JSON.stringify(propAction.proposedEpisodePlan)
          : null,
        proposalStatus: propAction?.proposedEpisodePlan ? "PENDING" : null,
        createdAt: lm.createdAt,
      },
    });
  }
}

/**
 * When a PROJECT-scoped thread is empty (e.g. a newly created episode or a revised clone),
 * traces backward along `createdEpisodeJson` references to inherit the exact planning
 * discussion, comparison tables, and approval trail into the episode's own chat drawer.
 */
export async function inheritOriginPlanningHistory({
  targetThreadId,
  projectId,
  ownerId,
}: {
  targetThreadId: string;
  projectId: string;
  ownerId: string;
}) {
  const existingCount = await prisma.directorMessage.count({
    where: { threadId: targetThreadId },
  });
  if (existingCount > 0) return;

  const visitedThreadIds = new Set<string>([targetThreadId]);
  const segments: Array<
    Array<{
      sender: string;
      message: string;
      actionsTaken: string | null;
      proposedEpisodePlan: string | null;
      proposalStatus: string | null;
      createdEpisodeJson: string | null;
      createdAt: Date;
    }>
  > = [];
  let inheritedMemorySummary: string | null = null;
  let inheritedPinnedDecisions: string | null = null;
  let currentProjectId = projectId;

  for (let hop = 0; hop < 4; hop++) {
    const originMsg = await prisma.directorMessage.findFirst({
      where: {
        thread: { ownerId },
        createdEpisodeJson: { contains: `"${currentProjectId}"` },
      },
      include: {
        thread: {
          select: {
            id: true,
            scope: true,
            projectId: true,
            memorySummary: true,
            pinnedDecisions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!originMsg || visitedThreadIds.has(originMsg.threadId)) break;
    visitedThreadIds.add(originMsg.threadId);

    const threadMessages = await prisma.directorMessage.findMany({
      where: {
        threadId: originMsg.threadId,
        createdAt: { lte: originMsg.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: {
        sender: true,
        message: true,
        actionsTaken: true,
        proposedEpisodePlan: true,
        proposalStatus: true,
        createdEpisodeJson: true,
        createdAt: true,
      },
    });

    if (threadMessages.length > 0) {
      segments.unshift(threadMessages);
    }

    if (!inheritedMemorySummary && originMsg.thread.memorySummary) {
      inheritedMemorySummary = originMsg.thread.memorySummary;
    }
    if (!inheritedPinnedDecisions && originMsg.thread.pinnedDecisions) {
      inheritedPinnedDecisions = originMsg.thread.pinnedDecisions;
    }

    if (originMsg.thread.scope === "PROJECT" && originMsg.thread.projectId) {
      currentProjectId = originMsg.thread.projectId;
    } else {
      break;
    }
  }

  const flattened = segments.flat();
  if (flattened.length === 0) return;

  // Keep unique turns in chronological order
  const seen = new Set<string>();
  for (const m of flattened) {
    const dedupKey = `${m.sender}::${m.message}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    await prisma.directorMessage.create({
      data: {
        threadId: targetThreadId,
        sender: m.sender,
        message: m.message,
        actionsTaken: m.actionsTaken,
        proposedEpisodePlan: m.proposedEpisodePlan,
        proposalStatus: m.proposedEpisodePlan ? "APPROVED" : m.proposalStatus,
        createdEpisodeJson: m.createdEpisodeJson,
        createdAt: m.createdAt,
      },
    });
  }

  if (inheritedMemorySummary || inheritedPinnedDecisions) {
    await prisma.directorThread.update({
      where: { id: targetThreadId },
      data: {
        ...(inheritedMemorySummary ? { memorySummary: inheritedMemorySummary } : {}),
        ...(inheritedPinnedDecisions ? { pinnedDecisions: inheritedPinnedDecisions } : {}),
      },
    });
  }
}

/**
 * Resolves an existing DirectorThread (or creates the default thread for STUDIO or PROJECT scope).
 */
export async function resolveOrCreateDirectorThread({
  ownerId,
  scope,
  threadId,
  projectId,
  seriesId,
}: {
  ownerId: string;
  scope: ThreadScope;
  threadId?: string;
  projectId?: string;
  seriesId?: string;
}) {
  assertDirectorClientReady();
  if (threadId) {
    const existing = await prisma.directorThread.findFirst({
      where: {
        id: threadId,
        ownerId,
        ...(scope === "PROJECT" && projectId ? { projectId } : {}),
      },
    });
    if (existing) {
      if (scope === "PROJECT" && projectId) {
        await backfillLegacyProjectMessages(existing.id, projectId);
        await inheritOriginPlanningHistory({
          targetThreadId: existing.id,
          projectId,
          ownerId,
        });
      }
      return existing;
    }
  }

  if (scope === "PROJECT" && projectId) {
    const projectThread = await prisma.directorThread.findFirst({
      where: { ownerId, scope: "PROJECT", projectId },
      orderBy: { updatedAt: "desc" },
    });
    if (projectThread) {
      await backfillLegacyProjectMessages(projectThread.id, projectId);
      await inheritOriginPlanningHistory({
        targetThreadId: projectThread.id,
        projectId,
        ownerId,
      });
      return projectThread;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true, seriesId: true },
    });

    const created = await prisma.directorThread.create({
      data: {
        ownerId,
        scope: "PROJECT",
        projectId,
        seriesId: project?.seriesId ?? seriesId ?? null,
        title: project?.title ? `${project.title} — Director Chat` : "Episode Chat",
      },
    });
    await backfillLegacyProjectMessages(created.id, projectId);
    await inheritOriginPlanningHistory({
      targetThreadId: created.id,
      projectId,
      ownerId,
    });
    return created;
  }

  // STUDIO scope
  const studioThread = await prisma.directorThread.findFirst({
    where: { ownerId, scope: "STUDIO" },
    orderBy: { updatedAt: "desc" },
  });
  if (studioThread) return studioThread;

  const defaultSeries =
    seriesId ??
    (
      await prisma.series.findFirst({
        where: { ownerId },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      })
    )?.id ??
    null;

  return prisma.directorThread.create({
    data: {
      ownerId,
      scope: "STUDIO",
      seriesId: defaultSeries,
      title: "Studio Episode Planning",
    },
  });
}

export async function createNewDirectorThread({
  ownerId,
  scope,
  title,
  projectId,
  seriesId,
}: {
  ownerId: string;
  scope: ThreadScope;
  title?: string;
  projectId?: string;
  seriesId?: string;
}) {
  const resolvedSeriesId =
    seriesId ??
    (projectId
      ? (
          await prisma.project.findUnique({
            where: { id: projectId },
            select: { seriesId: true },
          })
        )?.seriesId
      : (
          await prisma.series.findFirst({
            where: { ownerId },
            orderBy: { updatedAt: "desc" },
            select: { id: true },
          })
        )?.id) ??
    null;

  return prisma.directorThread.create({
    data: {
      ownerId,
      scope,
      projectId: scope === "PROJECT" ? projectId ?? null : null,
      seriesId: resolvedSeriesId,
      title:
        title?.trim() ||
        (scope === "STUDIO" ? "New Studio Planning Chat" : "New Episode Chat"),
    },
  });
}

export async function listDirectorThreads({
  ownerId,
  scope,
  projectId,
}: {
  ownerId: string;
  scope: ThreadScope;
  projectId?: string;
}): Promise<DirectorThreadSummaryDto[]> {
  assertDirectorClientReady();
  const threads = await prisma.directorThread.findMany({
    where: {
      ownerId,
      scope,
      ...(scope === "PROJECT" && projectId ? { projectId } : {}),
    },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });

  return threads.map((t) => ({
    id: t.id,
    scope: (t.scope as ThreadScope) || scope,
    title: t.title,
    projectId: t.projectId,
    seriesId: t.seriesId,
    messageCount: t._count.messages,
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function loadFormattedThreadMessages(
  threadId: string
): Promise<FormattedChatMessageDto[]> {
  const messages = await prisma.directorMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map(serializeDirectorMessage);
}

/**
 * Generates a readable title from the user's first message when the thread still has its default name.
 */
export function deriveThreadTitleFromMessage(userMessage: string): string {
  const cleaned = userMessage
    .replace(/\s+/g, " ")
    .replace(/[`*_#]/g, "")
    .trim();
  if (cleaned.length <= 44) return cleaned;
  return `${cleaned.slice(0, 41)}...`;
}

/**
 * Persists a user + AI turn into DirectorMessage (and mirrors to legacy ProjectChatMessage when projectId is set),
 * updates thread timestamps & auto-title, and marks approved proposals when an episode is created.
 */
export async function recordDirectorTurn({
  threadId,
  projectId,
  userMessage,
  aiReply,
  executed,
  proposedEpisodePlan,
  createdEpisode,
}: {
  threadId: string;
  projectId?: string | null;
  userMessage: string;
  aiReply: string;
  executed: DirectorAction[];
  proposedEpisodePlan?: ProposedEpisodePlan;
  createdEpisode?: CreatedEpisodeLink;
}) {
  const thread = await prisma.directorThread.findUnique({
    where: { id: threadId },
    include: { _count: { select: { messages: true } } },
  });

  const wasRevisedOrCreated = Boolean(
    createdEpisode || executed.some((a) => a.type === "REVISE_EPISODE")
  );

  if (wasRevisedOrCreated) {
    // Lock any older pending proposals in this thread so stale buttons cannot re-fire on reload
    await prisma.directorMessage.updateMany({
      where: {
        threadId,
        proposalStatus: "PENDING",
      },
      data: { proposalStatus: "APPROVED" },
    });
  } else if (proposedEpisodePlan) {
    // Supersede older pending proposals when a revised plan is offered
    await prisma.directorMessage.updateMany({
      where: {
        threadId,
        proposalStatus: "PENDING",
      },
      data: { proposalStatus: "SUPERSEDED" },
    });
  }

  await prisma.directorMessage.create({
    data: {
      threadId,
      sender: "USER",
      message: userMessage,
    },
  });

  await prisma.directorMessage.create({
    data: {
      threadId,
      sender: "AI_DIRECTOR",
      message: aiReply,
      actionsTaken: JSON.stringify(executed),
      proposedEpisodePlan: proposedEpisodePlan
        ? JSON.stringify(proposedEpisodePlan)
        : null,
      proposalStatus: proposedEpisodePlan
        ? wasRevisedOrCreated
          ? "APPROVED"
          : "PENDING"
        : null,
      createdEpisodeJson: createdEpisode ? JSON.stringify(createdEpisode) : null,
    },
  });

  const isDefaultTitle =
    !thread ||
    thread.title === "Studio Episode Planning" ||
    thread.title === "New Studio Planning Chat" ||
    thread.title === "Episode Chat" ||
    thread.title === "New Episode Chat";

  await prisma.directorThread.update({
    where: { id: threadId },
    data: {
      ...(isDefaultTitle && (thread?._count.messages ?? 0) === 0
        ? { title: deriveThreadTitleFromMessage(userMessage) }
        : {}),
      updatedAt: new Date(),
    },
  });

  // Backwards-compatible mirror to ProjectChatMessage when chatting inside a specific project
  if (projectId) {
    await prisma.projectChatMessage.createMany({
      data: [
        { projectId, sender: "USER", message: userMessage },
        {
          projectId,
          sender: "AI_DIRECTOR",
          message: aiReply,
          actionsTaken: JSON.stringify(executed),
        },
      ],
    });
  }
}

/**
 * Layer 1 of Context: Live ground-truth catalog of Series & all Episodes owned by the user,
 * preventing cross-episode mix-ups or duplicate dish suggestions.
 */
export async function getSeriesContextCatalog(ownerId: string): Promise<{
  seriesSummary: string;
  nextEpisodeNumber: number;
  latestSeriesId?: string;
}> {
  const [seriesList, projects] = await Promise.all([
    prisma.series.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        visualStyle: true,
        targetRuntime: true,
      },
    }),
    prisma.project.findMany({
      where: { ownerId },
      orderBy: [{ episodeNumber: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        episodeNumber: true,
        targetRuntime: true,
        currentStage: true,
        sourceIdea: true,
        seriesId: true,
      },
    }),
  ]);

  const maxEpNum = projects.reduce(
    (max, p) => Math.max(max, p.episodeNumber ?? 0),
    0
  );

  const lines = projects.map((p) => {
    const epTag = p.episodeNumber ? `Ep ${p.episodeNumber}` : "Standalone";
    const ideaSnippet = (p.sourceIdea || "").replace(/\s+/g, " ").slice(0, 120);
    return `- ${epTag}: "${p.title}" (${p.targetRuntime}s, stage: ${p.currentStage}) — ${ideaSnippet}`;
  });

  const seriesTitle = seriesList[0]?.title || "Default Series";
  const seriesSummary =
    lines.length > 0
      ? `Series: ${seriesTitle}\nExisting Episodes (${lines.length}):\n${lines.join("\n")}`
      : "No episodes created yet.";

  return {
    seriesSummary,
    nextEpisodeNumber: maxEpNum + 1,
    latestSeriesId: seriesList[0]?.id,
  };
}

/**
 * Builds a deterministic fallback summary of older conversation turns when no LLM is called
 * or as a fast baseline before optional LLM compression.
 */
export function buildDeterministicMemoryDigest(
  existingSummary: string | null,
  olderMessages: Array<{ sender: string; message: string; proposedEpisodePlan?: string | null }>
): { memorySummary: string; pinnedDecisions: string[] } {
  const decisionLines: string[] = [];

  for (const m of olderMessages) {
    if (m.proposedEpisodePlan) {
      const plan = safeJsonParse<ProposedEpisodePlan | undefined>(
        m.proposedEpisodePlan,
        undefined
      );
      if (plan?.dishName) {
        decisionLines.push(
          `Ep ${plan.episodeNumber} proposed dish: "${plan.dishName}" (${plan.targetRuntime}s)`
        );
      }
    }
    if (m.sender === "USER") {
      const clean = m.message.replace(/\s+/g, " ").trim();
      if (clean.length > 0) {
        decisionLines.push(`User: ${clean.slice(0, 140)}`);
      }
    }
  }

  const uniqueDecisions = Array.from(new Set(decisionLines)).slice(-8);
  const previous = existingSummary ? `${existingSummary.trim()}\n` : "";
  const combined = `${previous}${uniqueDecisions.map((d) => `• ${d}`).join("\n")}`.trim();
  // Cap rolling digest to ~1,800 chars so system prompt stays compact
  const trimmedSummary =
    combined.length > 1800 ? `...\n${combined.slice(combined.length - 1796)}` : combined;

  return {
    memorySummary: trimmedSummary,
    pinnedDecisions: uniqueDecisions,
  };
}

/**
 * Layer 2 of Context: Compresses turns older than RECENT_MESSAGE_LIMIT into DirectorThread.memorySummary
 * so long-running conversations stay coherent across 50+ turns without exceeding prompt limits.
 */
export async function refreshThreadLongTermMemory({
  threadId,
  ownerId,
  allowLlmSummary = true,
}: {
  threadId: string;
  ownerId: string;
  allowLlmSummary?: boolean;
}) {
  const thread = await prisma.directorThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      memorySummary: true,
      pinnedDecisions: true,
      summarizedCount: true,
    },
  });
  if (!thread) return;

  const allMessages = await prisma.directorMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      sender: true,
      message: true,
      proposedEpisodePlan: true,
    },
  });

  const cutoff = allMessages.length - RECENT_MESSAGE_LIMIT;
  if (cutoff <= thread.summarizedCount || cutoff - thread.summarizedCount < 4) {
    return;
  }

  const newlyAged = allMessages.slice(thread.summarizedCount, cutoff);
  const existingPinned = safeJsonParse<string[]>(thread.pinnedDecisions, []);
  const deterministic = buildDeterministicMemoryDigest(thread.memorySummary, newlyAged);
  let finalSummary = deterministic.memorySummary;
  let finalPinned = Array.from(new Set([...existingPinned, ...deterministic.pinnedDecisions])).slice(-10);

  if (allowLlmSummary) {
    try {
      const { provider, modelId } = await resolveTextProvider(ownerId, false);
      const transcript = newlyAged
        .map((m) => `${m.sender}: ${m.message.slice(0, 300)}`)
        .join("\n");
      const SummarySchema = z.object({
        summary: z.string(),
      });
      const res = await provider.generateStructured({
        systemPrompt:
          'Compress film director chat notes into JSON {"summary": "..."} with 4-6 concise bullets preserving: chosen dishes, comparison decisions, rejected ideas, pacing/runtime targets, and continuity rules (under 900 chars).',
        userPrompt: `Previous summary:\n${thread.memorySummary || "(none)"}\n\nNew turns to fold in:\n${transcript}`,
        schema: SummarySchema,
        modelId,
      });
      if (res?.data?.summary && res.data.summary.trim().length > 20) {
        finalSummary = res.data.summary.trim().slice(0, 1800);
      }
    } catch (err) {
      logger.debug({ err }, "Rolling LLM memory compression skipped; kept deterministic digest");
    }
  }

  await prisma.directorThread.update({
    where: { id: threadId },
    data: {
      memorySummary: finalSummary,
      pinnedDecisions: JSON.stringify(finalPinned),
      summarizedCount: cutoff,
    },
  });
}
