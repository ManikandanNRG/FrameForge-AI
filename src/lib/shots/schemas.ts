import { z } from "zod";

export const ShotPlanSchema = z.object({
  scenes: z.array(z.object({
    sceneNumber: z.number(),
    heading: z.string(),
    location: z.string(),
    timeOfDay: z.string(),
    actionSummary: z.string(),
    estimatedDurationSeconds: z.number(),
    shots: z.array(z.object({
      shotNumber: z.number(),
      actionDescription: z.string(),
      shotSize: z.string(),
      cameraAngle: z.string().optional(),
      cameraMovement: z.string().optional(),
      lighting: z.string().optional(),
      mood: z.string().optional(),
      characterConsistencyAnchor: z.string().optional(),
      characterTag: z.string().optional(),
      imagePrompt: z.string(),
      videoPrompt: z.string(),
      voiceover: z.string().optional(),
      dialogue: z.string().optional(),
      audioPrompt: z.string().optional(),
      soundEffects: z.string().optional(),
      targetDurationSeconds: z.number(),
    })),
  })),
});

export type ShotPlan = z.infer<typeof ShotPlanSchema>;
