/**
 * Standard application errors and the shared API error envelope (spec §9.1).
 * Never expose stack traces, raw provider responses, or secrets to clients.
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError("VALIDATION_ERROR", message, 422, details);
export const unauthorized = (message = "Authentication required") =>
  new AppError("UNAUTHORIZED", message, 401);
export const forbidden = (message = "Not allowed") =>
  new AppError("FORBIDDEN", message, 403);
export const notFound = (message = "Not found") =>
  new AppError("NOT_FOUND", message, 404);
export const conflict = (message: string, details?: unknown) =>
  new AppError("CONFLICT", message, 409, details);
export const rateLimited = (message = "Too many requests") =>
  new AppError("RATE_LIMITED", message, 429);
