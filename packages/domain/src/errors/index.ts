/**
 * Domain Errors - Barrel Export
 *
 * @module errors
 */

export {
  // Base error classes
  EntityNotFoundError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  InvariantError,
  InvalidStateError,
  ResourceUnavailableError,
  QuotaExceededError,
  // Union type
  type DomainError,
  // Utility functions
  isDomainError,
  getDomainErrorMessage,
  getDomainErrorCode,
} from "./DomainErrors";
