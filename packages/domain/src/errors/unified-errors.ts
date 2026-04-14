/**
 * Unified Domain Error Hierarchy
 * Placeholder file - full implementation pending
 */

import { Data } from "effect";

export class DomainError extends Data.TaggedError("DomainError")<{
  message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field?: string;
  message: string;
}> {
  /**
   * Create a validation error for a required field
   */
  static required(field: string): ValidationError {
    return new ValidationError({
      field,
      message: `${field} is required`,
    });
  }

  /**
   * Create a validation error for min length constraint
   */
  static minLength(field: string, min: number): ValidationError {
    return new ValidationError({
      field,
      message: `${field} must be at least ${min} characters`,
    });
  }

  /**
   * Create a validation error for max length constraint
   */
  static maxLength(field: string, max: number): ValidationError {
    return new ValidationError({
      field,
      message: `${field} must be at most ${max} characters`,
    });
  }

  /**
   * Create a validation error for min value constraint
   */
  static minValue(field: string, min: number): ValidationError {
    return new ValidationError({
      field,
      message: `${field} must be at least ${min}`,
    });
  }

  /**
   * Create a validation error for max value constraint
   */
  static maxValue(field: string, max: number): ValidationError {
    return new ValidationError({
      field,
      message: `${field} must be at most ${max}`,
    });
  }
}

export class FieldValidationError extends Data.TaggedError(
  "FieldValidationError",
)<{
  field: string;
  message: string;
}> {}

export class SchemaValidationError extends Data.TaggedError(
  "SchemaValidationError",
)<{
  message: string;
}> {}

export class ConstraintViolationError extends Data.TaggedError(
  "ConstraintViolationError",
)<{
  message: string;
}> {}

export class InvariantError extends Data.TaggedError("InvariantError")<{
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity?: string;
  id?: string;
  message: string;
}> {}

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{
  entity: string;
  id: string;
}> {}

export class ResourceNotFoundError extends Data.TaggedError(
  "ResourceNotFoundError",
)<{
  resource: string;
  id: string;
}> {}

export class StateTransitionError extends Data.TaggedError(
  "StateTransitionError",
)<{
  from: string;
  to: string;
  message: string;
}> {}

export class InvalidStateError extends Data.TaggedError("InvalidStateError")<{
  state: string;
  message: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  message: string;
}> {}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  message: string;
}> {}

export class AuthenticationError extends Data.TaggedError(
  "AuthenticationError",
)<{
  message: string;
}> {}

export class ConflictError extends Data.TaggedError("ConflictError")<{
  message: string;
}> {}

export class DuplicateError extends Data.TaggedError("DuplicateError")<{
  entity: string;
  field: string;
  value: string;
}> {}

export class ConcurrentModificationError extends Data.TaggedError(
  "ConcurrentModificationError",
)<{
  message: string;
}> {}

export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  quota: string;
  limit: number;
}> {}

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  cause?: unknown;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  cause?: unknown;
}> {}

export class ServiceUnavailableError extends Data.TaggedError(
  "ServiceUnavailableError",
)<{
  service: string;
}> {}

export class ResourceUnavailableError extends Data.TaggedError(
  "ResourceUnavailableError",
)<{
  resource: string;
}> {}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  message: string;
}> {}

export class UnexpectedError extends Data.TaggedError("UnexpectedError")<{
  cause?: unknown;
}> {}

export class AppError extends Data.TaggedError("AppError")<{
  message: string;
}> {}

export type DomainErrors =
  | DomainError
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
  | QuotaExceededError
  | DatabaseError
  | NetworkError
  | ServiceUnavailableError
  | ResourceUnavailableError
  | ConfigurationError
  | UnexpectedError
  | AppError;

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
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

export function isInvariantError(error: unknown): error is InvariantError {
  return error instanceof InvariantError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function getDomainErrorMessage(error: unknown): string {
  if (error instanceof DomainError) {
    return error.message;
  }
  return "Unknown error";
}

export function getDomainErrorCode(error: unknown): string {
  if (error instanceof DomainError) {
    return "DOMAIN_ERROR";
  }
  return "UNKNOWN_ERROR";
}
