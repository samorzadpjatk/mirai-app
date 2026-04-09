/**
 * Use Case Errors - Barrel Export
 *
 * @module errors
 */

export {
  // Error types
  type UseCaseNotFoundError,
  type UseCaseConflictError,
  type UseCaseValidationError,
  type UseCaseRepositoryError,
  type UseCaseUnauthorizedError,
  type UserAlreadyExistsError,
  type InsufficientCoinsError,
  type ChallengeClosedError,
  type RewardOutOfStockError,
  type InvalidCredentialsError,
  type OperationNotAllowedError,
  type VotingError,
  type SubmissionError,
  // Union type
  type UseCaseError,
  // Utility functions
  isUseCaseError,
  getUseCaseErrorMessage,
  getUseCaseErrorCode,
  // Factory
  AppError,
} from "./UseCaseErrors";
