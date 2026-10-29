import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client reused across hot reloads in dev (Next dev recreates
 * modules; without this you exhaust DB connections). The worker imports the
 * same singleton.
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
