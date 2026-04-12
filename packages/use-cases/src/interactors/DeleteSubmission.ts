import { SubmissionId } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";

/**
 * Input for DeleteSubmission use case
 */
export interface DeleteSubmissionInput {
  submissionId: SubmissionId;
}

/**
 * Output DTO for DeleteSubmission use case
 */
export interface DeleteSubmissionOutput {
  success: boolean;
}

/**
 * Error types for DeleteSubmission use case
 */
export class SubmissionDeleteNotFoundError extends Error {
  readonly _tag = "SubmissionDeleteNotFoundError";
  constructor(message: string = "Submission not found") {
    super(message);
  }
}

export class SubmissionDeleteNotAllowedError extends Error {
  readonly _tag = "SubmissionDeleteNotAllowedError";
  constructor(
    message: string = "Cannot delete an approved or rejected submission",
  ) {
    super(message);
  }
}

export class DeleteSubmissionRepositoryError extends Error {
  readonly _tag = "DeleteSubmissionRepositoryError";
  constructor(message: string = "Failed to delete submission") {
    super(message);
  }
}

/**
 * DeleteSubmission Use Case (Effect-based)
 *
 * Deletes a submission by ID.
 * Returns error if submission not found or cannot be deleted (e.g., already approved).
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteSubmissionUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeSubmissionRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteSubmissionUseCase(
  input: DeleteSubmissionInput,
): Effect.Effect<
  DeleteSubmissionOutput,
  | SubmissionDeleteNotFoundError
  | SubmissionDeleteNotAllowedError
  | DeleteSubmissionRepositoryError,
  ChallengeSubmissionRepositoryTag
> {
  return Effect.gen(function* () {
    const submissionRepo = yield* ChallengeSubmissionRepositoryTag;

    // Find existing submission
    const existing = yield* submissionRepo
      .findById(input.submissionId)
      .pipe(
        Effect.mapError(
          () =>
            new DeleteSubmissionRepositoryError("Failed to find submission"),
        ),
      );

    if (!existing) {
      return yield* Effect.fail(new SubmissionDeleteNotFoundError());
    }

    // Check if can be deleted
    const canDelete = existing.canDelete();
    if (!canDelete) {
      return yield* Effect.fail(new SubmissionDeleteNotAllowedError());
    }

    // Delete submission
    yield* submissionRepo
      .delete(input.submissionId)
      .pipe(
        Effect.mapError(
          () =>
            new DeleteSubmissionRepositoryError("Failed to delete submission"),
        ),
      );

    return { success: true };
  });
}
