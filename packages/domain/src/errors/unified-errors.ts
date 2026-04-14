/**
 * Unified Domain Error Hierarchy
 *
 * Single source of truth for all domain errors.
 * Consolidates 124 error classes into 20 well-defined types.
 *
 * This module provides:
 * - Base DomainError class with consistent structure
 * - Hierarchical error types (ValidationError, NotFoundError, etc.)
 * - Type guards for type-safe error handling
 * - Effect integration helpers
 * - Backward compatibility with AppError factory
 *
 * @module errors
 */

import { Data } from "effect";

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Base domain error class
 * All domain errors extend this for consistent error handling
 */
export class DomainError extends Error {
  readonly _tag: string;
  readonly code: string;

  constructor(message: string, tag: string, code: string) {
    super(message);
    this._tag = tag;
    this.name = tag;
    this.code = code;
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * Validation error with optional field reference
 * Use when input validation fails
 *
 * Supports both unified pattern: new ValidationError(message, field)
 * and Effect pattern: new ValidationError({ message, field }) for backward compatibility
 */
export class ValidationError extends DomainError {
  override readonly _tag = "ValidationError" as const;
  readonly field?: string;

  constructor(
    messageOrProps: string | { message: string; field?: string },
    field?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern: new ValidationError(message, field)
      super(messageOrProps, "ValidationError", "VALIDATION_FAILED");
      this.field = field;
    } else {
      // Effect pattern: new ValidationError({ message, field }) for backward compatibility
      super(messageOrProps.message, "ValidationError", "VALIDATION_FAILED");
      this.field = messageOrProps.field;
    }
  }

  static forField(field: string, message: string): ValidationError {
    return new ValidationError(`${field}: ${message}`, field);
  }

  static required(field: string): ValidationError {
    return new ValidationError(`${field} is required`, field);
  }

  static minLength(field: string, min: number): ValidationError {
    return new ValidationError(
      `${field} must be at least ${min} characters`,
      field,
    );
  }

  static maxLength(field: string, max: number): ValidationError {
    return new ValidationError(
      `${field} must be at most ${max} characters`,
      field,
    );
  }

  static minValue(field: string, min: number): ValidationError {
    return new ValidationError(`${field} must be at least ${min}`, field);
  }

  static maxValue(field: string, max: number): ValidationError {
    return new ValidationError(`${field} must be at most ${max}`, field);
  }

  static invalidFormat(field: string, format: string): ValidationError {
    return new ValidationError(`${field} must be a valid ${format}`, field);
  }

  /**
   * Create an invalid enum value error
   * Backward compatibility with effect-errors pattern
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
 * Field-level validation error
 */
export class FieldValidationError extends ValidationError {
  override readonly _tag = "FieldValidationError" as const;

  constructor(field: string, message: string) {
    super(message, field);
  }
}

/**
 * Schema-level validation error (multiple fields)
 */
export class SchemaValidationError extends ValidationError {
  override readonly _tag = "SchemaValidationError" as const;
  readonly errors: ReadonlyArray<{ field: string; message: string }>;

  constructor(
    message: string,
    errors: ReadonlyArray<{ field: string; message: string }>,
  ) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Business constraint violation
 */
export class ConstraintViolationError extends DomainError {
  override readonly _tag = "ConstraintViolationError" as const;
  readonly constraint: string;

  constructor(constraint: string, message: string) {
    super(message, "ConstraintViolationError", "CONSTRAINT_VIOLATED");
    this.constraint = constraint;
  }
}

/**
 * Invariant violation error (backward compatibility alias for ConstraintViolationError)
 * @deprecated Use ConstraintViolationError instead
 *
 * Supports both unified pattern: new InvariantError(message, invariant)
 * and Effect pattern: new InvariantError({ message, invariant }) for backward compatibility
 */
export class InvariantError extends ConstraintViolationError {
  override readonly _tag = "InvariantError" as const;
  readonly invariant: string;

  constructor(
    messageOrProps: string | { message: string; invariant: string },
    invariant?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super(invariant ?? "unknown", messageOrProps);
      this.invariant = invariant ?? "unknown";
    } else {
      // Effect pattern for backward compatibility
      super(messageOrProps.invariant, messageOrProps.message);
      this.invariant = messageOrProps.invariant;
    }
  }

  /**
   * Create an invariant error
   */
  static create(message: string, invariant: string): InvariantError {
    return new InvariantError(message, invariant);
  }
}

// ============================================================================
// Not Found Errors
// ============================================================================

/**
 * Generic not found error
 *
 * Supports both unified pattern: new NotFoundError(entityType, id)
 * and Effect pattern: new NotFoundError({ entityType, id }) for backward compatibility
 */
export class NotFoundError extends DomainError {
  override readonly _tag = "NotFoundError" as const;
  readonly entityType: string;
  readonly id: string;

  constructor(
    entityTypeOrProps: string | { entityType: string; id: string },
    id?: string,
  ) {
    if (typeof entityTypeOrProps === "string") {
      // Unified pattern
      const entityType = entityTypeOrProps;
      super(
        `${entityType} with id '${id}' not found`,
        "NotFoundError",
        "NOT_FOUND",
      );
      this.entityType = entityType;
      this.id = id ?? "";
    } else {
      // Effect pattern for backward compatibility
      super(
        `${entityTypeOrProps.entityType} with id '${entityTypeOrProps.id}' not found`,
        "NotFoundError",
        "NOT_FOUND",
      );
      this.entityType = entityTypeOrProps.entityType;
      this.id = entityTypeOrProps.id;
    }
  }

  static forEntity(entityType: string, id: string): NotFoundError {
    return new NotFoundError(entityType, id);
  }
}

/**
 * Entity not found (specific database entity)
 */
export class EntityNotFoundError extends NotFoundError {
  override readonly _tag = "EntityNotFoundError" as const;

  constructor(entity: string, id: string) {
    super(entity, id);
  }
}

/**
 * Resource not found (files, external resources)
 */
export class ResourceNotFoundError extends NotFoundError {
  override readonly _tag = "ResourceNotFoundError" as const;
  readonly resourcePath?: string;

  constructor(resourceType: string, id: string, resourcePath?: string) {
    super(resourceType, id);
    this.resourcePath = resourcePath;
  }
}

// ============================================================================
// State Errors
// ============================================================================

/**
 * Invalid state transition
 *
 * Supports both unified pattern: new StateTransitionError(from, to, entityType)
 * and Effect pattern: new StateTransitionError({ from, to, entityType }) for backward compatibility
 */
export class StateTransitionError extends DomainError {
  override readonly _tag = "StateTransitionError" as const;
  readonly from: string;
  readonly to: string;
  readonly entityType?: string;

  constructor(
    fromOrProps: string | { from: string; to: string; entityType?: string },
    to?: string,
    entityType?: string,
  ) {
    if (typeof fromOrProps === "string") {
      // Unified pattern: new StateTransitionError(from, to, entityType)
      const from = fromOrProps;
      super(
        entityType
          ? `Cannot transition ${entityType} from '${from}' to '${to}'`
          : `Cannot transition from '${from}' to '${to}'`,
        "StateTransitionError",
        "INVALID_TRANSITION",
      );
      this.from = from;
      this.to = to ?? "";
      this.entityType = entityType;
    } else {
      // Effect pattern: new StateTransitionError({ from, to, entityType }) for backward compatibility
      super(
        fromOrProps.entityType
          ? `Cannot transition ${fromOrProps.entityType} from '${fromOrProps.from}' to '${fromOrProps.to}'`
          : `Cannot transition from '${fromOrProps.from}' to '${fromOrProps.to}'`,
        "StateTransitionError",
        "INVALID_TRANSITION",
      );
      this.from = fromOrProps.from;
      this.to = fromOrProps.to;
      this.entityType = fromOrProps.entityType;
    }
  }

  static create(
    from: string,
    to: string,
    entityType?: string,
  ): StateTransitionError {
    return new StateTransitionError(from, to, entityType);
  }
}

/**
 * Entity in invalid state for operation
 *
 * Supports both unified pattern: InvalidStateError.create(currentState, requiredState, entityType)
 * and Effect pattern: new InvalidStateError({ message, currentState, requiredState }) for backward compatibility
 */
export class InvalidStateError extends DomainError {
  override readonly _tag = "InvalidStateError" as const;
  readonly currentState: string;
  readonly requiredState?: string;
  readonly entityType?: string;

  constructor(
    messageOrProps:
      | string
      | { message: string; currentState: string; requiredState?: string },
    currentState?: string,
    requiredState?: string,
    entityType?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super(messageOrProps, "InvalidStateError", "INVALID_STATE");
      this.currentState = currentState ?? "";
      this.requiredState = requiredState;
      this.entityType = entityType;
    } else {
      // Effect pattern for backward compatibility
      super(messageOrProps.message, "InvalidStateError", "INVALID_STATE");
      this.currentState = messageOrProps.currentState;
      this.requiredState = messageOrProps.requiredState;
      this.entityType = undefined;
    }
  }

  static create(
    currentState: string,
    requiredState?: string,
    entityType?: string,
  ): InvalidStateError {
    const message = entityType
      ? `${entityType} is in invalid state '${currentState}'${requiredState ? ` (required: '${requiredState}')` : ""}`
      : `Invalid state '${currentState}'${requiredState ? ` (required: '${requiredState}')` : ""}`;
    return new InvalidStateError(
      message,
      currentState,
      requiredState,
      entityType,
    );
  }
}

// ============================================================================
// Authorization Errors
// ============================================================================

/**
 * Unauthorized access
 *
 * Supports both unified pattern: new UnauthorizedError(message, operation?, userId?)
 * and Effect pattern: new UnauthorizedError({ message, operation?, userId? }) for backward compatibility
 */
export class UnauthorizedError extends DomainError {
  override readonly _tag = "UnauthorizedError" as const;
  readonly operation?: string;
  readonly userId?: string;

  constructor(
    messageOrProps:
      | string
      | { message: string; operation?: string; userId?: string },
    operation?: string,
    userId?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super(messageOrProps, "UnauthorizedError", "UNAUTHORIZED");
      this.operation = operation;
      this.userId = userId;
    } else {
      // Effect pattern for backward compatibility
      super(messageOrProps.message, "UnauthorizedError", "UNAUTHORIZED");
      this.operation = messageOrProps.operation;
      this.userId = messageOrProps.userId;
    }
  }

  /**
   * Create an unauthorized error (Effect pattern for backward compatibility)
   */
  static create(
    message: string,
    operation?: string,
    userId?: string,
  ): UnauthorizedError {
    return new UnauthorizedError(message, operation, userId);
  }

  static forOperation(operation: string, userId?: string): UnauthorizedError {
    return new UnauthorizedError(
      `Not authorized to perform: ${operation}`,
      operation,
      userId,
    );
  }
}

/**
 * Forbidden action (authenticated but not permitted)
 */
export class ForbiddenError extends DomainError {
  override readonly _tag = "ForbiddenError" as const;
  readonly resource: string;
  readonly action: string;

  constructor(resource: string, action: string, message?: string) {
    super(
      message || `Forbidden: cannot ${action} ${resource}`,
      "ForbiddenError",
      "FORBIDDEN",
    );
    this.resource = resource;
    this.action = action;
  }
}

/**
 * Authentication failure
 */
export class AuthenticationError extends DomainError {
  override readonly _tag = "AuthenticationError" as const;
  readonly reason: string;

  constructor(reason: string) {
    super(
      `Authentication failed: ${reason}`,
      "AuthenticationError",
      "AUTH_FAILED",
    );
    this.reason = reason;
  }

  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError("Invalid credentials");
  }

  static expiredToken(): AuthenticationError {
    return new AuthenticationError("Token has expired");
  }

  static invalidToken(): AuthenticationError {
    return new AuthenticationError("Invalid token");
  }
}

// ============================================================================
// Conflict Errors
// ============================================================================

/**
 * Conflict with current state
 *
 * Supports both unified pattern: new ConflictError(message, field?, value?)
 * and Effect pattern: new ConflictError({ message, field?, value? }) for backward compatibility
 */
export class ConflictError extends DomainError {
  override readonly _tag = "ConflictError" as const;
  readonly field?: string;
  readonly value?: string;

  constructor(
    messageOrProps:
      | string
      | { message: string; field?: string; value?: string },
    field?: string,
    value?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super(messageOrProps, "ConflictError", "CONFLICT");
      this.field = field;
      this.value = value;
    } else {
      // Effect pattern for backward compatibility
      super(messageOrProps.message, "ConflictError", "CONFLICT");
      this.field = messageOrProps.field;
      this.value = messageOrProps.value;
    }
  }

  /**
   * Create a conflict error (Effect pattern for backward compatibility)
   */
  static create(
    message: string,
    field?: string,
    value?: string,
  ): ConflictError {
    return new ConflictError(message, field, value);
  }

  static duplicate(field: string, value: string): ConflictError {
    return new ConflictError(
      `${field} '${value}' already exists`,
      field,
      value,
    );
  }
}

/**
 * Duplicate key/value
 */
export class DuplicateError extends ConflictError {
  override readonly _tag = "DuplicateError" as const;

  constructor(field: string, value: string) {
    super(`${field} '${value}' already exists`, field, value);
  }
}

/**
 * Concurrent modification detected
 */
export class ConcurrentModificationError extends ConflictError {
  override readonly _tag = "ConcurrentModificationError" as const;
  readonly expectedVersion: number;
  readonly actualVersion: number;

  constructor(expectedVersion: number, actualVersion: number) {
    super(
      `Concurrent modification detected: expected version ${expectedVersion}, found ${actualVersion}`,
    );
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

// ============================================================================
// External/IO Errors
// ============================================================================

/**
 * Database error
 */
export class DatabaseError extends DomainError {
  override readonly _tag = "DatabaseError" as const;
  readonly operation: string;
  readonly cause?: Error;

  constructor(operation: string, message: string, cause?: Error) {
    super(message, "DatabaseError", "DATABASE_ERROR");
    this.operation = operation;
    this.cause = cause;
  }
}

/**
 * Network error
 */
export class NetworkError extends DomainError {
  override readonly _tag = "NetworkError" as const;
  readonly endpoint?: string;
  readonly cause?: Error;

  constructor(message: string, endpoint?: string, cause?: Error) {
    super(message, "NetworkError", "NETWORK_ERROR");
    this.endpoint = endpoint;
    this.cause = cause;
  }
}

/**
 * External service unavailable
 */
export class ServiceUnavailableError extends DomainError {
  override readonly _tag = "ServiceUnavailableError" as const;
  readonly service: string;

  constructor(service: string, message?: string) {
    super(
      message || `Service '${service}' is unavailable`,
      "ServiceUnavailableError",
      "SERVICE_UNAVAILABLE",
    );
    this.service = service;
  }
}

/**
 * Resource unavailable error (backward compatibility alias for ServiceUnavailableError)
 * @deprecated Use ServiceUnavailableError instead
 *
 * Supports both unified pattern: new ResourceUnavailableError(message, resourceType, resourceId?)
 * and Effect pattern: new ResourceUnavailableError({ message, resourceType, resourceId? }) for backward compatibility
 */
export class ResourceUnavailableError extends ServiceUnavailableError {
  override readonly _tag = "ResourceUnavailableError" as const;
  readonly resourceType: string;
  readonly resourceId?: string;

  constructor(
    messageOrProps:
      | string
      | { message: string; resourceType: string; resourceId?: string },
    resourceType?: string,
    resourceId?: string,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super(resourceType ?? "unknown", messageOrProps);
      this.resourceType = resourceType ?? "unknown";
      this.resourceId = resourceId;
    } else {
      // Effect pattern for backward compatibility
      super(messageOrProps.resourceType, messageOrProps.message);
      this.resourceType = messageOrProps.resourceType;
      this.resourceId = messageOrProps.resourceId;
    }
  }

  /**
   * Create a resource unavailable error
   */
  static create(
    message: string,
    resourceType: string,
    resourceId?: string,
  ): ResourceUnavailableError {
    return new ResourceUnavailableError(message, resourceType, resourceId);
  }
}

/**
 * Quota exceeded error (backward compatibility - maps to ConstraintViolationError)
 * @deprecated Use ConstraintViolationError instead
 *
 * Supports both unified pattern: new QuotaExceededError(message, quota, current, maximum)
 * and Effect pattern: new QuotaExceededError({ message, quota, current, maximum }) for backward compatibility
 */
export class QuotaExceededError extends ConstraintViolationError {
  override readonly _tag = "QuotaExceededError" as const;
  readonly quota: string;
  readonly current: number;
  readonly maximum: number;

  constructor(
    messageOrProps:
      | string
      | { message: string; quota: string; current: number; maximum: number },
    quota?: string,
    current?: number,
    maximum?: number,
  ) {
    if (typeof messageOrProps === "string") {
      // Unified pattern
      super("quota", messageOrProps);
      this.quota = quota ?? "unknown";
      this.current = current ?? 0;
      this.maximum = maximum ?? 0;
    } else {
      // Effect pattern for backward compatibility
      super("quota", messageOrProps.message);
      this.quota = messageOrProps.quota;
      this.current = messageOrProps.current;
      this.maximum = messageOrProps.maximum;
    }
  }

  /**
   * Create a quota exceeded error
   */
  static create(
    message: string,
    quota: string,
    current: number,
    maximum: number,
  ): QuotaExceededError {
    return new QuotaExceededError(message, quota, current, maximum);
  }
}

// ============================================================================
// System Errors
// ============================================================================

/**
 * Configuration error
 */
export class ConfigurationError extends DomainError {
  override readonly _tag = "ConfigurationError" as const;
  readonly configKey: string;

  constructor(configKey: string, message: string) {
    super(message, "ConfigurationError", "CONFIG_ERROR");
    this.configKey = configKey;
  }

  static missing(key: string): ConfigurationError {
    return new ConfigurationError(
      key,
      `Missing required configuration: ${key}`,
    );
  }
}

/**
 * Unexpected error (catch-all)
 */
export class UnexpectedError extends DomainError {
  override readonly _tag = "UnexpectedError" as const;
  readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, "UnexpectedError", "UNEXPECTED");
    this.cause = cause;
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof Error &&
    "_tag" in error &&
    typeof (error as DomainError)._tag === "string"
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isStateTransitionError(
  error: unknown,
): error is StateTransitionError {
  return error instanceof StateTransitionError;
}

export function isUnauthorizedError(
  error: unknown,
): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

/**
 * Type guard for InvariantError
 * @deprecated Use isConstraintViolationError instead
 */
export function isInvariantError(error: unknown): error is InvariantError {
  return error instanceof InvariantError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

// ============================================================================
// Effect Integration (for adapter layer)
// ============================================================================

/**
 * Union type of all domain errors for Effect error channels
 */
export type DomainErrors =
  | ValidationError
  | FieldValidationError
  | SchemaValidationError
  | ConstraintViolationError
  | InvariantError
  | NotFoundError
  | EntityNotFoundError
  | ResourceNotFoundError
  | StateTransitionError
  | InvalidStateError
  | UnauthorizedError
  | ForbiddenError
  | AuthenticationError
  | ConflictError
  | DuplicateError
  | ConcurrentModificationError
  | DatabaseError
  | NetworkError
  | ServiceUnavailableError
  | ResourceUnavailableError
  | QuotaExceededError
  | ConfigurationError
  | UnexpectedError;

// ============================================================================
// Backward Compatibility
// ============================================================================

/**
 * Backward compatibility with AppError factory pattern
 * @deprecated Use direct error classes instead (e.g., ValidationError.forField())
 */
export const AppError = {
  validation: (p: { field: string; message: string }): ValidationError =>
    ValidationError.forField(p.field, p.message),

  entityNotFound: (p: { entity: string; id: string }): EntityNotFoundError =>
    new EntityNotFoundError(p.entity, p.id),

  unauthorized: (p: {
    resource: string;
    action: string;
    userId: string;
  }): ForbiddenError => new ForbiddenError(p.resource, p.action),

  conflict: (p: { resource: string; message: string }): ConflictError =>
    new ConflictError(p.message),

  invariant: (p: { invariant: string }): ConstraintViolationError =>
    new ConstraintViolationError(
      p.invariant,
      `Invariant violated: ${p.invariant}`,
    ),

  invalidState: (p: {
    entity: string;
    id: string;
    currentState: string;
    requiredState?: string;
  }): InvalidStateError =>
    InvalidStateError.create(p.currentState, p.requiredState, p.entity),

  resourceUnavailable: (p: {
    resource: string;
    id: string;
    reason: string;
  }): ServiceUnavailableError =>
    new ServiceUnavailableError(
      p.resource,
      `${p.resource} '${p.id}' unavailable: ${p.reason}`,
    ),

  quotaExceeded: (p: {
    resource: string;
    limit: number;
    current: number;
  }): ConstraintViolationError =>
    new ConstraintViolationError(
      "quota",
      `${p.resource} quota exceeded (${p.current}/${p.limit})`,
    ),
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get error message from any domain error
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
