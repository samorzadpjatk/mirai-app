import { ChallengeVote } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for GetChallengeVoteById use case
 */
export interface GetChallengeVoteByIdInput {
  voteId: string;
}

/**
 * Output DTO for GetChallengeVoteById use case
 */
export interface GetChallengeVoteByIdOutput {
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
 * Error types for GetChallengeVoteById use case
 */
export class ChallengeVoteNotFoundError extends Data.TaggedError(
  "ChallengeVoteNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeVoteGetRepositoryError extends Data.TaggedError(
  "ChallengeVoteGetRepositoryError",
)<{
  message: string;
}> {}

/**
 * GetChallengeVoteById Use Case
 *
 * Retrieves a vote by ID.
 * Returns error if vote not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getChallengeVoteByIdUseCase(input);
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
export function getChallengeVoteByIdUseCase(
  input: GetChallengeVoteByIdInput,
): Effect.Effect<
  GetChallengeVoteByIdOutput,
  ChallengeVoteNotFoundError | ChallengeVoteGetRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Find vote by ID
    const vote = yield* voteRepo.findById(input.voteId).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteGetRepositoryError({
            message: "Failed to retrieve vote",
          }),
      ),
    );

    if (!vote) {
      return yield* Effect.fail(
        new ChallengeVoteNotFoundError({ message: "Vote not found" }),
      );
    }

    return toOutput(vote);
  });
}

function toOutput(vote: ChallengeVote): GetChallengeVoteByIdOutput {
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
