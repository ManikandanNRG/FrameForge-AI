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
      heading: z.string(),     // INT. LIGHTHOUSE - DAY
      location: z.string(),
      timeOfDay: z.string(),
      action: z.string(),
      dialogue: z.string().optional(),
      estimatedDurationSeconds: z.number(),
    }),
  ).min(1),
  totalEstimatedDurationSeconds: z.number(),
});

export type Logline       = z.infer<typeof LoglineSchema>;
export type Synopsis      = z.infer<typeof SynopsisSchema>;
export type Outline       = z.infer<typeof OutlineSchema>;
export type CharacterArcs = z.infer<typeof CharacterArcSchema>;
export type Screenplay    = z.infer<typeof ScreenplaySchema>;
