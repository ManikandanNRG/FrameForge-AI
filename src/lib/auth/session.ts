import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { env } from "@/lib/env";
import { unauthorized } from "@/lib/errors";
import { prisma } from "@/lib/db/client";

/**
 * Single-user localhost auth (Phase 0). A signed/encrypted cookie holds the
 * logged-in user id. The Express/Auth.js + multi-user model is deferred; this
 * keeps a userId on the session so ownership checks and the upgrade path stay
 * intact (spec §12.1, §6.2).
 */
export interface SessionData {
  userId?: string;
  email?: string;
  loggedIn?: boolean;
}

export function sessionOptions(): SessionOptions {
  return {
    password: env.SESSION_SECRET,
    cookieName: "afs_session",
    cookieOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export async function getSession() {
  const c = await cookies();
  return getIronSession<SessionData>(c, sessionOptions());
}

/** Throws 401 if not logged in; otherwise returns the owner user id. */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (session.userId) return session.userId;

  // Single-user localhost development resilience (Phase 0 spec §12.1, §6.2)
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
    } catch {
      // In read-only cookie contexts, ignore cookie persist error
    }
    return owner.id;
  }

  throw unauthorized();
}
