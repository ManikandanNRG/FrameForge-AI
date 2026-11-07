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

export const StoryOptionSchema = z.object({
  optionId: z.enum(["A", "B"]),
  title: z.string(),
  conceptAngle: z.string(), // e.g. "Emotional Family Drama & Heart" vs "High-Stakes Village Action Thriller"
  logline: z.string(),
  premise: z.string(),
  scenes: z.array(
    z.object({
      sceneNumber: z.number(),
      heading: z.string(),
      location: z.string(),
      timeOfDay: z.string(),
      action: z.string(),
      voiceover: z.string().optional().default(""),
      dialogue: z.string().optional().default(""),
      audioScript: z.string().optional().default(""),
      estimatedDurationSeconds: z.number().default(8),
    })
  ).min(3),
});

export const TwoStoryOptionsSchema = z.object({
  optionA: StoryOptionSchema,
  optionB: StoryOptionSchema,
});

export type StoryOption = z.infer<typeof StoryOptionSchema>;
export type TwoStoryOptions = z.infer<typeof TwoStoryOptionsSchema>;
