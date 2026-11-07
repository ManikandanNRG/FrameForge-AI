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
  useMock: z.boolean().optional(),
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
    : project.sourceIdea || project.description || project.title;

  if (!storyIdea || storyIdea.trim().length < 5) {
    throw badRequest("Please provide an initial story idea to develop.");
  }

  const { provider, modelId } = await resolveTextProvider(ownerId, parsed.data.useMock || false);

  const characterGuide = project.productionAssets.map(c => {
    let attr: any = {};
    try { attr = JSON.parse(c.attributes || "{}"); } catch {}
    return `- ${c.name} (${attr.role || "Character"}, Age ${attr.age || "unknown"}): ${c.description}. Wardrobe: ${attr.wardrobe || "traditional"}.`;
  }).join("\n");

  const systemPrompt = `You are a world-class film development executive, master screenwriter, and cinematic storytelling architect.
Film Visual Style: ${project.visualStyle.replace(/_/g, " ")}.
Dialogue & Voice-Over Language: "${project.storyLanguage}".
Film Orientation: ${project.aspectRatio === "PORTRAIT_9_16" ? "9:16 Vertical Mobile" : "16:9 Widescreen"}.

CORE DIRECTIVE — DYNAMIC STORY ANALYSIS:
Do NOT impose fixed pre-set genres or categories (do NOT default to just Drama vs Thriller).
Carefully ANALYZE the user's specific idea, its subject matter, themes, conflict potential, emotional spectrum, and creative possibilities.
Based strictly on your analysis of THAT specific idea, conceive TWO DISTINCT CREATIVE STORY TREATMENTS (Option A and Option B) representing two compelling, contrasting narrative angles that organically grow out of the idea.

For example:
- One angle might focus on the protagonist's personal emotional journey, intimate relationships, and inner courage.
- The other angle might focus on the external spectacle, collective community action, tactical obstacles, or dynamic momentum.
- Or, depending on the idea: one could be character-driven and grounded, while the other is fast-paced and high-stakes; or one could lean into wonder and heart, while the other leans into clever strategy and tension.

FOR BOTH OPTIONS (A and B):
1. Give each option a custom, descriptive conceptAngle (e.g. "Community Rally & Field Defense" vs "Heartfelt Courage & Mother-Son Bond").
2. Provide a memorable, evocative Title.
3. Provide a punchy Logline (1 sentence) and Premise (2 sentences).
4. Provide 5-6 sequential scenes (each strictly 8s or 10s duration).
5. Visual action descriptions in cinematic English detailing blocking, emotional expressions, and camera motion.
6. Spoken Dialogue in authentic native "${project.storyLanguage}" formatted as '[@Character] speaks: "..."' with emotional delivery direction.
7. Audio exclusivity: When a character is actively speaking dialogue in a scene, narrator voiceover MUST be empty string (""). Only provide voiceover when characters are silent.
8. Airtight dramatic causality: Every reaction, scream, or shock MUST have a clear physical cause established in the scene.

Characters to weave in:
${characterGuide || "- Authentic regional characters appropriate to the story world."}`;

  const userPrompt = `Analyze this story idea and develop two distinctly different full story options tailored to it:
"${storyIdea}"

Additional Director Notes:
${parsed.data.instructions || "Analyze the core idea and produce two distinct creative treatments with authentic cultural dialogue in " + project.storyLanguage}

Return JSON with optionA and optionB matching TwoStoryOptionsSchema.`;

  logger.info({ projectId, storyIdea }, "Developing 2 competing story options based on idea analysis");

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

