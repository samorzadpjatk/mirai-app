import { ChallengeVote, ValidationError } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for UpdateChallengeVote use case
 */
export interface UpdateChallengeVoteInput {
  voteId: string;
  position?: number;
  points?: number;
  weight?: number;
}

/**
 * Output DTO for UpdateChallengeVote use case
 */
export interface UpdateChallengeVoteOutput {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  position: number;
  points: number;
  weight: number;
  votedAt: Date;
}

/**
 * Error types for UpdateChallengeVote use case
 */
export class ChallengeVoteNotFoundError extends Data.TaggedError(
  "ChallengeVoteNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeVoteValidationError extends Data.TaggedError(
  "ChallengeVoteValidationError",
)<{
  message: string;
}> {}

export class ChallengeVoteUpdateRepositoryError extends Data.TaggedError(
  "ChallengeVoteUpdateRepositoryError",
)<{
  message: string;
}> {}

/**
 * UpdateChallengeVote Use Case
 *
 * Updates an existing vote.
 * Returns error if vote not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateChallengeVoteUseCase(input);
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
export function updateChallengeVoteUseCase(
  input: UpdateChallengeVoteInput,
): Effect.Effect<
  UpdateChallengeVoteOutput,
  | ChallengeVoteNotFoundError
  | ChallengeVoteValidationError
  | ChallengeVoteUpdateRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Check if vote exists
    const existingVote = yield* voteRepo.findById(input.voteId).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteUpdateRepositoryError({
            message: "Failed to load existing vote",
          }),
      ),
    );

    if (!existingVote) {
      return yield* Effect.fail(
        new ChallengeVoteNotFoundError({ message: "Vote not found" }),
      );
    }

    // Create updated vote with new values
    const vote = yield* ChallengeVote.create({
      id: existingVote.id,
      challengeId: existingVote.challengeId,
      submissionId: existingVote.submissionId,
      voterId: existingVote.voterId,
      position: input.position ?? existingVote.position.value,
      points: input.points ?? existingVote.points,
      weight: input.weight ?? existingVote.weight.value,
      votedAt: existingVote.votedAt,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeVoteValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Save to repository
    const saved = yield* voteRepo.create(vote).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteUpdateRepositoryError({
            message: "Failed to update vote",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(vote: ChallengeVote): UpdateChallengeVoteOutput {
  return {
    id: vote.id,
    challengeId: vote.challengeId,
    submissionId: vote.submissionId,
    voterId: vote.voterId,
    position: vote.position.value,
    points: vote.points,
    weight: vote.weight.value,
    votedAt: vote.votedAt,
  };
}
