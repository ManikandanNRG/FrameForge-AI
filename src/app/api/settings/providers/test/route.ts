import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { testOpenAIKey } from "@/lib/providers/openai-text";
import { testGeminiKey } from "@/lib/providers/gemini-text";
import { testKlingKey } from "@/lib/providers/kling-video";

const bodySchema = z.object({ connectionId: z.string().min(1) });

export const POST = apiHandler(async (req) => {
  const ownerId = await requireUserId();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) throw badRequest("connectionId required");

  const conn = await prisma.providerConnection.findFirst({
    where: { id: parsed.data.connectionId, ownerId },
  });
  if (!conn) throw notFound("Provider connection not found");

  const apiKey = decryptSecret(conn.encryptedKey);

  const result = conn.providerId === "gemini"
    ? await testGeminiKey(apiKey)
    : conn.providerId === "kling"
    ? await testKlingKey(apiKey)
    : await testOpenAIKey(apiKey);

  await prisma.providerConnection.update({
    where: { id: conn.id },
    data: { status: result.ok ? "CONNECTED" : "ERROR", lastVerifiedAt: new Date() },
  });

  return { ok: result.ok, model: result.model, error: result.error };
});
