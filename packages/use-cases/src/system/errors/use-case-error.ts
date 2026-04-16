import { Data } from "effect";

/**
 * Base application error class
 * Re-exported as AppError for compatibility
 */
export class AppError extends Data.TaggedError("AppError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "APP_ERROR" as const;
}

/**
 * UseCaseError for orchestration-level errors
 *
 * Used by use case interactors that coordinate multiple domain operations.
 * This is distinct from ServiceError (infrastructure) and DomainError (business rules).
 *
 * @example
 * ```typescript
 * const error = new UseCaseError({
 *   operation: "addCoinsWithActivity",
 *   message: "Failed to capture ranking snapshot",
 *   cause: originalError,
 * });
 * ```
 */
export class UseCaseError extends Data.TaggedError("UseCaseError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "USE_CASE_ERROR" as const;
}

/**
 * Type guard to check if an error is a UseCaseError
 */
export function isUseCaseError(error: unknown): error is UseCaseError {
  return error instanceof UseCaseError;
}

/**
 * Get error message from a UseCaseError
 */
export function getUseCaseErrorMessage(error: unknown): string {
  if (isUseCaseError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Get error code from a UseCaseError
 */
export function getUseCaseErrorCode(error: unknown): string {
  if (isUseCaseError(error)) {
    return error.code;
  }
  return "UNKNOWN_ERROR";
}
