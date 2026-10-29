import { apiHandler } from "@/lib/api/handler";
import { forbidden, notFound, conflict } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

/** POST — approve the current version (immutable after this point). */
export const POST = apiHandler(async (_req, ctx) => {
  const ownerId = await requireUserId();
  const { artifactId } = await ctx.params;

  const artifact = await prisma.storyArtifact.findUnique({
    where: { id: artifactId as string },
    include: { project: true },
  });
  if (!artifact) throw notFound();
  if (artifact.project.ownerId !== ownerId) throw forbidden();
  if (!artifact.currentVersionId) throw conflict("No version to approve");

  // Mark the current version approved (immutable from here — spec AC-03)
  await prisma.artifactVersion.update({
    where: { id: artifact.currentVersionId },
    data:  { approvedAt: new Date(), approvedByUserId: ownerId },
  });

  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data:  { approvalStatus: "APPROVED" },
  });

  return { ok: true, artifactId: artifact.id, approvalStatus: "APPROVED" };
});
