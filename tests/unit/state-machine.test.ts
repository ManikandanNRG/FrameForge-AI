import { describe, it, expect } from "vitest";
import {
  canTransition,
  isTerminal,
  isTransientRetryable,
  transition,
  backoffMs,
} from "@/lib/jobs/state-machine";

describe("job state machine", () => {
  it("allows the documented transitions", () => {
    expect(canTransition("QUEUED", "SUBMITTING")).toBe(true);
    expect(canTransition("SUBMITTING", "RUNNING")).toBe(true);
    expect(canTransition("RUNNING", "SUCCEEDED")).toBe(true);
    expect(canTransition("RETRY_WAIT", "QUEUED")).toBe(true);
    expect(canTransition("CANCEL_REQUESTED", "CANCELLED")).toBe(true);
  });

  it("rejects illegal transitions", () => {
    expect(canTransition("QUEUED", "SUCCEEDED")).toBe(false);
    expect(canTransition("SUCCEEDED", "RUNNING")).toBe(false);
    expect(canTransition("FAILED", "QUEUED")).toBe(false);
    expect(canTransition("QUEUED", "CANCELLED")).toBe(false);
  });

  it("transition returns an error message for illegal moves", () => {
    const result = transition("SUCCEEDED", "RUNNING");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Illegal");
  });

  it("treats terminal states as terminal", () => {
    for (const s of [
      "SUCCEEDED",
      "FAILED",
      "CANCELLED",
      "NEEDS_USER_ACTION",
    ] as const) {
      expect(isTerminal(s)).toBe(true);
    }
    expect(isTerminal("RUNNING")).toBe(false);
  });

  it("classifies only transient errors as retryable", () => {
    expect(isTransientRetryable("RATE_LIMITED")).toBe(true);
    expect(isTransientRetryable("PROVIDER_UNAVAILABLE")).toBe(true);
    expect(isTransientRetryable("PROVIDER_TIMEOUT")).toBe(true);
    expect(isTransientRetryable("AUTHENTICATION_FAILED")).toBe(false);
    expect(isTransientRetryable("CONTENT_POLICY_REJECTED")).toBe(false);
    expect(isTransientRetryable("QUOTA_EXCEEDED")).toBe(false);
  });

  it("produces bounded backoff with jitter", () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const ms = backoffMs(attempt);
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(30500);
    }
  });
});
