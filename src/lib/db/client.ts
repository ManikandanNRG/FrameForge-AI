import { PrismaClient } from "@prisma/client";

/**
 * Single Prisma client reused across hot reloads in dev (Next dev recreates
 * modules; without this you exhaust DB connections). The worker imports the
 * same singleton.
 *
 * If the schema was updated and the cached dev instance lacks newly added
 * delegates (e.g. `directorThread`), replace the stale singleton cleanly.
 */
const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function resolvePrismaClient(): PrismaClient {
  const cached = globalForPrisma.__prisma as
    | (PrismaClient & { directorThread?: unknown })
    | undefined;

  if (cached && cached.directorThread) {
    return cached;
  }

  if (cached && !cached.directorThread) {
    void cached.$disconnect().catch(() => {});
  }

  return new PrismaClient({ log: ["warn", "error"] });
}

export const prisma = resolvePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}
