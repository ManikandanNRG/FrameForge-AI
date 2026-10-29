import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { fileChecksum } from "@/lib/media/media-root";

const bodySchema = z.object({
  rootId: z.string().min(1),
  sub: z.string().min(1),
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid request", parsed.error.issues);
  const { rootId, sub } = parsed.data;

  const root = await prisma.mediaRoot.findFirst({ where: { id: rootId, ownerId } });
  if (!root) throw notFound("Media root not found");

  const result = await fileChecksum(root.path, sub);
  return { checksum: result };
});
