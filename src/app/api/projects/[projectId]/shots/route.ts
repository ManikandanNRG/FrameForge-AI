import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { enqueue } from "@/lib/jobs/queue";

export const GET = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const scenes = await prisma.scene.findMany({
    where: { projectId: projectId as string },
    include: {
      shots: {
        include: {
          mediaVersions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { shotNumber: "asc" },
      },
    },
    orderBy: { sceneNumber: "asc" },
  });
  return { scenes };
});

const generateSchema = z.object({ modelId: z.string().optional(), useMock: z.boolean().optional() });

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;
  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = generateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid request");
  const { modelId = "gpt-4o-mini", useMock = false } = parsed.data;

  if (!useMock) {
    const conn = await prisma.providerConnection.findFirst({ where: { ownerId, providerId: { in: ["openai","gemini"] }, isEnabled: true } });
    if (!conn) throw badRequest("No AI provider configured.");
  }

  const job = await enqueue({
    jobType: "SHOT_PLAN",
    idempotencyKey: `shots-${projectId as string}-${Date.now()}`,
    requestPayload: { projectId, modelId, useMock },
    projectId: projectId as string,
  });
  return { jobId: job.id, status: job.status };
});
