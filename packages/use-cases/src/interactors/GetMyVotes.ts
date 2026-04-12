import { Effect } from "effect";
import { ChallengeVote } from "@mirai-app/domain";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for GetMyVotes use case
 */
export interface GetMyVotesInput {
  challengeId: string;
  voterId: string;
}

/**
 * Output vote DTO
 */
export interface VoteDTO {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}

/**
 * Output DTO for GetMyVotes use case
 */
export interface GetMyVotesOutput {
  votes: VoteDTO[];
  totalVotes: number;
}

/**
 * Error types for GetMyVotes use case
 */
export class GetMyVotesValidationError extends Error {
  readonly _tag = "GetMyVotesValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class GetMyVotesRepositoryError extends Error {
  readonly _tag = "GetMyVotesRepositoryError";
  constructor(message: string = "Failed to retrieve votes") {
    super(message);
  }
}

/**
 * GetMyVotes Use Case (Effect-based)
 *
 * Retrieves all votes cast by a specific voter in a challenge.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getMyVotesUseCase(input);
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getMyVotesUseCase(
  input: GetMyVotesInput,
): Effect.Effect<
  GetMyVotesOutput,
  GetMyVotesValidationError | GetMyVotesRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new GetMyVotesValidationError("challengeId is required"),
      );
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return yield* Effect.fail(
        new GetMyVotesValidationError("voterId is required"),
      );
    }

    // Fetch votes
    const votes = yield* voteRepo
      .findByChallengeAndVoter(input.challengeId, input.voterId)
      .pipe(Effect.mapError(() => new GetMyVotesRepositoryError()));

    // Sort by position
    const sortedVotes = [...votes].sort(
      (a, b) => a.position.value - b.position.value,
    );

    return {
      votes: sortedVotes.map((v) => toDTO(v)),
      totalVotes: sortedVotes.length,
    };
  });
}

function toDTO(vote: ChallengeVote): VoteDTO {
  return {
    id: vote.id as string,
    challengeId: vote.challengeId,
    submissionId: vote.submissionId,
    voterId: vote.voterId,
    votePosition: vote.position.value,
    votePoints: vote.points,
    normalizedWeight: vote.weight.value,
    votedAt: vote.votedAt,
  };
}
