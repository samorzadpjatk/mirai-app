/**
 * UseCaseErrors - Application layer error factory (plain objects, not classes)
 * @example throw AppError.notFound({ entity: "User", message: "User not found" });
 */

const TAGS = [
  "UseCaseNotFoundError",
  "UseCaseConflictError",
  "UseCaseValidationError",
  "UseCaseRepositoryError",
  "UseCaseUnauthorizedError",
  "UserAlreadyExistsError",
  "InsufficientCoinsError",
  "ChallengeClosedError",
  "RewardOutOfStockError",
  "InvalidCredentialsError",
  "OperationNotAllowedError",
  "VotingError",
  "SubmissionError",
] as const;

/** Factory for creating use case errors as plain objects */
export const AppError = {
  notFound: (p: { entity: string; message: string }) => ({
    _tag: "UseCaseNotFoundError" as const,
    code: "NOT_FOUND" as const,
    ...p,
  }),
  conflict: (p: { entity: string; message: string }) => ({
    _tag: "UseCaseConflictError" as const,
    code: "CONFLICT" as const,
    ...p,
  }),
  validation: (p: { field: string; message: string }) => ({
    _tag: "UseCaseValidationError" as const,
    code: "VALIDATION_FAILED" as const,
    ...p,
  }),
  repository: (p: { operation: string; message: string; cause?: unknown }) => ({
    _tag: "UseCaseRepositoryError" as const,
    code: "REPOSITORY_ERROR" as const,
    ...p,
  }),
  unauthorized: (p: { userId: string; action: string; resource: string }) => ({
    _tag: "UseCaseUnauthorizedError" as const,
    code: "UNAUTHORIZED" as const,
    ...p,
  }),
  userAlreadyExists: (p: { email: string; message?: string }) => ({
    _tag: "UserAlreadyExistsError" as const,
    code: "USER_ALREADY_EXISTS" as const,
    ...p,
  }),
  insufficientCoins: (p: {
    userId: string;
    required: number;
    available: number;
  }) => ({
    _tag: "InsufficientCoinsError" as const,
    code: "INSUFFICIENT_COINS" as const,
    ...p,
  }),
  challengeClosed: (p: { challengeId: string; currentStatus: string }) => ({
    _tag: "ChallengeClosedError" as const,
    code: "CHALLENGE_CLOSED" as const,
    ...p,
  }),
  rewardOutOfStock: (p: {
    rewardId: string;
    requested: number;
    available: number;
  }) => ({
    _tag: "RewardOutOfStockError" as const,
    code: "REWARD_OUT_OF_STOCK" as const,
    ...p,
  }),
  invalidCredentials: (p?: { message?: string }) => ({
    _tag: "InvalidCredentialsError" as const,
    code: "INVALID_CREDENTIALS" as const,
    message: p?.message ?? "Invalid credentials provided",
  }),
  operationNotAllowed: (p: { operation: string; reason: string }) => ({
    _tag: "OperationNotAllowedError" as const,
    code: "OPERATION_NOT_ALLOWED" as const,
    ...p,
  }),
  voting: (p: { challengeId: string; reason: string }) => ({
    _tag: "VotingError" as const,
    code: "VOTING_ERROR" as const,
    ...p,
  }),
  submission: (p: { challengeId: string; reason: string }) => ({
    _tag: "SubmissionError" as const,
    code: "SUBMISSION_ERROR" as const,
    ...p,
  }),
} as const;

// Individual error types
export type UseCaseNotFoundError = ReturnType<typeof AppError.notFound>;
export type UseCaseConflictError = ReturnType<typeof AppError.conflict>;
export type UseCaseValidationError = ReturnType<typeof AppError.validation>;
export type UseCaseRepositoryError = ReturnType<typeof AppError.repository>;
export type UseCaseUnauthorizedError = ReturnType<typeof AppError.unauthorized>;
export type UserAlreadyExistsError = ReturnType<
  typeof AppError.userAlreadyExists
>;
export type InsufficientCoinsError = ReturnType<
  typeof AppError.insufficientCoins
>;
export type ChallengeClosedError = ReturnType<typeof AppError.challengeClosed>;
export type RewardOutOfStockError = ReturnType<
  typeof AppError.rewardOutOfStock
>;
export type InvalidCredentialsError = ReturnType<
  typeof AppError.invalidCredentials
>;
export type OperationNotAllowedError = ReturnType<
  typeof AppError.operationNotAllowed
>;
export type VotingError = ReturnType<typeof AppError.voting>;
export type SubmissionError = ReturnType<typeof AppError.submission>;

/** Union of all use case errors */
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

/** Type guard: Check if error is a UseCaseError */
export function isUseCaseError(e: unknown): e is UseCaseError {
  return (
    typeof e === "object" &&
    e !== null &&
    "_tag" in e &&
    TAGS.includes((e as { _tag: (typeof TAGS)[number] })._tag)
  );
}

/** Get error message from unknown error */
export function getUseCaseErrorMessage(e: unknown): string {
  if (isUseCaseError(e)) return (e as { message: string }).message;
  if (e instanceof Error && typeof e.message === "string") return e.message;
  return "Unexpected use case error";
}

/** Get error code from UseCaseError */
export function getUseCaseErrorCode(e: UseCaseError): string {
  return e.code;
}
