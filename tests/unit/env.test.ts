import { describe, it, expect } from "vitest";
import { loadEnv, envSchema } from "@/lib/env";

function validInput() {
  return {
    DATABASE_URL: "file:./prisma/dev.db",
    SESSION_SECRET: "x".repeat(64),
    AUTH_PASSCODE: "frameforge",
  };
}

describe("env validation", () => {
  it("parses a valid configuration with defaults applied", () => {
    const env = loadEnv(validInput());
    expect(env.DATABASE_URL).toBe("file:./prisma/dev.db");
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.OWNER_EMAIL).toBe("owner@local");
  });

  it("rejects a too-short session secret", () => {
    expect(() => loadEnv({ ...validInput(), SESSION_SECRET: "short" })).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => loadEnv({} as Record<string, string>)).toThrow();
    // Schema-level: safeParse surfaces the issues.
    const result = envSchema.safeParse({ DATABASE_URL: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() => loadEnv({ ...validInput(), NODE_ENV: "staging" })).toThrow();
  });
});
