import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { quickAuditScript, polishScreenplayWithAI, type RawSceneInput } from "@/lib/story/script-doctor";

const requestSchema = z.object({
  action: z.enum(["audit", "polish"]).default("audit"),
  scenes: z.array(
    z.object({
      sceneNumber: z.number(),
      heading: z.string(),
      location: z.string(),
      timeOfDay: z.string(),
      action: z.string(),
      dialogue: z.string().optional().default(""),
      voiceover: z.string().optional().default(""),
      audioScript: z.string().optional().default(""),
      estimatedDurationSeconds: z.number().optional().default(8),
    })
  ).optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
    include: {
      storyArtifacts: {
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      },
      scenes: { orderBy: { sceneNumber: "asc" } },
    },
  });

  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid script doctor parameters", parsed.error.issues);

  const { action, scenes: incomingScenes } = parsed.data;

  // 1. Resolve scenes: incoming from client OR from SCREENPLAY artifact OR from DB scenes
  let scenes: RawSceneInput[] = incomingScenes || [];
  if (scenes.length === 0) {
    const spArtifact = project.storyArtifacts.find((a) => a.artifactType === "SCREENPLAY");
    const spVersion = spArtifact?.versions[0];
    if (spVersion?.contentText) {
      try {
        const parsedJson = JSON.parse(spVersion.contentText);
        if (Array.isArray(parsedJson.scenes) && parsedJson.scenes.length > 0) {
          scenes = parsedJson.scenes;
        }
      } catch {}
    }
  }

  // Fallback to DB scenes if artifact was empty
  if (scenes.length === 0 && project.scenes.length > 0) {
    scenes = project.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      location: s.location || "Main Location",
      timeOfDay: s.timeOfDay || "DAY",
      action: s.actionSummary,
      dialogue: "",
      voiceover: "",
      audioScript: "",
      estimatedDurationSeconds: s.estimatedDurationSeconds,
    }));
  }

  if (scenes.length === 0) {
    throw badRequest("No scenes found to audit. Please generate story options or scenes first.");
  }

  // 2. Perform Quick Audit
  const auditReport = quickAuditScript(scenes, {
    genre: project.genre,
    tone: project.tone,
    visualStyle: project.visualStyle,
    storyLanguage: project.storyLanguage,
    dialogueMode: project.dialogueMode,
    sourceIdea: project.sourceIdea,
  });

  if (action === "audit") {
    return {
      report: auditReport,
      sceneCount: scenes.length,
    };
  }

  // 3. Action = "polish"
  const { provider, modelId } = await resolveTextProvider(ownerId, false);
  const polishedScenes = await polishScreenplayWithAI(
    provider,
    modelId,
    scenes,
    {
      title: project.title,
      genre: project.genre,
      tone: project.tone,
      visualStyle: project.visualStyle,
      storyLanguage: project.storyLanguage,
      dialogueMode: project.dialogueMode,
      sourceIdea: project.sourceIdea,
    },
    auditReport
  );

  // Save new SCREENPLAY artifact version
  const spArtifact = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: project.id, artifactType: "SCREENPLAY" } },
    create: { projectId: project.id, artifactType: "SCREENPLAY", approvalStatus: "APPROVED" },
    update: { approvalStatus: "APPROVED" },
  });

  const count = await prisma.artifactVersion.count({ where: { artifactId: spArtifact.id } });
  const screenplayJson = {
    title: project.title,
    scenes: polishedScenes,
    totalEstimatedDurationSeconds: polishedScenes.reduce((acc, s) => acc + (s.estimatedDurationSeconds || 8), 0),
  };

  const newVersion = await prisma.artifactVersion.create({
    data: {
      artifactId: spArtifact.id,
      versionNumber: count + 1,
      contentText: JSON.stringify(screenplayJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });

  await prisma.storyArtifact.update({
    where: { id: spArtifact.id },
    data: { currentVersionId: newVersion.id },
  });

  // Re-run quick audit on the polished screenplay
  const updatedReport = quickAuditScript(polishedScenes, {
    genre: project.genre,
    tone: project.tone,
    visualStyle: project.visualStyle,
    storyLanguage: project.storyLanguage,
    dialogueMode: project.dialogueMode,
    sourceIdea: project.sourceIdea,
  });

  return {
    success: true,
    polishedScenes,
    report: updatedReport,
  };
});
