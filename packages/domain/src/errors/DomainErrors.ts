/**
 * DomainErrors - Unified error factory for the domain layer
 *
 * Error Variants: entityNotFound, validation, unauthorized, conflict,
 * invariant, invalidState, resourceUnavailable, quotaExceeded
 *
 * Usage: `AppError.validation({ field: "email", message: "Invalid" })`
 * @module DomainErrors
 */

export const AppError = {
  entityNotFound: (p: { entity: string; id: string }) => ({
    _tag: "EntityNotFoundError" as const,
    code: "NOT_FOUND" as const,
    entity: p.entity,
    id: p.id,
    message: `${p.entity} with id '${p.id}' not found`,
  }),

  validation: (p: { field: string; message: string }) => ({
    _tag: "ValidationError" as const,
    code: "VALIDATION_FAILED" as const,
    field: p.field,
    message: `Validation failed for '${p.field}': ${p.message}`,
  }),

  unauthorized: (p: { resource: string; action: string; userId: string }) => ({
    _tag: "UnauthorizedError" as const,
    code: "UNAUTHORIZED" as const,
    resource: p.resource,
    action: p.action,
    userId: p.userId,
    message: `User '${p.userId}' is not authorized to ${p.action} ${p.resource}`,
  }),

  conflict: (p: { resource: string; message: string }) => ({
    _tag: "ConflictError" as const,
    code: "CONFLICT" as const,
    resource: p.resource,
    message: `Conflict in ${p.resource}: ${p.message}`,
  }),

  invariant: (p: { invariant: string; details?: Record<string, unknown> }) => ({
    _tag: "InvariantError" as const,
    code: "INVARIANT_VIOLATED" as const,
    invariant: p.invariant,
    details: p.details,
    message: `Invariant violated: ${p.invariant}`,
  }),

  invalidState: (p: {
    entity: string;
    id: string;
    currentState: string;
    requiredState?: string;
  }) => ({
    _tag: "InvalidStateError" as const,
    code: "INVALID_STATE" as const,
    entity: p.entity,
    id: p.id,
    currentState: p.currentState,
    requiredState: p.requiredState,
    message: `${p.entity} '${p.id}' is in invalid state '${p.currentState}'${p.requiredState ? ` (required: '${p.requiredState}')` : ""}`,
  }),

  resourceUnavailable: (p: {
    resource: string;
    id: string;
    reason: string;
  }) => ({
    _tag: "ResourceUnavailableError" as const,
    code: "RESOURCE_UNAVAILABLE" as const,
    resource: p.resource,
    id: p.id,
    reason: p.reason,
    message: `${p.resource} '${p.id}' is unavailable: ${p.reason}`,
  }),

  quotaExceeded: (p: { resource: string; limit: number; current: number }) => ({
    _tag: "QuotaExceededError" as const,
    code: "QUOTA_EXCEEDED" as const,
    resource: p.resource,
    limit: p.limit,
    current: p.current,
    message: `${p.resource} quota exceeded (${p.current}/${p.limit})`,
  }),
} as const;

export type EntityNotFoundError = ReturnType<typeof AppError.entityNotFound>;
export type ValidationError = ReturnType<typeof AppError.validation>;
export type UnauthorizedError = ReturnType<typeof AppError.unauthorized>;
export type ConflictError = ReturnType<typeof AppError.conflict>;
export type InvariantError = ReturnType<typeof AppError.invariant>;
export type InvalidStateError = ReturnType<typeof AppError.invalidState>;
export type ResourceUnavailableError = ReturnType<
  typeof AppError.resourceUnavailable
>;
export type QuotaExceededError = ReturnType<typeof AppError.quotaExceeded>;

export type DomainError =
  | EntityNotFoundError
  | ValidationError
  | UnauthorizedError
  | ConflictError
  | InvariantError
  | InvalidStateError
  | ResourceUnavailableError
  | QuotaExceededError;

const ERROR_TAGS = [
  "EntityNotFoundError",
  "ValidationError",
  "UnauthorizedError",
  "ConflictError",
  "InvariantError",
  "InvalidStateError",
  "ResourceUnavailableError",
  "QuotaExceededError",
] as const;

export function isDomainError(error: unknown): error is DomainError {
  return (
    typeof error === "object" &&
    error !== null &&
    ERROR_TAGS.includes(
      (error as { _tag?: string })._tag as (typeof ERROR_TAGS)[number],
    )
  );
}

export function getDomainErrorMessage(error: DomainError): string {
  return error.message;
}

export function getDomainErrorCode(error: DomainError): string {
  return error.code;
}
