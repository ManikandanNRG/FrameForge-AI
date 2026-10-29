import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { encryptSecret } from "@/lib/crypto/encrypt";

const saveSchema = z.object({
  providerId:  z.enum(["openai", "gemini", "kling"]),
  displayName: z.string().optional(),
  apiKey:      z.string().min(10, "API key looks too short"),
});

export const GET = apiHandler(async () => {
  const ownerId = await requireUserId();
  const conns = await prisma.providerConnection.findMany({
    where:   { ownerId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, providerId: true, displayName: true,
      status: true, lastVerifiedAt: true, isEnabled: true, createdAt: true,
    },
  });
  return { providers: conns };
});

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = saveSchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("Invalid provider data", parsed.error.issues);
  const { providerId, displayName, apiKey } = parsed.data;

  const encrypted = encryptSecret(apiKey);
  const label = displayName ?? (providerId === "gemini" ? "Google Gemini" : providerId === "kling" ? "Kling AI" : "OpenAI");

  const existing = await prisma.providerConnection.findFirst({
    where: { ownerId, providerId },
  });

  let conn;
  if (existing) {
    conn = await prisma.providerConnection.update({
      where: { id: existing.id },
      data: { encryptedKey: encrypted, displayName: label, status: "NOT_TESTED", isEnabled: true },
    });
  } else {
    conn = await prisma.providerConnection.create({
      data: { ownerId, providerId, displayName: label, encryptedKey: encrypted, status: "NOT_TESTED" },
    });
  }

  return { provider: { id: conn.id, providerId: conn.providerId, status: conn.status } };
});
