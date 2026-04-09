/**
 * DomainErrors - Base error classes for the domain layer
 *
 * These errors represent fundamental business logic failures that can occur
 * across all domains. They use a type-safe TaggedError pattern for
 * discriminated unions with proper error handling.
 *
 * ## Error Hierarchy
 *
 * ```
 * DomainError (union type)
 * ├── EntityNotFoundError    - When an entity doesn't exist
 * ├── ValidationError        - When input fails business rules
 * ├── UnauthorizedError      - When user lacks permissions
 * ├── ConflictError          - When state conflicts with operation
 * └── InvariantError         - When business invariant is violated
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { EntityNotFoundError, ValidationError } from "@mirai-app/domain/errors";
 *
 * async function findUser(id: string): Promise<User> {
 *   const user = await db.user.findById(id);
 *   if (!user) {
 *     throw new EntityNotFoundError({ entity: "User", id });
 *   }
 *   return user;
 * }
 * ```
 *
 * @module DomainErrors
 */

// =============================================================================
// Base Error Classes
// =============================================================================

/**
 * Error thrown when an entity cannot be found by its identifier
 *
 * @example
 * ```typescript
 * const error = new EntityNotFoundError({
 *   entity: "User",
 *   id: "user-123",
 *   code: "NOT_FOUND"
 * });
 * ```
 */
export class EntityNotFoundError extends Error {
  readonly _tag = "EntityNotFoundError" as const;
  readonly code = "NOT_FOUND" as const;
  readonly entity: string;
  readonly id: string;

  constructor(props: { entity: string; id: string }) {
    super(`${props.entity} with id '${props.id}' not found`);
    this.entity = props.entity;
    this.id = props.id;
  }
}

/**
 * Error thrown when input validation fails business rules
 *
 * @example
 * ```typescript
 * const error = new ValidationError({
 *   field: "email",
 *   message: "Invalid email format",
 *   code: "VALIDATION_FAILED"
 * });
 * ```
 */
export class ValidationError extends Error {
  readonly _tag = "ValidationError" as const;
  readonly code = "VALIDATION_FAILED" as const;
  readonly field: string;
  override readonly message: string;

  constructor(props: { field: string; message: string }) {
    super(`Validation failed for '${props.field}': ${props.message}`);
    this.field = props.field;
    this.message = props.message;
  }
}

/**
 * Error thrown when a user lacks required permissions
 *
 * @example
 * ```typescript
 * const error = new UnauthorizedError({
 *   resource: "Challenge",
 *   action: "delete",
 *   userId: "user-123",
 *   code: "UNAUTHORIZED"
 * });
 * ```
 */
export class UnauthorizedError extends Error {
  readonly _tag = "UnauthorizedError" as const;
  readonly code = "UNAUTHORIZED" as const;
  readonly resource: string;
  readonly action: string;
  readonly userId: string;

  constructor(props: { resource: string; action: string; userId: string }) {
    super(
      `User '${props.userId}' is not authorized to ${props.action} ${props.resource}`,
    );
    this.resource = props.resource;
    this.action = props.action;
    this.userId = props.userId;
  }
}

/**
 * Error thrown when an operation conflicts with current state
 *
 * Used for cases like trying to create a duplicate, or modifying
 * an entity that has been locked/archived.
 *
 * @example
 * ```typescript
 * const error = new ConflictError({
 *   resource: "User",
 *   message: "Email already exists",
 *   code: "CONFLICT"
 * });
 * ```
 */
export class ConflictError extends Error {
  readonly _tag = "ConflictError" as const;
  readonly code = "CONFLICT" as const;
  readonly resource: string;
  override readonly message: string;

  constructor(props: { resource: string; message: string }) {
    super(`Conflict in ${props.resource}: ${props.message}`);
    this.resource = props.resource;
    this.message = props.message;
  }
}

/**
 * Error thrown when a business invariant is violated
 *
 * Invariants are rules that must always be true for the domain
 * to be in a valid state.
 *
 * @example
 * ```typescript
 * const error = new InvariantError({
 *   invariant: "Coin balance cannot be negative",
 *   details: { userId: "user-123", balance: -10 },
 *   code: "INVARIANT_VIOLATED"
 * });
 * ```
 */
export class InvariantError extends Error {
  readonly _tag = "InvariantError" as const;
  readonly code = "INVARIANT_VIOLATED" as const;
  readonly invariant: string;
  readonly details?: Record<string, unknown>;

  constructor(props: { invariant: string; details?: Record<string, unknown> }) {
    super(`Invariant violated: ${props.invariant}`);
    this.invariant = props.invariant;
    this.details = props.details;
  }
}

// =============================================================================
// Domain-Specific Error Types
// =============================================================================

/**
 * Error thrown when an entity operation is not allowed due to its state
 *
 * @example
 * ```typescript
 * const error = new InvalidStateError({
 *   entity: "Challenge",
 *   id: "challenge-123",
 *   currentState: "closed",
 *   requiredState: "open",
 *   code: "INVALID_STATE"
 * });
 * ```
 */
export class InvalidStateError extends Error {
  readonly _tag = "InvalidStateError" as const;
  readonly code = "INVALID_STATE" as const;
  readonly entity: string;
  readonly id: string;
  readonly currentState: string;
  readonly requiredState?: string;

  constructor(props: {
    entity: string;
    id: string;
    currentState: string;
    requiredState?: string;
  }) {
    super(
      `${props.entity} '${props.id}' is in invalid state '${props.currentState}'${
        props.requiredState ? ` (required: '${props.requiredState}')` : ""
      }`,
    );
    this.entity = props.entity;
    this.id = props.id;
    this.currentState = props.currentState;
    this.requiredState = props.requiredState;
  }
}

/**
 * Error thrown when a required resource is missing or unavailable
 *
 * @example
 * ```typescript
 * const error = new ResourceUnavailableError({
 *   resource: "Reward",
 *   id: "reward-123",
 *   reason: "Out of stock",
 *   code: "RESOURCE_UNAVAILABLE"
 * });
 * ```
 */
export class ResourceUnavailableError extends Error {
  readonly _tag = "ResourceUnavailableError" as const;
  readonly code = "RESOURCE_UNAVAILABLE" as const;
  readonly resource: string;
  readonly id: string;
  readonly reason: string;

  constructor(props: { resource: string; id: string; reason: string }) {
    super(`${props.resource} '${props.id}' is unavailable: ${props.reason}`);
    this.resource = props.resource;
    this.id = props.id;
    this.reason = props.reason;
  }
}

/**
 * Error thrown when a rate limit or quota is exceeded
 *
 * @example
 * ```typescript
 * const error = new QuotaExceededError({
 *   resource: "Votes",
 *   limit: 5,
 *   current: 5,
 *   code: "QUOTA_EXCEEDED"
 * });
 * ```
 */
export class QuotaExceededError extends Error {
  readonly _tag = "QuotaExceededError" as const;
  readonly code = "QUOTA_EXCEEDED" as const;
  readonly resource: string;
  readonly limit: number;
  readonly current: number;

  constructor(props: { resource: string; limit: number; current: number }) {
    super(`${props.resource} quota exceeded (${props.current}/${props.limit})`);
    this.resource = props.resource;
    this.limit = props.limit;
    this.current = props.current;
  }
}

// =============================================================================
// Union Type and Type Guards
// =============================================================================

/**
 * Union type of all domain errors
 *
 * Use this type for function return signatures that can fail
 * with any domain-level error.
 */
export type DomainError =
  | EntityNotFoundError
  | ValidationError
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
    error instanceof EntityNotFoundError ||
    error instanceof ValidationError ||
    error instanceof UnauthorizedError ||
    error instanceof ConflictError ||
    error instanceof InvariantError ||
    error instanceof InvalidStateError ||
    error instanceof ResourceUnavailableError ||
    error instanceof QuotaExceededError
  );
}

/**
 * Get a human-readable error message from any domain error
 */
export function getDomainErrorMessage(error: DomainError): string {
  return error.message;
}

/**
 * Get error code from any domain error
 */
export function getDomainErrorCode(error: DomainError): string {
  return error.code;
}
