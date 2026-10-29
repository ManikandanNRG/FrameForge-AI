import pino, { type Logger as PinoLogger } from "pino";
import pretty from "pino-pretty";
import { getRequestId } from "@/lib/request-id";
import { env } from "@/lib/env";

/**
 * Structured logger. Pretty in dev, JSON in production. Automatically attaches
 * the current request id when one is in scope (spec §13.5).
 */
const stream =
  env.NODE_ENV === "development"
    ? pretty({ colorize: true, translateTime: "HH:MM:ss.l" })
    : undefined;

export const logger: PinoLogger = pino(
  {
    level: env.LOG_LEVEL,
    mixin: () => {
      const id = getRequestId();
      return id ? { requestId: id } : {};
    },
  },
  stream,
);

export type Logger = PinoLogger;
