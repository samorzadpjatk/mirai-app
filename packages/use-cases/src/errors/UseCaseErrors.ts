import { Data } from "effect";

export class UseCaseNotFoundError extends Data.TaggedError(
  "UseCaseNotFoundError",
)<{
  readonly entity: string;
  readonly message: string;
}> {}

export class UseCaseConflictError extends Data.TaggedError(
  "UseCaseConflictError",
)<{
  readonly entity: string;
  readonly message: string;
}> {}

export class UseCaseValidationError extends Data.TaggedError(
  "UseCaseValidationError",
)<{
  readonly field: string;
  readonly message: string;
}> {}

export class UseCaseRepositoryError extends Data.TaggedError(
  "UseCaseRepositoryError",
)<{
  readonly operation: string;
  readonly message: string;
  readonly cause: unknown;
}> {}

export type UseCaseError =
  | UseCaseNotFoundError
  | UseCaseConflictError
  | UseCaseValidationError
  | UseCaseRepositoryError;

export function getUseCaseErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }

  return "Unexpected use case error";
}
