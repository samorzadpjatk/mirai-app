import { ChallengeVote } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for DeleteChallengeVote use case
 */
export interface DeleteChallengeVoteInput {
  voteId: string;
}

/**
 * Output DTO for DeleteChallengeVote use case
 */
export interface DeleteChallengeVoteOutput {
  success: boolean;
  message: string;
}

/**
 * Error types for DeleteChallengeVote use case
 */
export class ChallengeVoteNotFoundError extends Error {
  readonly _tag = "ChallengeVoteNotFoundError";
  constructor() {
    super("Vote not found");
  }
}

export class ChallengeVoteDeleteRepositoryError extends Error {
  readonly _tag = "ChallengeVoteDeleteRepositoryError";
  constructor(message: string = "Failed to delete vote") {
    super(message);
  }
}

/**
 * DeleteChallengeVote Use Case
 *
 * Deletes a vote by ID.
 * Returns error if vote not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteChallengeVoteUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteChallengeVoteUseCase(
  input: DeleteChallengeVoteInput,
): Effect.Effect<
  DeleteChallengeVoteOutput,
  ChallengeVoteNotFoundError | ChallengeVoteDeleteRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Check if vote exists
    const existingVote = yield* voteRepo
      .findById(input.voteId)
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeVoteDeleteRepositoryError(
              "Failed to load existing vote",
            ),
        ),
      );

    if (!existingVote) {
      return yield* Effect.fail(new ChallengeVoteNotFoundError());
    }

    // Delete from repository
    yield* voteRepo
      .delete(input.voteId)
      .pipe(
        Effect.mapError(
          () => new ChallengeVoteDeleteRepositoryError("Failed to delete vote"),
        ),
      );

    return {
      success: true,
      message: "Vote deleted successfully",
    };
  });
}
