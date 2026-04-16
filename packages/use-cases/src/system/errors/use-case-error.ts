import { Data } from "effect";

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
