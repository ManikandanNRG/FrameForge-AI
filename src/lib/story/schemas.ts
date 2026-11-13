import { z } from "zod";

/** Zod schemas for structured AI story output (spec §15.1, §15.2). */

export const LoglineSchema = z.object({
  logline: z.string().min(10),
  premise: z.string().min(20),
});

export const SynopsisSchema = z.object({
  synopsis: z.string().min(50),
});

export const OutlineSchema = z.object({
  acts: z.array(
    z.object({
      actNumber: z.number(),
      title: z.string(),
      summary: z.string(),
      sequences: z.array(z.string()),
    }),
  ).min(1),
  estimatedRuntimeMinutes: z.number(),
});

export const CharacterArcSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string(),
      role: z.string(),        // protagonist | antagonist | supporting
      arc: z.string(),
    }),
  ),
});

export const ScreenplaySchema = z.object({
  title: z.string(),
  scenes: z.array(
    z.object({
      sceneNumber: z.number(),
      heading: z.string(),     // e.g. EXT. VILLAGE FIELDS - DAWN
      location: z.string(),
      timeOfDay: z.string(),
      action: z.string(),
      voiceover: z.string().optional(),
      dialogue: z.string().optional(),
      audioScript: z.string().optional(),
      soundEffects: z.string().optional(),
      estimatedDurationSeconds: z.number(),
    }),
  ).min(1),
  totalEstimatedDurationSeconds: z.number(),
});

export type Logline = z.infer<typeof LoglineSchema>;
export type Synopsis = z.infer<typeof SynopsisSchema>;
export type Outline = z.infer<typeof OutlineSchema>;
export type CharacterArcs = z.infer<typeof CharacterArcSchema>;
export type Screenplay = z.infer<typeof ScreenplaySchema>;

export const StorySceneItemSchema = z.preprocess((val: any) => {
  if (typeof val !== "object" || !val) return {};
  return {
    sceneNumber: val.sceneNumber ?? val.scene_number ?? val.number ?? val.scene ?? 1,
    heading: val.heading ?? val.scene_heading ?? val.title ?? "EXT. SCENE - DAY",
    location: val.location ?? "Main Story World",
    timeOfDay: val.timeOfDay ?? val.time_of_day ?? "AFTERNOON",
    action: val.action ?? val.visualAction ?? val.visual_action ?? val.description ?? "",
    voiceover: val.voiceover ?? val.voice_over ?? "",
    dialogue: val.dialogue ?? val.dialogues ?? val.spokenDialogue ?? "",
    audioScript: val.audioScript ?? val.audio_prompt ?? val.soundEffects ?? "",
    estimatedDurationSeconds: Number(val.estimatedDurationSeconds ?? val.duration ?? 8) || 8,
  };
}, z.object({
  sceneNumber: z.coerce.number().default(1),
  heading: z.string().default("EXT. LOCATION - DAY"),
  location: z.string().default("Location"),
  timeOfDay: z.string().default("DAY"),
  action: z.string().default(""),
  voiceover: z.string().optional().default(""),
  dialogue: z.string().optional().default(""),
  audioScript: z.string().optional().default(""),
  estimatedDurationSeconds: z.coerce.number().default(8),
}));

export const StoryOptionSchema = z.preprocess((val: any) => {
  if (typeof val !== "object" || !val) return {};
  const idRaw = String(val.optionId ?? val.id ?? "A").toUpperCase();
  const optionId = idRaw.includes("B") ? "B" : "A";
  const scenesRaw = Array.isArray(val.scenes)
    ? val.scenes
    : Array.isArray(val.sceneBreakdown)
    ? val.sceneBreakdown
    : Array.isArray(val.shots)
    ? val.shots
    : [];

  return {
    ...val,
    optionId,
    title: val.title ?? (optionId === "A" ? "Story Option A" : "Story Option B"),
    conceptAngle: val.conceptAngle ?? val.angle ?? val.theme ?? "Cinematic Story Treatment",
    logline: val.logline ?? val.summary ?? "",
    premise: val.premise ?? val.description ?? val.logline ?? "",
    scenes: scenesRaw.map((s: any, idx: number) => ({
      sceneNumber: s?.sceneNumber ?? s?.scene_number ?? idx + 1,
      heading: s?.heading ?? s?.scene_heading ?? `SCENE ${idx + 1}`,
      location: s?.location ?? "Main Story World",
      timeOfDay: s?.timeOfDay ?? s?.time_of_day ?? "AFTERNOON",
      action: s?.action ?? s?.visualAction ?? s?.visual_action ?? s?.description ?? "",
      voiceover: s?.voiceover ?? s?.voice_over ?? "",
      dialogue: s?.dialogue ?? s?.dialogues ?? s?.spokenDialogue ?? "",
      audioScript: s?.audioScript ?? s?.audio_prompt ?? "",
      estimatedDurationSeconds: Number(s?.estimatedDurationSeconds ?? s?.duration ?? 8) || 8,
    })),
  };
}, z.object({
  optionId: z.enum(["A", "B"]).default("A"),
  title: z.string().default("Story Option"),
  conceptAngle: z.string().default("Cinematic Narrative"),
  logline: z.string().default(""),
  premise: z.string().default(""),
  scenes: z.array(StorySceneItemSchema).default([]),
}));

export const TwoStoryOptionsSchema = z.preprocess((val: any) => {
  if (typeof val !== "object" || !val) return { optionA: {}, optionB: {} };
  // If returned an array [optA, optB] directly
  if (Array.isArray(val)) {
    return {
      optionA: { ...(val[0] || {}), optionId: "A" },
      optionB: { ...(val[1] || {}), optionId: "B" },
    };
  }
  // If returned { options: [optA, optB] }
  if (Array.isArray(val.options)) {
    return {
      optionA: { ...(val.options[0] || {}), optionId: "A" },
      optionB: { ...(val.options[1] || {}), optionId: "B" },
    };
  }
  return {
    optionA: { ...(val.optionA ?? val.OptionA ?? val.option_a ?? val.A ?? {}), optionId: "A" },
    optionB: { ...(val.optionB ?? val.OptionB ?? val.option_b ?? val.B ?? {}), optionId: "B" },
  };
}, z.object({
  optionA: StoryOptionSchema,
  optionB: StoryOptionSchema,
}));

export type StoryOption = z.infer<typeof StoryOptionSchema>;
export type TwoStoryOptions = z.infer<typeof TwoStoryOptionsSchema>;
