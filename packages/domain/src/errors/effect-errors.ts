/**
 * Effect-Based Domain Error Classes
 *
 * Provides typed, structured error classes using Effect's Data.TaggedError pattern.
 * These errors support Effect's error handling capabilities including:
 * - Pattern matching via Effect.catchTag
 * - Type-safe error discrimination
 * - Structured error information
 *
 * These errors are designed to replace the existing DomainError class hierarchy
 * during the migration to Effect.
 *
 * @module effect-errors
 */

import { Data } from "effect";

/**
 * Base domain error using Effect's Data.TaggedError pattern
 *
 * All domain errors extend this pattern for consistent error handling.
 * Tagged errors enable type-safe pattern matching in Effect workflows.
 *
 * @example
 * ```typescript
 * // Creating a custom error
 * class MyError extends Data.TaggedError("MyError")<{
 *   message: string;
 *   code: number;
 * }> {}
 *
 * // Using in Effect
 * const program = Effect.fail(new MyError({ message: "oops", code: 500 }));
 *
 * // Pattern matching on errors
 * const handled = program.pipe(
 *   Effect.catchTag("MyError", (error) =>
 *     Effect.succeed(`Recovered from: ${error.message}`)
 *   )
 * );
 * ```
 */

/**
 * Validation error with field reference
 *
 * Use when input validation fails.
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  message: string;
  field?: string;
}> {
  /**
   * Create a validation error for a specific field
   */
  static forField(field: string, message: string): ValidationError {
    return new ValidationError({ message: `${field}: ${message}`, field });
  }

  /**
   * Create a required field error
   */
  static required(field: string): ValidationError {
    return new ValidationError({ message: `${field} is required`, field });
  }

  /**
   * Create a minimum length error
   */
  static minLength(field: string, min: number): ValidationError {
    return new ValidationError({
      message: `${field} must be at least ${min} characters`,
      field,
    });
  }

  /**
   * Create a maximum length error
   */
  static maxLength(field: string, max: number): ValidationError {
    return new ValidationError({
      message: `${field} must be at most ${max} characters`,
      field,
    });
  }

  /**
   * Create a minimum value error
   */
  static minValue(field: string, min: number): ValidationError {
    return new ValidationError({
      message: `${field} must be at least ${min}`,
      field,
    });
  }

  /**
   * Create a maximum value error
   */
  static maxValue(field: string, max: number): ValidationError {
    return new ValidationError({
      message: `${field} must be at most ${max}`,
      field,
    });
  }

  /**
   * Create an invalid format error
   */
  static invalidFormat(field: string, format: string): ValidationError {
    return new ValidationError({
      message: `${field} must be a valid ${format}`,
      field,
    });
  }

  /**
   * Create an invalid enum value error
   */
  static invalidEnum(
    field: string,
    allowedValues: readonly string[],
  ): ValidationError {
    return new ValidationError({
      message: `${field} must be one of: ${allowedValues.join(", ")}`,
      field,
    });
  }
}

/**
 * Not found error
 *
 * Use when an entity cannot be found by ID or other identifier.
 */
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entityType: string;
  id: string;
}> {
  /**
   * Create a not found error for a specific entity type and ID
   */
  static forEntity(entityType: string, id: string): NotFoundError {
    return new NotFoundError({
      entityType,
      id,
    });
  }
}

/**
 * State transition error
 *
 * Use when an entity status transition is invalid.
 */
export class StateTransitionError extends Data.TaggedError(
  "StateTransitionError",
)<{
  from: string;
  to: string;
  entityType?: string;
}> {
  /**
   * Create a state transition error
   */
  static create(
    from: string,
    to: string,
    entityType?: string,
  ): StateTransitionError {
    return new StateTransitionError({ from, to, entityType });
  }
}

/**
 * Unauthorized error
 *
 * Use when an operation is not authorized for the current user.
 */
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  message: string;
  operation?: string;
  userId?: string;
}> {
  /**
   * Create an unauthorized error
   */
  static create(
    message: string,
    operation?: string,
    userId?: string,
  ): UnauthorizedError {
    return new UnauthorizedError({ message, operation, userId });
  }

  /**
   * Create an unauthorized error for a specific operation
   */
  static forOperation(operation: string, userId?: string): UnauthorizedError {
    return new UnauthorizedError({
      message: `Not authorized to perform operation: ${operation}`,
      operation,
      userId,
    });
  }
}

/**
 * Conflict error
 *
 * Use when there's a conflict with the current state (e.g., duplicate key).
 */
export class ConflictError extends Data.TaggedError("ConflictError")<{
  message: string;
  field?: string;
  value?: string;
}> {
  /**
   * Create a conflict error
   */
  static create(
    message: string,
    field?: string,
    value?: string,
  ): ConflictError {
    return new ConflictError({ message, field, value });
  }

  /**
   * Create a duplicate key error
   */
  static duplicate(field: string, value: string): ConflictError {
    return new ConflictError({
      message: `${field} '${value}' already exists`,
      field,
      value,
    });
  }
}

/**
 * Invariant violation error
 *
 * Use when a business invariant is violated.
 */
export class InvariantError extends Data.TaggedError("InvariantError")<{
  message: string;
  invariant: string;
}> {
  /**
   * Create an invariant error
   */
  static create(message: string, invariant: string): InvariantError {
    return new InvariantError({ message, invariant });
  }
}

/**
 * Invalid state error
 *
 * Use when an entity is in an invalid state for an operation.
 */
export class InvalidStateError extends Data.TaggedError("InvalidStateError")<{
  message: string;
  currentState: string;
  requiredState?: string;
}> {
  /**
   * Create an invalid state error
   */
  static create(
    message: string,
    currentState: string,
    requiredState?: string,
  ): InvalidStateError {
    return new InvalidStateError({ message, currentState, requiredState });
  }
}

/**
 * Resource unavailable error
 *
 * Use when a required resource is not available.
 */
export class ResourceUnavailableError extends Data.TaggedError(
  "ResourceUnavailableError",
)<{
  message: string;
  resourceType: string;
  resourceId?: string;
}> {
  /**
   * Create a resource unavailable error
   */
  static create(
    message: string,
    resourceType: string,
    resourceId?: string,
  ): ResourceUnavailableError {
    return new ResourceUnavailableError({ message, resourceType, resourceId });
  }
}

/**
 * Quota exceeded error
 *
 * Use when a quota or limit has been exceeded.
 */
export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  message: string;
  quota: string;
  current: number;
  maximum: number;
}> {
  /**
   * Create a quota exceeded error
   */
  static create(
    message: string,
    quota: string,
    current: number,
    maximum: number,
  ): QuotaExceededError {
    return new QuotaExceededError({ message, quota, current, maximum });
  }
}

/**
 * Domain error union type
 *
 * This type represents all possible domain errors.
 * Useful for typing Effect error channels.
 */
export type DomainError =
  | ValidationError
  | NotFoundError
  | StateTransitionError
  | UnauthorizedError
  | ConflictError
  | InvariantError
  | InvalidStateError
  | ResourceUnavailableError
  | QuotaExceededError;

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof Error &&
    "_tag" in error &&
    typeof (error as { _tag: unknown })._tag === "string"
  );
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Type guard for StateTransitionError
 */
export function isStateTransitionError(
  error: unknown,
): error is StateTransitionError {
  return error instanceof StateTransitionError;
}

/**
 * Type guard for UnauthorizedError
 */
export function isUnauthorizedError(
  error: unknown,
): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

/**
 * Type guard for ConflictError
 */
export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Type guard for InvariantError
 */
export function isInvariantError(error: unknown): error is InvariantError {
  return error instanceof InvariantError;
}

/**
 * Get the error message from a DomainError
 */
export function getDomainErrorMessage(error: DomainError): string {
  return error.message;
}

/**
 * Get the error code/tag from a DomainError
 */
export function getDomainErrorCode(error: DomainError): string {
  return error._tag;
}
