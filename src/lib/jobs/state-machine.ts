/**
 * Job state machine (spec §10.2). Pure functions, fully unit-tested.
 * SQLite/Prisma cannot enforce enums, so transitions are validated in domain
 * code before any DB update.
 */

export type JobStatus =
  | "QUEUED"
  | "SUBMITTING"
  | "SUBMITTED"
  | "RUNNING"
  | "WAITING_FOR_PROVIDER"
  | "RETRY_WAIT"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "NEEDS_USER_ACTION";

const TERMINAL: ReadonlySet<JobStatus> = new Set([
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "NEEDS_USER_ACTION",
]);

const ALLOWED: Record<JobStatus, JobStatus[]> = {
  QUEUED: ["SUBMITTING"],
  SUBMITTING: [
    "SUBMITTED",
    "RUNNING",
    "WAITING_FOR_PROVIDER",
    "RETRY_WAIT",
    "FAILED",
    "NEEDS_USER_ACTION",
  ],
  SUBMITTED: [
    "RUNNING",
    "WAITING_FOR_PROVIDER",
    "SUCCEEDED",
    "RETRY_WAIT",
    "FAILED",
    "CANCEL_REQUESTED",
  ],
  RUNNING: [
    "WAITING_FOR_PROVIDER",
    "SUCCEEDED",
    "RETRY_WAIT",
    "FAILED",
    "CANCEL_REQUESTED",
  ],
  WAITING_FOR_PROVIDER: [
    "RUNNING",
    "SUCCEEDED",
    "RETRY_WAIT",
    "FAILED",
    "CANCEL_REQUESTED",
  ],
  RETRY_WAIT: ["QUEUED", "FAILED", "NEEDS_USER_ACTION"],
  CANCEL_REQUESTED: ["CANCELLED", "RUNNING", "SUCCEEDED", "FAILED"],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
  NEEDS_USER_ACTION: [],
};

export function isTerminal(status: JobStatus): boolean {
  return TERMINAL.has(status);
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function transition(
  from: JobStatus,
  to: JobStatus,
): { ok: true } | { ok: false; error: string } {
  if (canTransition(from, to)) return { ok: true };
  return { ok: false, error: `Illegal job transition ${from} -> ${to}` };
}

/**
 * Retry only transient errors (spec §10.3). Do not retry auth, permission,
 * invalid request, content-policy, unsupported-capability, or quota without
 * user action.
 */
const TRANSIENT_RETRYABLE = new Set<JobStatusError>([
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
]);

export type JobStatusError =
  | "AUTHENTICATION_FAILED"
  | "PERMISSION_DENIED"
  | "QUOTA_EXCEEDED"
  | "CREDIT_EXHAUSTED"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_CAPABILITY"
  | "CONTENT_POLICY_REJECTED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "OUTPUT_UNAVAILABLE"
  | "OUTPUT_VALIDATION_FAILED"
  | "UNKNOWN_PROVIDER_ERROR";

export function isTransientRetryable(code: string): boolean {
  return (TRANSIENT_RETRYABLE as Set<string>).has(code);
}

/** Exponential backoff with jitter, capped at 30s (spec §10.3). */
export function backoffMs(attempt: number): number {
  const base = Math.min(2 ** attempt * 1000, 30000);
  const jitter = Math.random() * 500;
  return Math.round(base + jitter);
}
