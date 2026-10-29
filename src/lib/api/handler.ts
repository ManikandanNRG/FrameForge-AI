import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { withRequestId } from "@/lib/request-id";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

/**
 * Wrap a route handler so it:
 *  - assigns/propagates a request id,
 *  - returns the standard success envelope { data, meta },
 *  - converts AppError into the standard error envelope { error },
 *  - logs failures with sanitized codes (never raw secrets/stacks).
 *
 * Spec §9.1 standard envelope:
 *   success: { data, meta: { requestId, timestamp } }
 *   error:   { error: { code, message, details, requestId } }
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteCtx = { params: Promise<Record<string, string | string[]>> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler<T> = (req: NextRequest, ctx: RouteCtx) => Promise<T> | T;

export function apiHandler<T>(handler: Handler<T>) {
  return async (req: NextRequest, ctx: RouteCtx): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") || randomUUID();
    return withRequestId(requestId, async () => {
      try {
        const result = await handler(req, ctx);
        // Allow a handler to return its own Response (e.g. file streams).
        if (result instanceof Response) return result;
        return Response.json({
          data: result,
          meta: { requestId, timestamp: new Date().toISOString() },
        });
      } catch (err) {
        const e =
          err instanceof AppError
            ? err
            : new AppError("INTERNAL_ERROR", "Unexpected error", 500);
        logger.error(
          { err: { code: e.code, message: e.message, status: e.status } },
          "request failed",
        );
        return Response.json(
          {
            error: {
              code: e.code,
              message: e.message,
              details: e.details ?? [],
              requestId,
            },
          },
          { status: e.status },
        );
      }
    });
  };
}
