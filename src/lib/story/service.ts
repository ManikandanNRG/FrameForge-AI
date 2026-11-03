import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import type { TextGenerationProvider } from "@/lib/providers/types";
import {
  LoglineSchema, SynopsisSchema, OutlineSchema,
  CharacterArcSchema, ScreenplaySchema,
} from "./schemas";
import {
  systemPrompt, loglinePrompt, synopsisPrompt,
  outlinePrompt, characterArcsPrompt, screenplayPrompt,
  type ProjectBrief,
} from "./prompts";

async function saveArtifactVersion(
  projectId: string,
  artifactType: string,
  contentText: string,
  meta: { providerId?: string; modelId?: string; jobId?: string },
): Promise<string> {
  const artifact = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId, artifactType } },
    create: { projectId, artifactType, approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT", updatedAt: new Date() },
  });
  const count = await prisma.artifactVersion.count({ where: { artifactId: artifact.id } });
  const version = await prisma.artifactVersion.create({
    data: {
      artifactId:      artifact.id,
      versionNumber:   count + 1,
      contentText,
      source:          "AI",
      providerId:      meta.providerId ?? null,
      modelId:         meta.modelId ?? null,
      generationJobId: meta.jobId ?? null,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data:  { currentVersionId: version.id },
  });
  return version.id;
}

export async function generateStory(
  provider: TextGenerationProvider,
  modelId: string,
  projectId: string,
  brief: ProjectBrief,
  jobId: string,
): Promise<void> {
  const sys  = systemPrompt(brief);
  const meta = { providerId: provider.id, modelId, jobId };
  logger.info({ projectId, model: modelId }, "story generation starting");

  if (brief.targetRuntimeMinutes <= 3) {
    await generateStoryCombined(provider, modelId, projectId, brief, sys, meta);
  } else {
    await generateStoryFull(provider, modelId, projectId, brief, sys, meta);
  }

  await prisma.project.update({
    where: { id: projectId },
    data:  { currentStage: "STORY", status: "ACTIVE" },
  });
  logger.info({ projectId }, "story generation complete");
}

/** Single-call generation for short films (≤3 min) — one API call, much faster. */
async function generateStoryCombined(
  provider: TextGenerationProvider,
  modelId: string,
  projectId: string,
  brief: ProjectBrief,
  sys: string,
  meta: { providerId?: string; modelId?: string; jobId?: string },
): Promise<void> {
  const CombinedSchema = z.object({
    logline:    z.string(),
    premise:    z.string(),
    synopsis:   z.string(),
    outline:    z.string(),
    characters: z.string(),
    screenplay: z.string(),
  });

  const r = await provider.generateStructured({
    modelId,
    systemPrompt: sys,
    userPrompt: `Write a complete short film package for a ${brief.targetRuntimeMinutes}-minute film.
Target Story Language: "${brief.storyLanguage}".
CRITICAL: All character dialogue and voice-over narration MUST be written in "${brief.storyLanguage}" (e.g. Tamil script for Tamil, Hindi for Hindi). Visual action lines must be in cinematic English.

Return JSON with exactly these keys (all strings):
- logline: one punchy sentence
- premise: two sentences expanding the logline
- synopsis: two paragraphs covering the full story arc
- outline: brief act structure (acts 1/2/3)
- characters: main characters with highly specific visual appearance descriptions (age, facial traits, skin, exact wardrobe) for visual consistency
- screenplay: full scene-by-scene screenplay breakdown with INT./EXT. headings, action lines (English), VOICE-OVER (V.O.) narration (in ${brief.storyLanguage}), character SPEECH/DIALOGUE (in ${brief.storyLanguage}), and SOUND DESIGN/AUDIO CUES for every scene.

Film idea: "${brief.sourceIdea}"`,
    schema: CombinedSchema,
  });

  await saveArtifactVersion(projectId, "LOGLINE",        r.data.logline,    meta);
  await saveArtifactVersion(projectId, "PREMISE",        r.data.premise,    meta);
  await saveArtifactVersion(projectId, "SYNOPSIS",       r.data.synopsis,   meta);
  await saveArtifactVersion(projectId, "OUTLINE",        r.data.outline,    meta);
  await saveArtifactVersion(projectId, "CHARACTER_ARCS", r.data.characters, meta);
  await saveArtifactVersion(projectId, "SCREENPLAY",     r.data.screenplay, meta);
}

/** Full sequential pipeline for longer films (>3 min) — 5 calls, more detailed. */
async function generateStoryFull(
  provider: TextGenerationProvider,
  modelId: string,
  projectId: string,
  brief: ProjectBrief,
  sys: string,
  meta: { providerId?: string; modelId?: string; jobId?: string },
): Promise<void> {
  const lr = await provider.generateStructured({ modelId, systemPrompt: sys, userPrompt: loglinePrompt(), schema: LoglineSchema });
  await saveArtifactVersion(projectId, "LOGLINE", lr.data.logline, meta);
  await saveArtifactVersion(projectId, "PREMISE", lr.data.premise, meta);
  const loglineText = `Logline: ${lr.data.logline}\nPremise: ${lr.data.premise}`;

  const sr = await provider.generateStructured({ modelId, systemPrompt: sys, userPrompt: synopsisPrompt(loglineText), schema: SynopsisSchema });
  await saveArtifactVersion(projectId, "SYNOPSIS", sr.data.synopsis, meta);

  const or_ = await provider.generateStructured({ modelId, systemPrompt: sys, userPrompt: outlinePrompt(sr.data.synopsis), schema: OutlineSchema });
  const outlineText = JSON.stringify(or_.data);
  await saveArtifactVersion(projectId, "OUTLINE", outlineText, meta);

  const cr = await provider.generateStructured({ modelId, systemPrompt: sys, userPrompt: characterArcsPrompt(outlineText), schema: CharacterArcSchema });
  const charText = JSON.stringify(cr.data);
  await saveArtifactVersion(projectId, "CHARACTER_ARCS", charText, meta);

  const sp = await provider.generateStructured({ modelId, systemPrompt: sys, userPrompt: screenplayPrompt(brief, outlineText, charText), schema: ScreenplaySchema });
  await saveArtifactVersion(projectId, "SCREENPLAY", JSON.stringify(sp.data), meta);
}
