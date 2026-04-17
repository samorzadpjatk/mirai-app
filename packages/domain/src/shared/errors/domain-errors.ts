import { Data } from "effect";
import { type IPortError } from "./ports";

/**
 * Unified Domain Errors
 *
 * All domain errors use Data.TaggedError for:
 * - Type-safe error matching
 * - Serializable error objects
 * - Exhaustive error handling with Effect.catchTag
 */

// ============================================================================
// Infrastructure Errors (for repository ports)
// ============================================================================

/**
 * Database error - for database/infrastructure operation failures
 */
export class DatabaseError
  extends Data.TaggedError("DatabaseError")<{
    operation: string;
    id?: string;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Database operation failed";
}

/**
 * Application error - general error for non-database failures
 */
export class ApplicationError
  extends Data.TaggedError("ApplicationError")<{
    operation: string;
    id?: string;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Application operation failed";
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error for entity creation failures
 */
export class ValidationError
  extends Data.TaggedError("ValidationError")<{
    field: string;
    message: string;
    value?: unknown;
  }>
  implements IPortError
{
  override get message(): string {
    return this.message;
  }
}

/**
 * Invalid ID error
 */
export class InvalidIdError
  extends Data.TaggedError("InvalidIdError")<{
    value: string;
    expectedType: string;
  }>
  implements IPortError
{
  override readonly message = "Invalid identifier format";
}

// ============================================================================
// Domain Constraint Errors
// ============================================================================

/**
 * Entity not found error
 */
export class EntityNotFoundError
  extends Data.TaggedError("EntityNotFoundError")<{
    entityType: string;
    identifier: string;
  }>
  implements IPortError
{
  override readonly message = "Entity not found";
}

/**
 * Entity already exists error
 */
export class EntityAlreadyExistsError
  extends Data.TaggedError("EntityAlreadyExistsError")<{
    entityType: string;
    identifier: string;
  }>
  implements IPortError
{
  override readonly message = "Entity already exists";
}

/**
 * Unauthorized action error
 */
export class UnauthorizedError
  extends Data.TaggedError("UnauthorizedError")<{
    action: string;
    userId?: string;
    reason?: string;
  }>
  implements IPortError
{
  override readonly message = "Unauthorized action";
}

/**
 * Invalid state transition error
 */
export class InvalidStateTransitionError
  extends Data.TaggedError("InvalidStateTransitionError")<{
    entityType: string;
    fromState: string;
    toState: string;
    reason?: string;
  }>
  implements IPortError
{
  override readonly message = "Invalid state transition";
}

// ============================================================================
// Business Rule Errors
// ============================================================================

/**
 * Insufficient resources error (e.g., not enough coins)
 */
export class InsufficientResourcesError
  extends Data.TaggedError("InsufficientResourcesError")<{
    resource: string;
    required: number;
    available: number;
  }>
  implements IPortError
{
  override readonly message = "Insufficient resources";
}

/**
 * Time constraint error
 */
export class TimeConstraintError
  extends Data.TaggedError("TimeConstraintError")<{
    constraint: string;
    currentTime: Date;
    allowedTime: Date;
  }>
  implements IPortError
{
  override readonly message = "Time constraint violation";
}

/**
 * Duplicate action error
 */
export class DuplicateActionError
  extends Data.TaggedError("DuplicateActionError")<{
    action: string;
    entityType: string;
    identifier: string;
  }>
  implements IPortError
{
  override readonly message = "Duplicate action detected";
}
