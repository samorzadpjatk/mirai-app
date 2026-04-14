/**
 * Domain Errors - Unified Export
 *
 * This module exports all domain errors from a unified hierarchy.
 * Consolidates 124 error classes into 20 well-defined types.
 *
 * This is the single source of truth for all domain errors.
 * Old error files (domain-errors.ts, effect-errors.ts, DomainErrors.ts) have been removed.
 *
 * Usage: import { ValidationError } from "@mirai-app/domain/errors"
 *
 * @module errors
 */

// Unified error hierarchy (single source of truth)
export {
  // Base
  DomainError,
  // Validation
  ValidationError,
  FieldValidationError,
  SchemaValidationError,
  ConstraintViolationError,
  InvariantError,
  // Not Found
  NotFoundError,
  EntityNotFoundError,
  ResourceNotFoundError,
  // State
  StateTransitionError,
  InvalidStateError,
  // Authorization
  UnauthorizedError,
  ForbiddenError,
  AuthenticationError,
  // Conflict
  ConflictError,
  DuplicateError,
  ConcurrentModificationError,
  QuotaExceededError,
  // External
  DatabaseError,
  NetworkError,
  ServiceUnavailableError,
  ResourceUnavailableError,
  // System
  ConfigurationError,
  UnexpectedError,
  // Type guards
  isDomainError,
  isValidationError,
  isNotFoundError,
  isStateTransitionError,
  isUnauthorizedError,
  isConflictError,
  isInvariantError,
  isDatabaseError,
  // Utilities
  getDomainErrorMessage,
  getDomainErrorCode,
  // Backward compatibility (AppError factory)
  AppError,
  type DomainErrors,
} from "./unified-errors";
