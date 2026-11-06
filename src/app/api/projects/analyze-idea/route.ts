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
  visualStyle: z.string().default("PHOTOREALISTIC_CINEMATIC"),
  dialogueMode: z.enum(["DIALOGUE", "VOICEOVER", "NO_DIALOGUE"]).default("DIALOGUE"),
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
  const isElephantVillage = lower.includes("elephant") || lower.includes("sugarcane") || lower.includes("amma");
  const isCricket = lower.includes("cricket") || lower.includes("match") || lower.includes("game");
  const isShorts = lower.includes("short") || lower.includes("reel") || lower.includes("tiktok");

  const fallbackResult = {
    suggestedTitle: isElephantVillage
      ? "யானை வரும் பின்னே (The Sugarcane Guardian)"
      : isCricket
      ? "நாளைக்கு நம்ம ஆட்டம்! (Our Match Tomorrow)"
      : "மண் வாசம் (Scent of the Soil)",
    genre: isElephantVillage
      ? "Rural Village Drama / Adventure"
      : isCricket
      ? "Sports / Motivational Drama"
      : "Rural Village Drama",
    tone: isElephantVillage
      ? "Suspenseful, Tense & Thrilling"
      : isCricket
      ? "Playful, Authentic & Energetic"
      : "Grounded, Heartfelt & Emotional",
    targetAudience: "Universal / Family Audience",
    visualStyle: "PHOTOREALISTIC_CINEMATIC",
    dialogueMode: "DIALOGUE" as const,
    storyLanguage: lower.includes("english") ? "English" : lower.includes("hindi") ? "Hindi" : "Tamil",
    aspectRatio: isShorts ? ("PORTRAIT_9_16" as const) : ("LANDSCAPE_16_9" as const),
  };

  try {
    const { provider, modelId } = await resolveTextProvider(ownerId, false);

    const prompt = `Analyze this film idea and recommend the ideal creative specifications:
Film Idea: "${idea}"

Return JSON matching:
{
  "suggestedTitle": "Catchy bilingual or native film title (e.g. 'நாளைக்கு நம்ம ஆட்டம்! (Our Match Tomorrow)')",
  "genre": "Select best fitting genre (e.g. 'Rural Village Drama / Adventure', 'Sports / Motivational Drama', 'Friendship / Buddy Comedy', 'Thriller / Suspense', 'Emotional Family Drama')",
  "tone": "Select best fitting tone (e.g. 'Suspenseful, Tense & Thrilling', 'Playful, Authentic & Energetic', 'Grounded, Heartfelt & Emotional', 'Inspiring & Motivational')",
  "targetAudience": "Select ideal audience (e.g. 'Universal / Family Audience', 'Youth & Young Adults (18–35)', 'Kids & Children')",
  "visualStyle": "PHOTOREALISTIC_CINEMATIC",
  "dialogueMode": "DIALOGUE",
  "storyLanguage": "Tamil",
  "aspectRatio": "LANDSCAPE_16_9"
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
