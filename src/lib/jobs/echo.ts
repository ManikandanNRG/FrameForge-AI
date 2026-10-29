import type { GenerationJob } from "@prisma/client";

/**
 * Phase 0 no-op job. Proves the queue + worker end-to-end without making any
 * AI / paid call (spec §18 Phase 0 exit criteria: "no paid AI calls by default").
 */
export async function echoHandler(job: GenerationJob): Promise<{
  echoed: boolean;
  processedAt: string;
  payload: unknown;
}> {
  let payload: unknown = {};
  try {
    payload = JSON.parse(job.requestPayload || "{}");
  } catch {
    payload = {};
  }
  return {
    echoed: true,
    processedAt: new Date().toISOString(),
    payload,
  };
}
