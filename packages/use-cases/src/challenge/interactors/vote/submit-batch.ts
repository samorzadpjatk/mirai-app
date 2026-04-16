import { Data, Effect } from "effect";
import {
  ChallengeVote,
  ValidationError,
  validateVoteSet,
} from "@mirai-app/domain";
import { ChallengeVoteGatewayTag } from "../../ports/vote/gateway";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Single vote input for batch submission
 */
export interface VoteInput {
  submissionId: string;
  position: number;
  points?: number;
  normalizedWeight?: number;
}

/**
 * Input for SubmitVotes use case
 */
export interface SubmitVotesInput {
  challengeId: string;
  voterId: string;
  votes: VoteInput[];
  requiredPositions: number;
}

/**
 * Output vote DTO
 */
export interface VoteOutput {
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
 * Output DTO for SubmitVotes use case
 */
export interface SubmitVotesOutput {
  votes: VoteOutput[];
  totalVotesCast: number;
}

/**
 * Error types for SubmitVotes use case
 */
export class SubmitVotesValidationError extends Data.TaggedError(
  "SubmitVotesValidationError",
)<{
  message: string;
}> {}

export class BatchAlreadyVotedError extends Data.TaggedError(
  "BatchAlreadyVotedError",
)<{
  message: string;
}> {}

export class InvalidVoteSetError extends Data.TaggedError(
  "InvalidVoteSetError",
)<{
  message: string;
}> {}

export class BatchVoteRepositoryError extends Data.TaggedError(
  "BatchVoteRepositoryError",
)<{
  message: string;
}> {}

/**
 * SubmitVotes Use Case (Effect-based)
 *
 * Submits multiple votes for a challenge in a single transaction.
 * Validates that:
 * - Voter hasn't already voted
 * - All positions are unique
 * - All submissions are unique
 * - Required positions are filled
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = submitVotesUseCase(input);
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function submitVotesUseCase(
  input: SubmitVotesInput,
): Effect.Effect<
  SubmitVotesOutput,
  | DatabaseError
  | SubmitVotesValidationError
  | BatchAlreadyVotedError
  | InvalidVoteSetError
  | BatchVoteRepositoryError,
  ChallengeVoteGatewayTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteGatewayTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new SubmitVotesValidationError({
          message: "Challenge ID is required",
        }),
      );
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return yield* Effect.fail(
        new SubmitVotesValidationError({
          message: "Voter ID is required",
        }),
      );
    }

    if (!input.votes || input.votes.length === 0) {
      return yield* Effect.fail(
        new SubmitVotesValidationError({
          message: "At least one vote is required",
        }),
      );
    }

    // Check if voter has already voted
    const hasVoted = yield* voteRepo.hasVoted(input.challengeId, input.voterId);

    if (hasVoted) {
      return yield* Effect.fail(
        new BatchAlreadyVotedError({
          message: "You have already voted in this challenge",
        }),
      );
    }

    // Validate vote set (pure validation - no async)
    const validation = validateVoteSet(
      input.votes.map((v) => ({
        submissionId: v.submissionId,
        position: v.position,
      })),
      input.requiredPositions,
    );

    if (!validation.isValid) {
      return yield* Effect.fail(
        new InvalidVoteSetError({
          message: validation.error ?? "Invalid vote set",
        }),
      );
    }

    // Create domain entities
    const voteEntities: ChallengeVote[] = [];
    for (const voteInput of input.votes) {
      const vote = yield* ChallengeVote.create({
        challengeId: input.challengeId,
        submissionId: voteInput.submissionId,
        voterId: input.voterId,
        position: voteInput.position,
        ...(voteInput.points !== undefined && { points: voteInput.points }),
        ...(voteInput.normalizedWeight !== undefined && {
          weight: voteInput.normalizedWeight,
        }),
      }).pipe(
        Effect.mapError(
          (validationError: ValidationError) =>
            new SubmitVotesValidationError({
              message: validationError.message,
            }),
        ),
      );

      voteEntities.push(vote);
    }

    // Persist votes
    const savedVotes = yield* voteRepo.createMany(voteEntities).pipe(
      Effect.mapError(
        () =>
          new BatchVoteRepositoryError({
            message: "Failed to save votes",
          }),
      ),
    );

    return {
      votes: savedVotes.map((v) => toOutput(v)),
      totalVotesCast: savedVotes.length,
    };
  });
}

function toOutput(vote: ChallengeVote): VoteOutput {
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
