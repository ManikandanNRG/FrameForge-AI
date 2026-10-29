import { apiHandler } from "@/lib/api/handler";
import { prisma } from "@/lib/db/client";

/** Liveness + readiness. Public (no auth). Pings the DB. */
export const GET = apiHandler(async () => {
  let db: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "ok";
  } catch {
    db = "error";
  }
  return {
    status: "ok",
    service: "ai-filmmaking-studio",
    phase: "0",
    db,
    time: new Date().toISOString(),
  };
});
