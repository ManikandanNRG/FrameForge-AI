import { prisma } from "@/lib/db/client";
import type { GenerationJob } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  transition,
  isTerminal,
  isTransientRetryable,
  backoffMs,
  type JobStatus,
  type JobStatusError,
} from "./state-machine";

/**
 * Database-backed job queue (no Redis). PostgreSQL is the durable record in
 * the spec; here SQLite plays that role for localhost Phase 0. The DB is the
 * source of truth, the in-process worker is transport (spec §10.1).
 */

export interface EnqueueInput {
  jobType: string;
  requestPayload?: Record<string, unknown>;
  idempotencyKey?: string;
  projectId?: string | null;
}

export async function enqueue(input: EnqueueInput): Promise<GenerationJob> {
  const key = input.idempotencyKey ?? randomUUID();
  return prisma.generationJob.create({
    data: {
      jobType: input.jobType,
      idempotencyKey: key,
      requestPayload: JSON.stringify(input.requestPayload ?? {}),
      projectId: input.projectId ?? null,
      status: "QUEUED",
    },
  });
}

/**
 * Single-worker-safe claim: find the oldest eligible job (QUEUED, or RETRY_WAIT
 * whose nextRetryAt has passed) and atomically flip it to SUBMITTING only if it
 * is still in its previous status. The conditional updateMany prevents a race.
 */
export async function claimNext(): Promise<GenerationJob | null> {
  return prisma.$transaction(async (tx) => {
    const eligible = await tx.generationJob.findFirst({
      where: {
        OR: [
          { status: "QUEUED" },
          { status: "RETRY_WAIT", nextRetryAt: { lte: new Date() } },
        ],
      },
      orderBy: [{ nextRetryAt: "asc" }, { createdAt: "asc" }],
    });
    if (!eligible) return null;
    const taken = await tx.generationJob.updateMany({
      where: { id: eligible.id, status: eligible.status },
      data: {
        status: "SUBMITTING",
        startedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });
    if (taken.count === 0) return null;
    return tx.generationJob.findUnique({ where: { id: eligible.id } });
  });
}

async function setStatus(
  id: string,
  to: JobStatus,
  patch: Partial<GenerationJob> = {},
): Promise<GenerationJob> {
  const job = await prisma.generationJob.findUnique({ where: { id } });
  if (!job) throw new Error(`Job not found: ${id}`);
  const result = transition(job.status as JobStatus, to);
  if (!result.ok) throw new Error(result.error);
  const finishedAt = isTerminal(to) ? new Date() : undefined;
  return prisma.generationJob.update({
    where: { id },
    data: { status: to, finishedAt, ...patch },
  });
}

export async function markRunning(id: string): Promise<GenerationJob> {
  return setStatus(id, "RUNNING");
}

export async function markWaitingForProvider(id: string): Promise<GenerationJob> {
  return setStatus(id, "WAITING_FOR_PROVIDER");
}

export async function markSucceeded(
  id: string,
  result?: Record<string, unknown>,
): Promise<GenerationJob> {
  return setStatus(id, "SUCCEEDED", {
    resultPayload: JSON.stringify(result ?? {}),
    progressPercent: 100,
    errorCode: null,
    errorMessage: null,
  });
}

export async function markFailed(
  id: string,
  failure: { code: string; message: string; retryable?: boolean },
): Promise<GenerationJob> {
  const job = await prisma.generationJob.findUnique({ where: { id } });
  if (!job) throw new Error(`Job not found: ${id}`);
  const wantRetry =
    (failure.retryable ?? false) &&
    isTransientRetryable(failure.code) &&
    job.attemptCount < job.maxAttempts;

  if (wantRetry) {
    const result = transition(job.status as JobStatus, "RETRY_WAIT");
    if (result.ok) {
      return prisma.generationJob.update({
        where: { id },
        data: {
          status: "RETRY_WAIT",
          errorCode: failure.code,
          errorMessage: failure.message,
          retryable: true,
          nextRetryAt: new Date(Date.now() + backoffMs(job.attemptCount)),
          startedAt: null,
          finishedAt: null,
        },
      });
    }
  }
  return setStatus(id, "FAILED", {
    errorCode: failure.code,
    errorMessage: failure.message,
    retryable: false,
  });
}

/** User requests cancellation; the provider may still report completion later. */
export async function requestCancel(id: string): Promise<GenerationJob> {
  const job = await prisma.generationJob.findUnique({ where: { id } });
  if (!job) throw new Error(`Job not found: ${id}`);
  if (transition(job.status as JobStatus, "CANCEL_REQUESTED").ok) {
    return setStatus(id, "CANCEL_REQUESTED");
  }
  // Already terminal; return as-is.
  return job;
}

export async function listJobs(filter?: {
  projectId?: string;
  status?: JobStatus;
}): Promise<GenerationJob[]> {
  return prisma.generationJob.findMany({
    where: {
      projectId: filter?.projectId,
      status: filter?.status,
    },
    orderBy: { createdAt: "desc" },
  });
}
