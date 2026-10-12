/**
 * Consistent HTTP Error definitions
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function createValidationError(message, details = null) {
  return new AppError(message, 400, "VALIDATION_ERROR", details);
}

export function createNotFoundError(message = "Resource not found") {
  return new AppError(message, 404, "NOT_FOUND");
}

export function createConflictError(message = "Operation invalid for current state") {
  return new AppError(message, 409, "CONFLICT");
}

export function createRateLimitError(message = "Too many requests. Please slow down.") {
  return new AppError(message, 429, "RATE_LIMIT_EXCEEDED");
}

export function createServiceUnavailableError(message = "AI service unavailable and no suitable local questions found.") {
  return new AppError(message, 503, "SERVICE_UNAVAILABLE");
}
