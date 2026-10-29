import type { GenerationJob } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { claimNext, markRunning, markSucceeded, markFailed } from "./queue";
import { echoHandler }   from "./echo";
import { storyHandler }  from "./story-handler";
import { bibleHandler }  from "./bible-handler";
import { shotsHandler }  from "./shots-handler";
import { exportHandler } from "./export-handler";
import { imageGenerationHandler } from "./image-generation-handler";
import { videoGenerationHandler } from "./video-generation-handler";
import type { JobStatus } from "./state-machine";

const handlers: Record<string, (job: GenerationJob) => Promise<unknown>> = {
  ECHO:             echoHandler,
  STORY:            storyHandler,
  BIBLE_EXTRACTION: bibleHandler,
  SHOT_PLAN:        shotsHandler,
  EXPORT:           exportHandler,
  IMAGE_GENERATION: imageGenerationHandler,
  VIDEO_GENERATION: videoGenerationHandler,
};

const POLL_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * On startup, reconcile jobs left in a transitional state by a crash. For
 * Phase 0 we move them to NEEDS_USER_ACTION rather than blindly resubmitting,
 * honoring spec §10.6: "query provider status rather than resubmit blindly."
 */
async function reconcile(): Promise<void> {
  const stuck = await prisma.generationJob.findMany({
    where: { status: { in: ["SUBMITTING", "RUNNING", "WAITING_FOR_PROVIDER"] } },
  });
  for (const job of stuck) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "NEEDS_USER_ACTION",
        errorMessage: "Worker restarted while the job was in progress.",
      } as Partial<GenerationJob>,
    });
  }
  if (stuck.length) {
    logger.info({ count: stuck.length }, "reconciled stuck jobs to NEEDS_USER_ACTION");
  }
}

let running = false;

async function loop(): Promise<void> {
  while (running) {
    try {
      const job = await claimNext();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      logger.info({ jobId: job.id, type: job.jobType, attempt: job.attemptCount }, "processing job");
      const handler = handlers[job.jobType];
      if (!handler) {
        await markFailed(job.id, {
          code: "UNSUPPORTED_CAPABILITY",
          message: `No handler registered for job type ${job.jobType}`,
        });
        continue;
      }
      try {
        await markRunning(job.id);
        const result = await handler(job);
        await markSucceeded(job.id, typeof result === "object" && result ? (result as Record<string, unknown>) : { ok: true });
      } catch (err) {
        const code = (err as { code?: string })?.code ?? "UNKNOWN_PROVIDER_ERROR";
        const message = err instanceof Error ? err.message : String(err);
        await markFailed(job.id, { code, message, retryable: false });
      }
    } catch (err) {
      logger.error({ err }, "worker loop error");
      await sleep(POLL_MS);
    }
  }
}

export async function startWorker(): Promise<void> {
  if (running) return;
  running = true;
  logger.info("worker starting");
  await reconcile();
  loop().catch((err) => {
    logger.error({ err }, "worker loop crashed");
    running = false;
    process.exitCode = 1;
  });
}

export async function stopWorker(): Promise<void> {
  running = false;
}

export type { JobStatus };
