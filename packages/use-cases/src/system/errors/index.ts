export {
  AppError,
  UseCaseError,
  isUseCaseError,
  getUseCaseErrorMessage,
  getUseCaseErrorCode,
} from "./use-case-error";

import type { UseCaseError as UseCaseErrorType } from "./use-case-error";

/**
 * Type aliases for use case error types
 */
export type UseCaseNotFoundError = UseCaseErrorType;
export type UseCaseConflictError = UseCaseErrorType;
export type UseCaseValidationError = UseCaseErrorType;
export type UseCaseRepositoryError = UseCaseErrorType;
