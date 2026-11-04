import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const patchSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  attributes: z.string().optional(),
  approvalStatus: z.string().optional(),
});

export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, assetId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid update payload", parsed.error.issues);

  const updated = await prisma.productionAsset.update({
    where: { id: assetId as string },
    data: parsed.data,
  });

  return { asset: updated };
});

