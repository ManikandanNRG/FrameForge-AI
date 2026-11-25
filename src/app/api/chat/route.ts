import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { handleDirectorChat } from "@/lib/story/chat-director";
import { createSeriesEpisode } from "@/lib/series/episode-service";

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
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  approvePlan: approvePlanSchema.optional(),
});

/**
 * Global AI Director chat endpoint used on /projects, /projects/new, and /settings
 * (when no specific projectId route is active). Delegates to the user's latest project
 * so conversation stays persistent and never creates projects without approval.
 */
export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid chat message", parsed.error.issues);
  }

  const latestProject = await prisma.project.findFirst({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (latestProject) {
    const result = await handleDirectorChat({
      projectId: latestProject.id,
      ownerId,
      userMessage: parsed.data.message,
      approvePlan: parsed.data.approvePlan,
    });
    return {
      success: true,
      reply: result.reply,
      actionsTaken: result.actionsTaken,
      qcReport: result.qcReport,
      createdEpisode: result.createdEpisode,
      proposedEpisodePlan: result.proposedEpisodePlan,
    };
  }

  // Only create when user explicitly clicks Approve on a proposed plan
  if (parsed.data.approvePlan) {
    const series = await prisma.series.create({
      data: {
        ownerId,
        title: "The Shadow Alchemist — Inedible ASMR",
        slug: `inedible-asmr-${Date.now()}`,
        visualStyle: "CULINARY_MACRO_ASMR",
        genre: "Culinary & Cooking ASMR",
        tone: "Satisfying, Crisp & Hypnotic",
        dialogueMode: "PURE_ASMR_FOLEY",
        aspectRatio: "PORTRAIT_9_16",
        targetRuntime: parsed.data.approvePlan.targetRuntime,
        storyLanguage: "English",
      },
    });

    const { episode, nextEpisodeNumber } = await createSeriesEpisode({
      ownerId,
      seriesId: series.id,
      title: parsed.data.approvePlan.title,
      sourceIdea: parsed.data.approvePlan.sourceIdea,
      episodeNumber: parsed.data.approvePlan.episodeNumber,
      targetRuntime: parsed.data.approvePlan.targetRuntime,
    });

    const createdEpisode = episode
      ? {
          id: episode.id,
          title: episode.title,
          episodeNumber: episode.episodeNumber ?? nextEpisodeNumber,
          url: `/projects/${episode.id}/storyboard`,
        }
      : undefined;

    return {
      success: true,
      reply: episode
        ? `Approved! Created **${episode.title}**. Click below to open its Storyboard!`
        : "Created your series.",
      actionsTaken: createdEpisode
        ? [{ type: "CREATE_EPISODE", details: `Created Episode ${createdEpisode.episodeNumber}: "${createdEpisode.title}"` }]
        : [],
      createdEpisode,
    };
  }

  return {
    success: true,
    reply: `Let's plan your first episode together! Tell me what object you want to cook and what dish style you prefer (e.g. Biryani, Samosa, Tempura, Idiyappam), and I'll build the comparison table for your approval before creating the project.`,
    actionsTaken: [],
  };
});
