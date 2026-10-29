import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const bodySchema = z.object({ mediaId: z.string().optional() });

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId, shotId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound();
  if (project.ownerId !== ownerId) throw forbidden();

  const shot = await prisma.shot.findFirst({ where: { id: shotId as string, projectId: projectId as string } });
  if (!shot) throw notFound("Shot not found");

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw badRequest("Invalid body");

  // Mark the shot approved (and optionally the selected media version)
  await prisma.shot.update({
    where: { id: shotId as string },
    data: {
      approvalStatus: "APPROVED",
      selectedVideoId: parsed.data.mediaId ?? shot.selectedVideoId,
    },
  });

  if (parsed.data.mediaId) {
    await prisma.shotMedia.update({
      where: { id: parsed.data.mediaId },
      data: { approvalStatus: "APPROVED", approvedAt: new Date() },
    });
  }

  return { ok: true };
});
