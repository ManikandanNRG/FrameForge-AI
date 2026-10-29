import type { GenerationJob } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { extractBible } from "@/lib/bible/service";

export async function bibleHandler(job: GenerationJob): Promise<{ ok: true }> {
  const payload = JSON.parse(job.requestPayload || "{}") as {
    projectId: string; useMock?: boolean;
  };
  const { projectId, useMock = false } = payload;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const { provider, modelId } = await resolveTextProvider(project.ownerId, useMock);

  const artifact = await prisma.storyArtifact.findFirst({
    where: { projectId, artifactType: "SCREENPLAY" },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  const screenplayText = artifact?.versions[0]?.contentText ?? "";

  await extractBible(provider, modelId, projectId, screenplayText, job.id);
  return { ok: true };
}
