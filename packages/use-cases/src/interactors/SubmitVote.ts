import { Effect } from "effect";
import { ChallengeVote, ValidationError } from "@mirai-app/domain";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for SubmitVote use case (single vote)
 */
export interface SubmitVoteInput {
  challengeId: string;
  submissionId: string;
  voterId: string;
  position: number;
  points?: number;
  normalizedWeight?: number;
  allowPartial?: boolean; // For judged staff: allow voting one position at a time
}

/**
 * Output DTO for SubmitVote use case
 */
export interface SubmitVoteOutput {
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
 * Error types for SubmitVote use case
 */
export class SubmitVoteValidationError extends Error {
  readonly _tag = "SubmitVoteValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class VotePositionTakenError extends Error {
  readonly _tag = "VotePositionTakenError";
  constructor(message: string = "Vote position is already taken") {
    super(message);
  }
}

export class AlreadyVotedError extends Error {
  readonly _tag = "AlreadyVotedError";
  constructor(message: string = "You have already voted in this challenge") {
    super(message);
  }
}

export class VoteRepositoryError extends Error {
  readonly _tag = "VoteRepositoryError";
  constructor(message: string = "Failed to save vote") {
    super(message);
  }
}

/**
 * SubmitVote Use Case (Effect-based)
 *
 * Submits a single vote for a challenge.
 * For peer voting: rejects if voter has already voted (any position).
 * For judged staff: allows partial voting (one position at a time).
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = submitVoteUseCase(input);
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function submitVoteUseCase(
  input: SubmitVoteInput,
): Effect.Effect<
  SubmitVoteOutput,
  | SubmitVoteValidationError
  | VotePositionTakenError
  | AlreadyVotedError
  | VoteRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new SubmitVoteValidationError("challengeId is required"),
      );
    }

    if (!input.submissionId || input.submissionId.trim() === "") {
      return yield* Effect.fail(
        new SubmitVoteValidationError("submissionId is required"),
      );
    }

    if (!input.voterId || input.voterId.trim() === "") {
      return yield* Effect.fail(
        new SubmitVoteValidationError("voterId is required"),
      );
    }

    // Validate position
    if (input.position < 1 || input.position > 3) {
      return yield* Effect.fail(
        new SubmitVoteValidationError("position must be between 1 and 3"),
      );
    }

    // Check if voter has already voted for this position
    const hasVotedForPosition = yield* voteRepo.hasVotedForPosition(
      input.challengeId,
      input.voterId,
      input.position,
    );

    if (hasVotedForPosition) {
      return yield* Effect.fail(new VotePositionTakenError());
    }

    // For non-partial voting, check if voter has already voted at all
    if (!input.allowPartial) {
      const hasVoted = yield* voteRepo.hasVoted(
        input.challengeId,
        input.voterId,
      );
      if (hasVoted) {
        return yield* Effect.fail(new AlreadyVotedError());
      }
    }

    // Create domain entity using Effect-based static create method
    const vote = yield* ChallengeVote.create({
      challengeId: input.challengeId,
      submissionId: input.submissionId,
      voterId: input.voterId,
      position: input.position,
      ...(input.points !== undefined && { points: input.points }),
      ...(input.normalizedWeight !== undefined && {
        weight: input.normalizedWeight,
      }),
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new SubmitVoteValidationError(validationError.message),
      ),
    );

    // Persist vote
    const saved = yield* voteRepo
      .create(vote)
      .pipe(
        Effect.mapError(() => new VoteRepositoryError("Failed to save vote")),
      );

    return toOutput(saved);
  });
}

function toOutput(vote: ChallengeVote): SubmitVoteOutput {
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
