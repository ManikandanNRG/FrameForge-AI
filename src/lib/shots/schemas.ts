import { z } from "zod";

export const OMNI_ALLOWED_DURATIONS = [4, 6, 8, 10] as const;

export function snapToOmniDuration(seconds?: number): number {
  if (!seconds || isNaN(seconds)) return 6;
  return OMNI_ALLOWED_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - seconds) < Math.abs(prev - seconds) ? curr : prev
  );
}

const ShotItemSchema = z.object({
  shotNumber: z.number().default(1),
  actionDescription: z.string().default(""),
  shotSize: z.string().default("Medium Shot"),
  cameraAngle: z.string().optional().default("Eye-level"),
  cameraMovement: z.string().optional().default("Static"),
  lighting: z.string().optional().default("Natural daylight"),
  mood: z.string().optional().default("Cinematic"),
  characterConsistencyAnchor: z.string().optional().default(""),
  characterTag: z.string().optional().default(""),
  imagePrompt: z.string().default(""),
  videoPrompt: z.string().default(""),
  voiceover: z.string().optional().default(""),
  dialogue: z.string().optional().default(""),
  audioPrompt: z.string().optional().default(""),
  soundEffects: z.string().optional().default(""),
  targetDurationSeconds: z.number().default(6),
});

const SceneItemSchema = z.object({
  sceneNumber: z.number().default(1),
  heading: z.string().default("SCENE 1"),
  location: z.string().default("MAIN LOCATION"),
  timeOfDay: z.string().default("DAY"),
  actionSummary: z.string().default("Film scene"),
  estimatedDurationSeconds: z.number().default(15),
  shots: z.array(ShotItemSchema).default([]),
});

function sanitizeShot(s: any): any {
  if (!s || typeof s !== "object") return s;
  const duration = snapToOmniDuration(s.targetDurationSeconds);
  const dialogue = typeof s.dialogue === "string" ? s.dialogue.trim() : "";
  // Mutual exclusivity: If dialogue exists, voiceover MUST be empty
  const voiceover = dialogue.length > 0 ? "" : (typeof s.voiceover === "string" ? s.voiceover.trim() : "");
  return {
    ...s,
    targetDurationSeconds: duration,
    dialogue,
    voiceover,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ShotPlanSchema = z.preprocess((val: any) => {
  if (!val) return { scenes: [] };

  // Case 1: val is an array directly
  if (Array.isArray(val)) {
    // If elements have "shots", then it's an array of scenes
    if (val.length > 0 && ("shots" in val[0] || "sceneNumber" in val[0])) {
      return {
        scenes: val.map((scene: any) => ({
          ...scene,
          shots: Array.isArray(scene.shots) ? scene.shots.map(sanitizeShot) : [],
        })),
      };
    }
    // If elements have "videoPrompt" or "actionDescription", it's an array of shots
    if (val.length > 0 && ("videoPrompt" in val[0] || "actionDescription" in val[0] || "shotNumber" in val[0])) {
      const sanitizedShots = val.map(sanitizeShot);
      return {
        scenes: [
          {
            sceneNumber: 1,
            heading: "SCENE 1",
            location: "MAIN LOCATION",
            timeOfDay: "DAY",
            actionSummary: "Film sequence",
            estimatedDurationSeconds: sanitizedShots.reduce((acc: number, s: any) => acc + (s.targetDurationSeconds || 6), 0),
            shots: sanitizedShots,
          },
        ],
      };
    }
    return { scenes: val };
  }

  // Case 2: val is an object with "shots" directly on root instead of inside scenes
  if (typeof val === "object" && !val.scenes && Array.isArray(val.shots)) {
    const sanitizedShots = val.shots.map(sanitizeShot);
    return {
      scenes: [
        {
          sceneNumber: 1,
          heading: "SCENE 1",
          location: "MAIN LOCATION",
          timeOfDay: "DAY",
          actionSummary: "Film sequence",
          estimatedDurationSeconds: sanitizedShots.reduce((acc: number, s: any) => acc + (s.targetDurationSeconds || 6), 0),
          shots: sanitizedShots,
        },
      ],
    };
  }

  // Case 3: val is an object with scenes array
  if (typeof val === "object" && Array.isArray(val.scenes)) {
    return {
      ...val,
      scenes: val.scenes.map((scene: any) => ({
        ...scene,
        shots: Array.isArray(scene.shots) ? scene.shots.map(sanitizeShot) : [],
      })),
    };
  }

  return val;
}, z.object({
  scenes: z.array(SceneItemSchema),
}));

export type ShotPlan = z.infer<typeof ShotPlanSchema>;
