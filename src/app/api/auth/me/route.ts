import { apiHandler } from "@/lib/api/handler";
import { getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db/client";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (session.loggedIn && session.userId) {
    return { loggedIn: true, user: { id: session.userId, email: session.email } };
  }
  if (env.NODE_ENV !== "production") {
    const owner = await prisma.user.upsert({
      where: { email: env.OWNER_EMAIL },
      update: {},
      create: { email: env.OWNER_EMAIL, displayName: "Owner" },
    });
    session.userId = owner.id;
    session.email = owner.email;
    session.loggedIn = true;
    try {
      await session.save();
    } catch {}
    return { loggedIn: true, user: { id: owner.id, email: owner.email } };
  }
  return { loggedIn: false };
});
