import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { decryptSecret } from "@/lib/crypto/encrypt";
import { testOpenAIKey } from "@/lib/providers/openai-text";
import { testGeminiKey } from "@/lib/providers/gemini-text";
import { testKlingKey } from "@/lib/providers/kling-video";
import { testFalKey } from "@/lib/providers/lipsync/fal-liveportrait";
import { testHedraKey } from "@/lib/providers/lipsync/hedra";

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

  let result: { ok: boolean; model: string; error?: string };
  if (conn.providerId === "gemini") {
    result = await testGeminiKey(apiKey);
  } else if (conn.providerId === "kling") {
    result = await testKlingKey(apiKey);
  } else if (conn.providerId === "fal") {
    result = await testFalKey(apiKey);
  } else if (conn.providerId === "hedra") {
    result = await testHedraKey(apiKey);
  } else {
    result = await testOpenAIKey(apiKey);
  }

  await prisma.providerConnection.update({
    where: { id: conn.id },
    data: { status: result.ok ? "CONNECTED" : "ERROR", lastVerifiedAt: new Date() },
  });

  return { ok: result.ok, model: result.model, error: result.error };
});
