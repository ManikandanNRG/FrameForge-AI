import type { GenerationJob } from "@prisma/client";
import { claimSpecificJob, markFailed, markRunning, markSucceeded } from "./queue";

/**
 * Schedules background execution inside the Next.js server process so queued
 * jobs execute reliably even when a separate worker process (`npm run worker`)
 * is not running. Safe alongside an external worker thanks to atomic claimSpecificJob.
 */
export function runJobsInBackground(
  jobIds: string[],
  loadHandler: () => Promise<(job: GenerationJob) => Promise<unknown>>,
  failureCode = "JOB_EXECUTION_FAILED",
): void {
  if (!jobIds.length) return;
  setImmediate(async () => {
    const handler = await loadHandler();
    for (const jobId of jobIds) {
      try {
        const claimed = await claimSpecificJob(jobId);
        if (!claimed) continue;
        await markRunning(claimed.id);
        const result = await handler(claimed);
        const payload =
          typeof result === "object" && result !== null
            ? (result as Record<string, unknown>)
            : { ok: true };
        await markSucceeded(claimed.id, payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await markFailed(jobId, { code: failureCode, message: msg, retryable: false }).catch(() => {});
      }
    }
  });
}
