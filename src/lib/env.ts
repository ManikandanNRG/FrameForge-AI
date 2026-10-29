import { z } from "zod";

/**
 * Validate environment configuration. Fails fast with a clear message if a
 * required variable is missing or invalid (spec §13.5). The schema is
 * exported so tests can validate synthetic input without touching process.env.
 */

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  AUTH_PASSCODE: z.string().min(1, "AUTH_PASSCODE is required"),
  OWNER_EMAIL: z.string().min(1).default("owner@local"),
  MEDIA_DEFAULT_ROOT: z.string().optional(),
  APP_ENCRYPTION_KEY: z.string().optional(),
  LOG_LEVEL: z.string().optional().default("info"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  src: Record<string, string | undefined> = process.env,
): Env {
  const parsed = envSchema.safeParse(src);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n  ");
    throw new Error(
      `Invalid environment configuration:\n  ${issues}\n\nCopy .env.example to .env and fill in the required values.`,
    );
  }
  return parsed.data;
}

/** Validated, typed environment for the running process. */
export const env = loadEnv(process.env);
