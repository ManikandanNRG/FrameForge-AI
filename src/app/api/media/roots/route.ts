import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { listRoots, addRoot, rootAvailability } from "@/lib/media/media-root";

const addSchema = z.object({
  label: z.string().min(1).max(100),
  path: z.string().min(1),
});

export const GET = apiHandler(async () => {
  const ownerId = await requireUserId();
  const roots = await listRoots(ownerId);
  // Attach live availability for each root.
  const withStatus = await Promise.all(
    roots.map(async (r) => ({ ...r, ...(await rootAvailability(r.path)) })),
  );
  return { roots: withStatus };
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid root", parsed.error.issues);
  const root = await addRoot(ownerId, parsed.data.label, parsed.data.path);
  return { root };
});

export const DELETE = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const url = new URL(req.url);
  const rootId = url.searchParams.get("id");
  if (!rootId) throw badRequest("id is required");
  await prisma.mediaRoot.deleteMany({ where: { id: rootId, ownerId } });
  return { ok: true };
});
