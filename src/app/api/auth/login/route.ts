import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";

const bodySchema = z.object({ passcode: z.string().min(1) });

/** Single-user login (Phase 0). Validates the passcode, then find-or-create the owner. */
export const POST = apiHandler(async (req) => {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("passcode is required", parsed.error.issues);
  const { passcode } = parsed.data;

  if (passcode !== env.AUTH_PASSCODE) {
    throw badRequest("Invalid passcode");
  }

  // Find or create the single local owner user.
  const user = await prisma.user.upsert({
    where: { email: env.OWNER_EMAIL },
    update: {},
    create: { email: env.OWNER_EMAIL, displayName: "Owner" },
  });

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.loggedIn = true;
  await session.save();

  return { ok: true, user: { id: user.id, email: user.email } };
});
