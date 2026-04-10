/**
 * API Error Classes
 *
 * Custom error classes for API responses, replacing TRPCError with
 * framework-agnostic error types that can be mapped to appropriate
 * HTTP status codes or GraphQL error extensions.
 *
 * @module errors
 */

/**
 * Base class for all API errors with status code information
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * 400 Bad Request - Invalid input or business logic error
 */
export class BadRequestError extends ApiError {
  constructor(message: string = "Bad request") {
    super(message, 400, "BAD_REQUEST");
  }
}

/**
 * Helper to create appropriate error based on error message content
 * Maintains backward compatibility with error message parsing patterns
 */
export function createErrorFromMessage(
  message: string,
  defaultError: new (msg: string) => ApiError = BadRequestError,
): ApiError {
  if (message.includes("not found")) {
    return new NotFoundError(message);
  }
  if (message.includes("hidden")) {
    return new ForbiddenError(message);
  }
  if (message.includes("unauthorized") || message.includes("auth")) {
    return new UnauthorizedError(message);
  }
  if (message.includes("forbidden") || message.includes("access")) {
    return new ForbiddenError(message);
  }
  return new defaultError(message);
}
