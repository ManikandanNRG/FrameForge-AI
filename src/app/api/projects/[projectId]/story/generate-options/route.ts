import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { TwoStoryOptionsSchema } from "@/lib/story/schemas";
import { logger } from "@/lib/logger";

const requestSchema = z.object({
  idea: z.string().optional(),
  instructions: z.string().optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: {
      productionAssets: { where: { assetType: "CHARACTER" } },
    },
  });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid request");

  const storyIdea = (parsed.data.idea && parsed.data.idea.trim().length > 0)
    ? parsed.data.idea.trim()
    : project.description || project.title;

  if (!storyIdea || storyIdea.trim().length < 5) {
    throw badRequest("Please provide an initial story idea to develop.");
  }

  const { provider, modelId } = await resolveTextProvider(ownerId, false);

  const characterGuide = project.productionAssets.map(c => {
    let attr: any = {};
    try { attr = JSON.parse(c.attributes || "{}"); } catch {}
    return `- ${c.name} (${attr.role || "Character"}, Age ${attr.age || "unknown"}): ${c.description}. Wardrobe: ${attr.wardrobe || "traditional"}.`;
  }).join("\n");

  const systemPrompt = `You are a world-class film development executive, master screenwriter, and cinematic storyteller.
Film Visual Style: ${project.visualStyle.replace(/_/g, " ")}.
Dialogue & Voice-Over Language: "${project.storyLanguage}".
Film Orientation: ${project.aspectRatio === "PORTRAIT_9_16" ? "9:16 Vertical Mobile" : "16:9 Widescreen"}.

TASK:
Develop TWO COMPLETELY DIFFERENT story treatments (Option A vs Option B) based on the user's initial one-line idea.

OPTION A: "Emotional Drama & Heart"
- Focus on emotional vulnerability, family bonds, psychological tension, and heartfelt community support.
- Intimate, warm, grounded documentary realism.

OPTION B: "High-Stakes Thrill & Action"
- Focus on high-adrenaline suspense, survival chase through the terrain, tactical village mobilization, and heroic victory.
- Dynamic, rhythmic, fast-paced cinematic spectacle.

FOR BOTH OPTIONS:
1. Provide a compelling Title, Logline, and Premise.
2. Provide 5-6 sequential scenes (each strictly 8s or 10s duration).
3. Action descriptions in English, rich with camera dynamics and physical movement.
4. Spoken Dialogue in authentic native "${project.storyLanguage}" formatted as '[@Character] speaks: "..."' with emotional delivery direction.
5. Audio exclusivity: When characters speak dialogue, voiceover MUST be empty string ("").
6. Airtight dramatic causality: Every shock, reaction, or scream MUST have a clear physical cause established in the scene.

Characters to weave in:
${characterGuide || "- Authentic South Indian regional characters."}`;

  const userPrompt = `Develop two different full story options from this one-line idea:
"${storyIdea}"

Additional Director Notes:
${parsed.data.instructions || "Create two distinctly memorable screenplays with authentic cultural dialogue in " + project.storyLanguage}

Return JSON with optionA and optionB matching TwoStoryOptionsSchema.`;

  logger.info({ projectId, storyIdea }, "Developing 2 competing story options");

  const result = await provider.generateStructured({
    modelId,
    systemPrompt,
    userPrompt,
    schema: TwoStoryOptionsSchema,
  });

  return {
    ok: true,
    options: [result.data.optionA, result.data.optionB],
  };
});

