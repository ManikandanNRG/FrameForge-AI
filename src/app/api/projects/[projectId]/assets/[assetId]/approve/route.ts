import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

export const POST = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, assetId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  await prisma.productionAsset.update({
    where: { id: assetId as string },
    data: { approvalStatus: "APPROVED" },
  });

  return { ok: true };
});
