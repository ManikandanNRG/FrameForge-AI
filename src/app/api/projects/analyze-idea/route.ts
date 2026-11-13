import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { logger } from "@/lib/logger";

const analyzeSchema = z.object({
  idea: z.string().min(5, "Please enter at least a brief sentence about your idea"),
});

const ResultSchema = z.object({
  suggestedTitle: z.string(),
  genre: z.string(),
  tone: z.string(),
  targetAudience: z.string(),
  targetRuntimeSeconds: z.number().default(60),
  visualStyle: z.string().default("PHOTOREALISTIC_CINEMATIC"),
  dialogueMode: z.enum(["DIALOGUE", "VOICEOVER", "NO_DIALOGUE", "PURE_ASMR_FOLEY"]).default("DIALOGUE"),
  storyLanguage: z.string().default("Tamil"),
  aspectRatio: z.enum(["LANDSCAPE_16_9", "PORTRAIT_9_16", "SQUARE_1_1"]).default("LANDSCAPE_16_9"),
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = analyzeSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid idea text", parsed.error.issues);

  const idea = parsed.data.idea.trim();

  // Smart heuristic defaults based on idea keywords
  const lower = idea.toLowerCase();
  const isCulinaryAsmr =
    lower.includes("cooking") ||
    lower.includes("cook") ||
    lower.includes("asmr") ||
    lower.includes("recipe") ||
    lower.includes("culinary") ||
    lower.includes("food") ||
    lower.includes("kitchen") ||
    lower.includes("dish");
  const isElephantVillage = lower.includes("elephant") || lower.includes("sugarcane") || lower.includes("amma");
  const isCricket = lower.includes("cricket") || lower.includes("match") || lower.includes("game");
  const isShorts = lower.includes("short") || lower.includes("reel") || lower.includes("tiktok");
  const isKidsAnimation =
    lower.includes("kid") ||
    lower.includes("child") ||
    lower.includes("rhyme") ||
    lower.includes("nursery") ||
    lower.includes("ghibli") ||
    lower.includes("zibly") ||
    lower.includes("cartoon") ||
    lower.includes("anime") ||
    lower.includes("sports day") ||
    lower.includes("fun race");

  const fallbackResult = {
    suggestedTitle: isCulinaryAsmr
      ? "The Art of Sizzle (Culinary ASMR)"
      : isKidsAnimation
      ? (lower.includes("sport") ? "The Meadow Sports Day (Kids Ghibli Rhyme)" : "Little Wonders of the Forest (Kids Animated Rhyme)")
      : isElephantVillage
      ? "யானை வரும் பின்னே (The Sugarcane Guardian)"
      : isCricket
      ? "நாளைக்கு நம்ம ஆட்டம்! (Our Match Tomorrow)"
      : "மண் வாசம் (Scent of the Soil)",
    genre: isCulinaryAsmr
      ? "Culinary & Cooking ASMR"
      : isKidsAnimation
      ? "Kids & Children Entertainment"
      : isElephantVillage
      ? "Rural Village Drama / Adventure"
      : isCricket
      ? "Sports / Motivational Drama"
      : "Rural Village Drama",
    tone: isCulinaryAsmr
      ? "Satisfying, Crisp & Hypnotic"
      : isKidsAnimation
      ? "Joyful, Whimsical & Playful"
      : isElephantVillage
      ? "Suspenseful, Tense & Thrilling"
      : isCricket
      ? "Playful, Authentic & Energetic"
      : "Grounded, Heartfelt & Emotional",
    targetAudience: isCulinaryAsmr
      ? "Social Media & Short-form Viewers (Reels / Shorts)"
      : isKidsAnimation
      ? "Kids & Toddlers (Preschool & Young Children)"
      : "Universal / Family Audience",
    targetRuntimeSeconds: isShorts ? 45 : (isElephantVillage || isCricket || isCulinaryAsmr || isKidsAnimation) ? 60 : 90,
    visualStyle: isCulinaryAsmr
      ? "CULINARY_MACRO_ASMR"
      : isKidsAnimation
      ? ((lower.includes("ghibli") || lower.includes("zibly") || lower.includes("anime") || lower.includes("scenery")) ? "GHIBLI_ANIME" : lower.includes("3d") ? "ANIMATION_3D" : "CARTOON_2D")
      : "PHOTOREALISTIC_CINEMATIC",
    dialogueMode: isCulinaryAsmr ? ("PURE_ASMR_FOLEY" as const) : isKidsAnimation ? ("VOICEOVER" as const) : ("DIALOGUE" as const),
    storyLanguage: lower.includes("english") ? "English" : lower.includes("hindi") ? "Hindi" : "Tamil",
    aspectRatio: (isShorts || isCulinaryAsmr) ? ("PORTRAIT_9_16" as const) : ("LANDSCAPE_16_9" as const),
  };

  try {
    const { provider, modelId } = await resolveTextProvider(ownerId, false);

    const prompt = `Analyze this film idea and recommend the ideal creative specifications:
Film Idea: "${idea}"

Note: If the idea is about cooking, food preparation, or ASMR:
- set "genre": "Culinary & Cooking ASMR"
- set "tone": "Satisfying, Crisp & Hypnotic"
- set "visualStyle": "CULINARY_MACRO_ASMR"
- set "dialogueMode": "PURE_ASMR_FOLEY"

Note: If the idea is about kids, children, rhymes, nursery songs, animated cartoon, or Studio Ghibli:
- set "genre": "Kids & Children Entertainment"
- set "tone": "Joyful, Whimsical & Playful"
- set "visualStyle": "GHIBLI_ANIME" (for Ghibli/pastoral scenery) or "CARTOON_2D" or "ANIMATION_3D"
- set "targetAudience": "Kids & Toddlers (Preschool & Young Children)"
- set "dialogueMode": "VOICEOVER" (rhyme narration) or "DIALOGUE"

Return JSON matching:
{
  "suggestedTitle": "Catchy bilingual or native film title (e.g. 'The Meadow Sports Day: Kids Animated Rhyme' or 'The Art of Sizzle')",
  "genre": "Select best fitting genre (e.g. 'Kids & Children Entertainment', 'Culinary & Cooking ASMR', 'Sports / Motivational Drama')",
  "tone": "Select best fitting tone (e.g. 'Joyful, Whimsical & Playful', 'Satisfying, Crisp & Hypnotic', 'Playful, Authentic & Energetic')",
  "targetAudience": "Select ideal audience (e.g. 'Kids & Toddlers (Preschool & Young Children)', 'Social Media Viewers')",
  "targetRuntimeSeconds": 60,
  "visualStyle": "GHIBLI_ANIME or CARTOON_2D or ANIMATION_3D or CULINARY_MACRO_ASMR or PHOTOREALISTIC_CINEMATIC or VINTAGE_FILM",
  "dialogueMode": "VOICEOVER or DIALOGUE or PURE_ASMR_FOLEY or NO_DIALOGUE",
  "storyLanguage": "English or Tamil or Hindi",
  "aspectRatio": "PORTRAIT_9_16 or LANDSCAPE_16_9"
}`;

    const res = await provider.generateStructured({
      modelId,
      systemPrompt: "You are an elite cinema director and creative producer. Return valid JSON only.",
      userPrompt: prompt,
      schema: ResultSchema,
    });

    return { analysis: res.data };
  } catch (err) {
    logger.warn({ err }, "AI idea analysis hit provider error; returning intelligent heuristic defaults");
    return { analysis: fallbackResult };
  }
});
