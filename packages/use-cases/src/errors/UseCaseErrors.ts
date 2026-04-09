/**
 * UseCaseErrors - Application layer error classes
 *
 * These errors represent failures that can occur during use case execution.
 * They use a type-safe TaggedError pattern with a `code` discriminator
 * field for programmatic error handling.
 *
 * ## Error Types
 *
 * - UseCaseNotFoundError - Entity not found during use case execution
 * - UseCaseConflictError - Business rule conflict (e.g., duplicate data)
 * - UseCaseValidationError - Input validation failure
 * - UseCaseRepositoryError - Data access failure
 *
 * ## Usage
 *
 * ```typescript
 * import { UseCaseNotFoundError } from "@mirai-app/use-cases/errors";
 *
 * async function getUser(id: string): Promise<User> {
 *   const user = await repository.findById(id);
 *   if (!user) {
 *     throw new UseCaseNotFoundError({
 *       entity: "User",
 *       message: `User with id ${id} not found`
 *     });
 *   }
 *   return user;
 * }
 * ```
 *
 * @module UseCaseErrors
 */

// =============================================================================
// Error Classes
// =============================================================================

/**
 * Error thrown when an entity is not found during use case execution
 *
 * @example
 * ```typescript
 * const error = new UseCaseNotFoundError({
 *   entity: "User",
 *   message: "User with id '123' not found",
 *   code: "NOT_FOUND"
 * });
 * ```
 */
export class UseCaseNotFoundError extends Error {
  readonly _tag = "UseCaseNotFoundError" as const;
  readonly code = "NOT_FOUND" as const;
  readonly entity: string;
  override readonly message: string;

  constructor(props: { entity: string; message: string }) {
    super(props.message);
    this.entity = props.entity;
    this.message = props.message;
  }
}

/**
 * Error thrown when a business rule conflict occurs
 *
 * Used for cases like duplicate entries, unique constraint violations,
 * or state conflicts that prevent the operation.
 *
 * @example
 * ```typescript
 * const error = new UseCaseConflictError({
 *   entity: "User",
 *   message: "Email address already exists",
 *   code: "CONFLICT"
 * });
 * ```
 */
export class UseCaseConflictError extends Error {
  readonly _tag = "UseCaseConflictError" as const;
  readonly code = "CONFLICT" as const;
  readonly entity: string;
  override readonly message: string;

  constructor(props: { entity: string; message: string }) {
    super(props.message);
    this.entity = props.entity;
    this.message = props.message;
  }
}

/**
 * Error thrown when input validation fails
 *
 * @example
 * ```typescript
 * const error = new UseCaseValidationError({
 *   field: "email",
 *   message: "Must be a valid email address",
 *   code: "VALIDATION_FAILED"
 * });
 * ```
 */
export class UseCaseValidationError extends Error {
  readonly _tag = "UseCaseValidationError" as const;
  readonly code = "VALIDATION_FAILED" as const;
  readonly field: string;
  override readonly message: string;

  constructor(props: { field: string; message: string }) {
    super(`Validation failed for '${props.field}': ${props.message}`);
    this.field = props.field;
    this.message = props.message;
  }
}

/**
 * Error thrown when a repository/data access operation fails
 *
 * This wraps underlying database or external service errors.
 *
 * @example
 * ```typescript
 * const error = new UseCaseRepositoryError({
 *   operation: "createUser",
 *   message: "Database connection timeout",
 *   cause: originalError,
 *   code: "REPOSITORY_ERROR"
 * });
 * ```
 */
export class UseCaseRepositoryError extends Error {
  readonly _tag = "UseCaseRepositoryError" as const;
  readonly code = "REPOSITORY_ERROR" as const;
  readonly operation: string;
  override readonly message: string;
  readonly cause?: unknown;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(`Repository error in '${props.operation}': ${props.message}`);
    this.operation = props.operation;
    this.message = props.message;
    this.cause = props.cause;
  }
}

/**
 * Error thrown when a user lacks permission for an operation
 *
 * @example
 * ```typescript
 * const error = new UseCaseUnauthorizedError({
 *   userId: "user-123",
 *   action: "deleteChallenge",
 *   resource: "Challenge",
 *   code: "UNAUTHORIZED"
 * });
 * ```
 */
export class UseCaseUnauthorizedError extends Error {
  readonly _tag = "UseCaseUnauthorizedError" as const;
  readonly code = "UNAUTHORIZED" as const;
  readonly userId: string;
  readonly action: string;
  readonly resource: string;

  constructor(props: { userId: string; action: string; resource: string }) {
    super(
      `User '${props.userId}' is not authorized to ${props.action} ${props.resource}`,
    );
    this.userId = props.userId;
    this.action = props.action;
    this.resource = props.resource;
  }
}

// =============================================================================
// Specific Use Case Errors
// =============================================================================

/**
 * Error thrown when attempting to create a user that already exists
 *
 * @example
 * ```typescript
 * const error = new UserAlreadyExistsError({
 *   email: "user@example.com",
 *   message: "A user with this email already exists",
 *   code: "USER_ALREADY_EXISTS"
 * });
 * ```
 */
export class UserAlreadyExistsError extends Error {
  readonly _tag = "UserAlreadyExistsError" as const;
  readonly code = "USER_ALREADY_EXISTS" as const;
  readonly email: string;
  override readonly message: string;

  constructor(props: { email: string; message?: string }) {
    super(props.message ?? `User with email '${props.email}' already exists`);
    this.email = props.email;
    this.message =
      props.message ?? `User with email '${props.email}' already exists`;
  }
}

/**
 * Error thrown when a user has insufficient coins for an operation
 *
 * @example
 * ```typescript
 * const error = new InsufficientCoinsError({
 *   userId: "user-123",
 *   required: 100,
 *   available: 50,
 *   code: "INSUFFICIENT_COINS"
 * });
 * ```
 */
export class InsufficientCoinsError extends Error {
  readonly _tag = "InsufficientCoinsError" as const;
  readonly code = "INSUFFICIENT_COINS" as const;
  readonly userId: string;
  readonly required: number;
  readonly available: number;

  constructor(props: { userId: string; required: number; available: number }) {
    super(
      `Insufficient coins: required ${props.required}, available ${props.available}`,
    );
    this.userId = props.userId;
    this.required = props.required;
    this.available = props.available;
  }
}

/**
 * Error thrown when attempting to interact with a closed challenge
 *
 * @example
 * ```typescript
 * const error = new ChallengeClosedError({
 *   challengeId: "challenge-123",
 *   currentStatus: "completed",
 *   code: "CHALLENGE_CLOSED"
 * });
 * ```
 */
export class ChallengeClosedError extends Error {
  readonly _tag = "ChallengeClosedError" as const;
  readonly code = "CHALLENGE_CLOSED" as const;
  readonly challengeId: string;
  readonly currentStatus: string;

  constructor(props: { challengeId: string; currentStatus: string }) {
    super(
      `Challenge '${props.challengeId}' is closed (status: ${props.currentStatus})`,
    );
    this.challengeId = props.challengeId;
    this.currentStatus = props.currentStatus;
  }
}

/**
 * Error thrown when a reward is out of stock or unavailable
 *
 * @example
 * ```typescript
 * const error = new RewardOutOfStockError({
 *   rewardId: "reward-123",
 *   requested: 5,
 *   available: 2,
 *   code: "REWARD_OUT_OF_STOCK"
 * });
 * ```
 */
export class RewardOutOfStockError extends Error {
  readonly _tag = "RewardOutOfStockError" as const;
  readonly code = "REWARD_OUT_OF_STOCK" as const;
  readonly rewardId: string;
  readonly requested: number;
  readonly available: number;

  constructor(props: {
    rewardId: string;
    requested: number;
    available: number;
  }) {
    super(
      `Reward '${props.rewardId}' out of stock: requested ${props.requested}, available ${props.available}`,
    );
    this.rewardId = props.rewardId;
    this.requested = props.requested;
    this.available = props.available;
  }
}

/**
 * Error thrown when provided credentials are invalid
 *
 * @example
 * ```typescript
 * const error = new InvalidCredentialsError({
 *   message: "Email or password is incorrect",
 *   code: "INVALID_CREDENTIALS"
 * });
 * ```
 */
export class InvalidCredentialsError extends Error {
  readonly _tag = "InvalidCredentialsError" as const;
  readonly code = "INVALID_CREDENTIALS" as const;
  override readonly message: string;

  constructor(props?: { message?: string }) {
    super(props?.message ?? "Invalid credentials provided");
    this.message = props?.message ?? "Invalid credentials provided";
  }
}

/**
 * Error thrown when an operation is not allowed due to business rules
 *
 * @example
 * ```typescript
 * const error = new OperationNotAllowedError({
 *   operation: "deleteTrip",
 *   reason: "Trip has active challenges",
 *   code: "OPERATION_NOT_ALLOWED"
 * });
 * ```
 */
export class OperationNotAllowedError extends Error {
  readonly _tag = "OperationNotAllowedError" as const;
  readonly code = "OPERATION_NOT_ALLOWED" as const;
  readonly operation: string;
  readonly reason: string;

  constructor(props: { operation: string; reason: string }) {
    super(`Operation '${props.operation}' not allowed: ${props.reason}`);
    this.operation = props.operation;
    this.reason = props.reason;
  }
}

/**
 * Error thrown when a voting operation fails
 *
 * @example
 * ```typescript
 * const error = new VotingError({
 *   challengeId: "challenge-123",
 *   reason: "Voting period has ended",
 *   code: "VOTING_ERROR"
 * });
 * ```
 */
export class VotingError extends Error {
  readonly _tag = "VotingError" as const;
  readonly code = "VOTING_ERROR" as const;
  readonly challengeId: string;
  readonly reason: string;

  constructor(props: { challengeId: string; reason: string }) {
    super(`Voting error for challenge '${props.challengeId}': ${props.reason}`);
    this.challengeId = props.challengeId;
    this.reason = props.reason;
  }
}

/**
 * Error thrown when a submission operation fails
 *
 * @example
 * ```typescript
 * const error = new SubmissionError({
 *   challengeId: "challenge-123",
 *   reason: "Submission deadline has passed",
 *   code: "SUBMISSION_ERROR"
 * });
 * ```
 */
export class SubmissionError extends Error {
  readonly _tag = "SubmissionError" as const;
  readonly code = "SUBMISSION_ERROR" as const;
  readonly challengeId: string;
  readonly reason: string;

  constructor(props: { challengeId: string; reason: string }) {
    super(
      `Submission error for challenge '${props.challengeId}': ${props.reason}`,
    );
    this.challengeId = props.challengeId;
    this.reason = props.reason;
  }
}

// =============================================================================
// Union Type and Type Guards
// =============================================================================

/**
 * Union type of all use case errors
 */
export type UseCaseError =
  | UseCaseNotFoundError
  | UseCaseConflictError
  | UseCaseValidationError
  | UseCaseRepositoryError
  | UseCaseUnauthorizedError
  | UserAlreadyExistsError
  | InsufficientCoinsError
  | ChallengeClosedError
  | RewardOutOfStockError
  | InvalidCredentialsError
  | OperationNotAllowedError
  | VotingError
  | SubmissionError;

/**
 * Type guard to check if an error is a UseCaseError
 */
export function isUseCaseError(error: unknown): error is UseCaseError {
  return (
    error instanceof UseCaseNotFoundError ||
    error instanceof UseCaseConflictError ||
    error instanceof UseCaseValidationError ||
    error instanceof UseCaseRepositoryError ||
    error instanceof UseCaseUnauthorizedError ||
    error instanceof UserAlreadyExistsError ||
    error instanceof InsufficientCoinsError ||
    error instanceof ChallengeClosedError ||
    error instanceof RewardOutOfStockError ||
    error instanceof InvalidCredentialsError ||
    error instanceof OperationNotAllowedError ||
    error instanceof VotingError ||
    error instanceof SubmissionError
  );
}

/**
 * Get a human-readable error message from any use case error
 */
export function getUseCaseErrorMessage(error: unknown): string {
  if (isUseCaseError(error)) {
    return error.message;
  }

  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  return "Unexpected use case error";
}

/**
 * Get error code from any use case error
 */
export function getUseCaseErrorCode(error: UseCaseError): string {
  return error.code;
}
