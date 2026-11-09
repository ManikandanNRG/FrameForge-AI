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

  const systemPrompt = `You are a visionary film director, master screenwriter, and social media viral storytelling architect.
Film Visual Style: ${project.visualStyle.replace(/_/g, " ")}.
Dialogue & Voice-Over Language: "${project.storyLanguage}".
Film Orientation: ${project.aspectRatio === "PORTRAIT_9_16" ? "9:16 Vertical Mobile (Shorts / Reels / TikTok)" : "16:9 Widescreen"}.

CORE DIRECTIVE — VIRAL SOCIAL MEDIA STORYTELLING & DYNAMIC ANALYSIS:
Do NOT impose fixed pre-set genres or categories.
Carefully ANALYZE the user's specific idea, its historical context, cultural world, emotional stakes, and viral visual potential.
Conceive TWO DISTINCT CREATIVE STORY TREATMENTS (Option A and Option B) representing two compelling, contrasting narrative angles organically derived from the idea.

CRITICAL QUALITY RULES FOR VIRAL ENGAGEMENT:
1. SCENE 1 IS A 3-SECOND SCROLL-STOPPING VISUAL HOOK:
   - Starts immediately in media res. Never start with someone passively "standing and observing".
   - Open with explosive physical action, sensory shock, dramatic reveal, or high curiosity gap that forces viewers to keep watching.
2. VIVID, HIGH-PRODUCTION-VALUE VISUAL BLOCKING (NO BASIC ONE-LINERS!):
   - Each visual action description MUST be 2-4 sentences packed with cinematic specifics:
     - Precise camera framing: Low-angle tracking shot, 35mm shallow depth of field, anamorphic golden hour flare, 24fps motion blur, intense close-up on wide eyes.
     - Rich period & cultural atmosphere: For vintage / period settings (e.g., 1900s Pudukkottai, Chettinad, ancient kingdoms), weave in authentic tactile textures: ornate teakwood pillars, brass oil lamps casting dancing shadows on sepia lime-plastered walls, bullock carts with heavy wooden wheels kicking up red dust, steam locomotives billowing white smoke, weavers pulling crimson silk threads on handlooms, brass temple bells resounding, antique copper coins.
     - Physical micro-actions: gasping, sprinting barefoot, dust flying, clutching hands, sweat dripping, gasps of astonishment.
3. AUTHENTIC COLLOQUIAL SPOKEN DIALOGUE (STRICTLY NO BOOKISH / TRANSLATE-STYLE TAMIL!):
   - Dialogue MUST sound like real, natural human speech in Tamil cinema (like Madrasapattinam, Asuran, Ponniyin Selvan, Captain Miller).
   - NEVER write formal, literal or bookish Tamil like "நான் பதிவு செய்யும்" or "இது எங்கள் அடையாளம்".
   - Use punchy, emotional, colloquial Tamil:
     - Excitement/Wonder: '[@Character] speaks: "(கண்களில் பிரம்மிப்புடன், கையை நீட்டி) அடேய் தம்பி! அங்கே பாருடா... புதுக்கோட்டை சமஸ்தானத்து எல்லைக்குள்ள முதல் முதலா ரயிலு வண்டி புகை விட்டுட்டு வருது!"'
     - Urgency/Fear: '[@Character] speaks: "(மூச்சிரைக்க, பயத்தில் அலறி) அம்மா! ஓடி வாம்மா... நம்ம கரும்பு காட்டுக்குள்ள காட்டு யானை நிக்குது!"'
     - Pride/Nostalgia: '[@Character] speaks: "(பெருமித புன்னகையுடன்) இந்த அரண்மனை வாசலில் நின்னாலே நூறு வருஷத்து தங்கக் காசு சத்தம் இன்னும் இந்த மண்ணுல கேட்கும்!"'
4. AUDIO EXCLUSIVITY:
   - When a character speaks dialogue, narrator voiceover MUST be empty string (""). Only provide voiceover when characters are silent.
5. AIRTIGHT DRAMATIC CAUSALITY & PACING:
   - 5-6 scenes strictly 8s or 10s duration each.
   - Pacing structure: Hook (Scene 1) -> World Building & Stakes (Scenes 2-3) -> Rising Conflict / Discovery (Scene 4) -> Climax & Lasting Viral Impression (Scenes 5-6).

Characters to weave in:
${characterGuide || "- Authentic regional characters appropriate to the story world."}`;

  const userPrompt = `Analyze this story idea and develop two distinctly different full story options tailored to it:
"${storyIdea}"

Additional Director Notes:
${parsed.data.instructions || "Analyze the core idea and produce two distinct creative treatments with authentic cultural dialogue in " + project.storyLanguage}

Return JSON with this exact structure:
{
  "optionA": {
    "optionId": "A",
    "title": "Title for Option A",
    "conceptAngle": "Angle for Option A",
    "logline": "1-sentence logline",
    "premise": "2-sentence premise",
    "scenes": [
      {
        "sceneNumber": 1,
        "heading": "EXT. SUGARCANE FIELD - AFTERNOON",
        "location": "Sugarcane Field",
        "timeOfDay": "AFTERNOON",
        "action": "Visual description in cinematic English...",
        "dialogue": "[@Character] speaks: \\"...\\"",
        "voiceover": "",
        "audioScript": "Sound effects and atmosphere...",
        "estimatedDurationSeconds": 8
      }
    ]
  },
  "optionB": {
    "optionId": "B",
    "title": "Title for Option B",
    "conceptAngle": "Angle for Option B",
    "logline": "1-sentence logline",
    "premise": "2-sentence premise",
    "scenes": [
      {
        "sceneNumber": 1,
        "heading": "EXT. SUGARCANE FIELD - AFTERNOON",
        "location": "Sugarcane Field",
        "timeOfDay": "AFTERNOON",
        "action": "Visual description in cinematic English...",
        "dialogue": "[@Character] speaks: \\"...\\"",
        "voiceover": "",
        "audioScript": "Sound effects and atmosphere...",
        "estimatedDurationSeconds": 8
      }
    ]
  }
}`;

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

