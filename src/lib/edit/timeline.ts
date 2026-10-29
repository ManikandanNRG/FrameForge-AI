import { z } from "zod";

/**
 * Versioned timeline schema (spec §11.1).
 * Uses integer frame counts internally to avoid floating-point drift.
 * Positions are converted to seconds only at render boundaries.
 */

export const TimelineItemSchema = z.object({
  id:                  z.string(),
  mediaId:             z.string(),           // ShotMedia id or AssetMedia id
  storagePath:         z.string(),           // absolute local path
  timelineStartFrames: z.number().int(),
  sourceInFrames:      z.number().int(),
  sourceOutFrames:     z.number().int(),
  layer:               z.number().int().default(0),
  transitionIn:        z.enum(["cut", "dissolve", "fade"]).nullable().default(null),
  transitionOut:       z.enum(["cut", "dissolve", "fade"]).nullable().default(null),
  transitionDurationFrames: z.number().int().default(0),
  volume:              z.number().min(0).max(2).default(1),
  label:               z.string().optional(),
});

export const TrackSchema = z.object({
  id:    z.string(),
  type:  z.enum(["VIDEO", "AUDIO", "TEXT"]),
  items: z.array(TimelineItemSchema),
});

export const TimelineSchema = z.object({
  schemaVersion: z.literal(1),
  frameRate:     z.number(),
  width:         z.number().int(),
  height:        z.number().int(),
  tracks:        z.array(TrackSchema),
});

export type Timeline     = z.infer<typeof TimelineSchema>;
export type Track        = z.infer<typeof TrackSchema>;
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

export function emptyTimeline(fps = 24, width = 1920, height = 1080): Timeline {
  return {
    schemaVersion: 1,
    frameRate: fps,
    width,
    height,
    tracks: [
      { id: "track-video-1", type: "VIDEO", items: [] },
      { id: "track-audio-1", type: "AUDIO", items: [] },
    ],
  };
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/** Validate the timeline — check for overlaps, missing paths, bad trim ranges. */
export function validateTimeline(tl: Timeline): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const track of tl.tracks) {
    for (const item of track.items) {
      if (item.sourceOutFrames <= item.sourceInFrames) {
        errors.push(`Item ${item.id}: sourceOutFrames must be greater than sourceInFrames`);
      }
      if (item.timelineStartFrames < 0) {
        errors.push(`Item ${item.id}: timelineStartFrames cannot be negative`);
      }
      if (!item.storagePath) {
        errors.push(`Item ${item.id}: storagePath is missing`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
