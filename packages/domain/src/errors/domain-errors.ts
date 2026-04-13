/**
 * Domain Error Classes
 *
 * Provides typed, structured error classes for domain layer operations.
 * All errors use readonly properties for immutability and include _tag
 * discriminators for type-safe error handling.
 *
 * @module domain-errors
 */

/**
 * Base domain error class
 * All domain errors extend this class for consistent error handling
 */
export class DomainError extends Error {
  readonly _tag: string;

  constructor(message: string, tag: string) {
    super(message);
    this._tag = tag;
    this.name = tag;
  }
}

/**
 * Validation error with optional field reference
 * Use when input validation fails
 */
export class ValidationError extends DomainError {
  override readonly _tag = "ValidationError" as const;
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, "ValidationError");
    this.field = field;
  }

  /**
   * Create a validation error for a specific field
   */
  static forField(field: string, message: string): ValidationError {
    return new ValidationError(`${field}: ${message}`, field);
  }

  /**
   * Create a required field error
   */
  static required(field: string): ValidationError {
    return new ValidationError(`${field} is required`, field);
  }

  /**
   * Create a minimum length error
   */
  static minLength(field: string, min: number): ValidationError {
    return new ValidationError(
      `${field} must be at least ${min} characters`,
      field,
    );
  }

  /**
   * Create a maximum length error
   */
  static maxLength(field: string, max: number): ValidationError {
    return new ValidationError(
      `${field} must be at most ${max} characters`,
      field,
    );
  }

  /**
   * Create a minimum value error
   */
  static minValue(field: string, min: number): ValidationError {
    return new ValidationError(`${field} must be at least ${min}`, field);
  }

  /**
   * Create a maximum value error
   */
  static maxValue(field: string, max: number): ValidationError {
    return new ValidationError(`${field} must be at most ${max}`, field);
  }

  /**
   * Create an invalid format error
   */
  static invalidFormat(field: string, format: string): ValidationError {
    return new ValidationError(`${field} must be a valid ${format}`, field);
  }
}

/**
 * State transition error
 * Use when an entity status transition is invalid
 */
export class StateTransitionError extends DomainError {
  override readonly _tag = "StateTransitionError" as const;
  readonly from: string;
  readonly to: string;

  constructor(from: string, to: string) {
    super(
      `Cannot transition from '${from}' to '${to}'`,
      "StateTransitionError",
    );
    this.from = from;
    this.to = to;
  }
}

/**
 * Not found error
 * Use when an entity cannot be found by ID
 */
export class NotFoundError extends DomainError {
  override readonly _tag = "NotFoundError" as const;
  readonly entityType: string;
  readonly id: string;

  constructor(entityType: string, id: string) {
    super(`${entityType} with id '${id}' not found`, "NotFoundError");
    this.entityType = entityType;
    this.id = id;
  }
}

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof Error &&
    "_tag" in error &&
    typeof (error as DomainError)._tag === "string"
  );
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
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
 * Type guard for NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
