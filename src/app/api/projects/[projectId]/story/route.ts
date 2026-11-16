import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";

/** GET — retrieve all story artifacts and their current versions. */
export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  let artifacts = await prisma.storyArtifact.findMany({
    where: { projectId: projectId as string },
    include: { versions: { orderBy: { versionNumber: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  // Ensure foundation story artifacts (LOGLINE, PREMISE, SYNOPSIS) exist
  const hasLogline = artifacts.some(a => a.artifactType === "LOGLINE");
  const hasPremise = artifacts.some(a => a.artifactType === "PREMISE");
  const hasSynopsis = artifacts.some(a => a.artifactType === "SYNOPSIS");
  const screenplayArt = artifacts.find(a => a.artifactType === "SCREENPLAY");

  if ((!hasLogline || !hasPremise || !hasSynopsis) && (screenplayArt || project.sourceIdea)) {
    const latestVersion = screenplayArt?.versions[screenplayArt.versions.length - 1];
    let scenes: any[] = [];
    let spTitle = project.title;
    if (latestVersion?.contentText) {
      try {
        const parsed = JSON.parse(latestVersion.contentText);
        if (parsed?.scenes && Array.isArray(parsed.scenes)) scenes = parsed.scenes;
        if (parsed?.title) spTitle = parsed.title;
      } catch {}
    }

    const loglineText =
      project.description ||
      (scenes[0]?.action ? `${spTitle}: ${scenes[0].action.slice(0, 160)}...` : null) ||
      project.sourceIdea ||
      `${spTitle} — An original cinematic visual journey.`;

    const premiseText = project.sourceIdea
      ? `Original Idea: "${project.sourceIdea}". Developed into a cinematic short film set in ${project.visualStyle.replace(/_/g, " ")}, combining dynamic pacing with authentic narrative tension.`
      : `${spTitle} is an original visual short exploring character tension and sensory atmosphere in ${project.visualStyle.replace(/_/g, " ")}.`;

    const act1 = scenes.slice(0, Math.max(1, Math.floor(scenes.length / 3))).map(s => s.action).join(" ");
    const act2 = scenes.slice(Math.max(1, Math.floor(scenes.length / 3)), Math.max(2, Math.floor((scenes.length * 2) / 3))).map(s => s.action).join(" ");
    const act3 = scenes.slice(Math.max(2, Math.floor((scenes.length * 2) / 3))).map(s => s.action).join(" ");

    const synopsisText = scenes.length > 0
      ? `STORY ARC & NARRATIVE SYNOPSIS:\n\n` +
        `ACT 1 (Setup & Hook):\n${act1 || "Introduction of characters and central dramatic hook."}\n\n` +
        `ACT 2 (Escalation & Craft):\n${act2 || "Rising dramatic tension and dynamic cinematic action."}\n\n` +
        `ACT 3 (Climax & Viral Payoff):\n${act3 || "Climactic resolution and memorable visual payoff."}`
      : premiseText;

    if (!hasLogline) {
      const art = await prisma.storyArtifact.create({
        data: {
          projectId: projectId as string,
          artifactType: "LOGLINE",
          approvalStatus: "DRAFT",
          versions: {
            create: {
              versionNumber: 1,
              contentText: loglineText,
              source: "AI",
              createdByUserId: ownerId,
            },
          },
        },
        include: { versions: true },
      });
      await prisma.storyArtifact.update({ where: { id: art.id }, data: { currentVersionId: art.versions[0]?.id } });
    }

    if (!hasPremise) {
      const art = await prisma.storyArtifact.create({
        data: {
          projectId: projectId as string,
          artifactType: "PREMISE",
          approvalStatus: "DRAFT",
          versions: {
            create: {
              versionNumber: 1,
              contentText: premiseText,
              source: "AI",
              createdByUserId: ownerId,
            },
          },
        },
        include: { versions: true },
      });
      await prisma.storyArtifact.update({ where: { id: art.id }, data: { currentVersionId: art.versions[0]?.id } });
    }

    if (!hasSynopsis) {
      const art = await prisma.storyArtifact.create({
        data: {
          projectId: projectId as string,
          artifactType: "SYNOPSIS",
          approvalStatus: "DRAFT",
          versions: {
            create: {
              versionNumber: 1,
              contentText: synopsisText,
              source: "AI",
              createdByUserId: ownerId,
            },
          },
        },
        include: { versions: true },
      });
      await prisma.storyArtifact.update({ where: { id: art.id }, data: { currentVersionId: art.versions[0]?.id } });
    }

    artifacts = await prisma.storyArtifact.findMany({
      where: { projectId: projectId as string },
      include: { versions: { orderBy: { versionNumber: "asc" } } },
      orderBy: { createdAt: "asc" },
    });
  }

  return { artifacts };
});

const generateSchema = z.object({
  modelId:  z.string().optional(),
  useMock:  z.boolean().optional(),
});

/** POST /generate — enqueue a STORY generation job. */
export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = generateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid request");
  const { modelId = "gpt-4o-mini", useMock = false } = parsed.data;

  // Check a provider is configured (unless mock)
  if (!useMock) {
    const conn = await prisma.providerConnection.findFirst({
      where: { ownerId, providerId: { in: ["openai", "gemini", "openrouter"] }, isEnabled: true },
    });
    if (!conn) throw badRequest("No AI provider configured. Go to Settings → Providers to add an OpenRouter, Gemini (free), or OpenAI key.");
  }

  const job = await enqueue({
    jobType:        "STORY",
    idempotencyKey: `story-${projectId as string}-${Date.now()}`,
    requestPayload: { projectId, modelId, useMock },
    projectId:      projectId as string,
  });

  return { jobId: job.id, status: job.status };
});
