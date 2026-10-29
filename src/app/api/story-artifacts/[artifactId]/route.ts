import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

const editSchema = z.object({ contentText: z.string().min(1) });

/** PATCH — create a new user-edit version (never overwrites approved). */
export const PATCH = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { artifactId } = await ctx.params;
  const artifact = await prisma.storyArtifact.findUnique({
    where: { id: artifactId as string },
    include: { project: true },
  });
  if (!artifact) throw notFound();
  if (artifact.project.ownerId !== ownerId) throw forbidden();

  const parsed = editSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("contentText required");

  const count = await prisma.artifactVersion.count({ where: { artifactId: artifact.id } });
  const version = await prisma.artifactVersion.create({
    data: {
      artifactId:    artifact.id,
      versionNumber: count + 1,
      contentText:   parsed.data.contentText,
      source:        "USER",
      createdByUserId: ownerId,
    },
  });

  await prisma.storyArtifact.update({
    where: { id: artifact.id },
    data:  { currentVersionId: version.id, approvalStatus: "DRAFT" },
  });

  return { version };
});
