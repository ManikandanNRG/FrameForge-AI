import type { LipSyncProvider, LipSyncInput, LipSyncResult } from "./types";
import { logger } from "@/lib/logger";

/**
 * Kling AI Lip-Sync Provider (/v1/videos/lip-sync)
 * Billed against Kling API balance.
 */
export class KlingLipSyncProvider implements LipSyncProvider {
  id = "kling-lipsync";
  name = "Kling AI Lip-Sync";

  constructor(private apiKey: string) {}

  async generateLipSync(input: LipSyncInput): Promise<LipSyncResult> {
    logger.info({ imagePath: input.imagePath }, "submitting Kling Lip-Sync job");
    // Kling requires active credit balance on developer console.
    throw new Error(
      "Kling Lip-Sync requires prepaid credits on api.klingai.com. Use fal.ai (LivePortrait) for $0.01 per clip or local motion.",
    );
  }
}

