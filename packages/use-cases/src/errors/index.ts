/**
 * Use Case Errors - Barrel Export
 *
 * @module errors
 */

export {
  // Base error classes
  UseCaseNotFoundError,
  UseCaseConflictError,
  UseCaseValidationError,
  UseCaseRepositoryError,
  UseCaseUnauthorizedError,
  // Specific use case errors
  UserAlreadyExistsError,
  InsufficientCoinsError,
  ChallengeClosedError,
  RewardOutOfStockError,
  InvalidCredentialsError,
  OperationNotAllowedError,
  VotingError,
  SubmissionError,
  // Union type
  type UseCaseError,
  // Utility functions
  isUseCaseError,
  getUseCaseErrorMessage,
  getUseCaseErrorCode,
} from "./UseCaseErrors";
