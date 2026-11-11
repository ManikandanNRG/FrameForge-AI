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

  const fallbackResult = {
    suggestedTitle: isCulinaryAsmr
      ? "The Art of Sizzle (Culinary ASMR)"
      : isElephantVillage
      ? "யானை வரும் பின்னே (The Sugarcane Guardian)"
      : isCricket
      ? "நாளைக்கு நம்ம ஆட்டம்! (Our Match Tomorrow)"
      : "மண் வாசம் (Scent of the Soil)",
    genre: isCulinaryAsmr
      ? "Culinary & Cooking ASMR"
      : isElephantVillage
      ? "Rural Village Drama / Adventure"
      : isCricket
      ? "Sports / Motivational Drama"
      : "Rural Village Drama",
    tone: isCulinaryAsmr
      ? "Satisfying, Crisp & Hypnotic"
      : isElephantVillage
      ? "Suspenseful, Tense & Thrilling"
      : isCricket
      ? "Playful, Authentic & Energetic"
      : "Grounded, Heartfelt & Emotional",
    targetAudience: isCulinaryAsmr ? "Social Media & Short-form Viewers (Reels / Shorts)" : "Universal / Family Audience",
    targetRuntimeSeconds: isShorts ? 45 : (isElephantVillage || isCricket || isCulinaryAsmr) ? 60 : 90,
    visualStyle: isCulinaryAsmr ? "CULINARY_MACRO_ASMR" : "PHOTOREALISTIC_CINEMATIC",
    dialogueMode: isCulinaryAsmr ? ("PURE_ASMR_FOLEY" as const) : ("DIALOGUE" as const),
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

Return JSON matching:
{
  "suggestedTitle": "Catchy bilingual or native film title (e.g. 'The Art of Sizzle: Wagyu & Garlic Butter ASMR' or 'நாளைக்கு நம்ம ஆட்டம்!')",
  "genre": "Select best fitting genre (e.g. 'Culinary & Cooking ASMR', 'Rural Village Drama / Adventure', 'Sports / Motivational Drama', 'Friendship / Buddy Comedy', 'Thriller / Suspense', 'Emotional Family Drama')",
  "tone": "Select best fitting tone (e.g. 'Satisfying, Crisp & Hypnotic', 'Suspenseful, Tense & Thrilling', 'Playful, Authentic & Energetic', 'Grounded, Heartfelt & Emotional', 'Inspiring & Motivational')",
  "targetAudience": "Select ideal audience (e.g. 'Social Media & Short-form Viewers (Reels / Shorts)', 'Universal / Family Audience', 'Youth & Young Adults (18–35)', 'Kids & Children')",
  "targetRuntimeSeconds": 60,
  "visualStyle": "CULINARY_MACRO_ASMR or PHOTOREALISTIC_CINEMATIC or VINTAGE_FILM",
  "dialogueMode": "PURE_ASMR_FOLEY or DIALOGUE or VOICEOVER or NO_DIALOGUE",
  "storyLanguage": "Tamil or English",
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
