/**
 * Domain Errors - Barrel Export
 *
 * @module errors
 */

export {
  // Error class (value export)
  UnauthorizedError,
  // Error types (type-only exports)
  type EntityNotFoundError,
  type ValidationError,
  type ConflictError,
  type InvariantError,
  type InvalidStateError,
  type ResourceUnavailableError,
  type QuotaExceededError,
  // Union type
  type DomainError,
  // Utility functions
  isDomainError,
  getDomainErrorMessage,
  getDomainErrorCode,
} from "./DomainErrors";
