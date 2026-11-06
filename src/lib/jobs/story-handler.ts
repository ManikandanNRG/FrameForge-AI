import type { GenerationJob } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { generateStory } from "@/lib/story/service";
import type { ProjectBrief } from "@/lib/story/prompts";

export async function storyHandler(job: GenerationJob): Promise<{ ok: true }> {
  const payload = JSON.parse(job.requestPayload || "{}") as {
    projectId: string; modelId?: string; useMock?: boolean;
  };
  const { projectId, useMock = false } = payload;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { provider, modelId } = await resolveTextProvider(project.ownerId, useMock);

  const brief: ProjectBrief = {
    title:                project.title,
    sourceIdea:           project.sourceIdea,
    genre:                project.genre ?? undefined,
    tone:                 project.tone ?? undefined,
    visualStyle:          project.visualStyle,
    dialogueMode:         project.dialogueMode,
    targetRuntimeMinutes: Math.max(1, Math.round((project.targetRuntime || 60) / 60)),
    targetRuntimeSeconds: project.targetRuntime || 60,
    audience:             project.audience ?? undefined,
    storyLanguage:        project.storyLanguage,
  };

  await generateStory(provider, modelId, projectId, brief, job.id);
  return { ok: true };
}
