import { ChallengeVote, ValidationError } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

/**
 * Input for CreateChallengeVote use case
 */
export interface CreateChallengeVoteInput {
  challengeId: string;
  submissionId: string;
  voterId: string;
  position: number;
  points?: number;
  weight?: number;
}

/**
 * Output DTO for CreateChallengeVote use case
 */
export interface CreateChallengeVoteOutput {
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
 * Error types for CreateChallengeVote use case
 */
export class ChallengeVoteCreationError extends Error {
  readonly _tag = "ChallengeVoteCreationError";
  constructor(message: string) {
    super(message);
  }
}

export class ChallengeVoteAlreadyExistsError extends Error {
  readonly _tag = "ChallengeVoteAlreadyExistsError";
  constructor() {
    super("Voter has already voted for this position in this challenge");
  }
}

export class ChallengeVoteRepositoryError extends Error {
  readonly _tag = "ChallengeVoteRepositoryError";
  constructor(message: string = "Failed to create vote") {
    super(message);
  }
}

/**
 * CreateChallengeVote Use Case
 *
 * Creates a new vote for a challenge submission.
 * Returns error if validation fails or voter already voted for this position.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createChallengeVoteUseCase(input);
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
export function createChallengeVoteUseCase(
  input: CreateChallengeVoteInput,
): Effect.Effect<
  CreateChallengeVoteOutput,
  | ChallengeVoteCreationError
  | ChallengeVoteAlreadyExistsError
  | ChallengeVoteRepositoryError,
  ChallengeVoteRepositoryTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteRepositoryTag;

    // Check if voter already voted for this position in this challenge
    const hasVoted = yield* voteRepo
      .hasVotedForPosition(input.challengeId, input.voterId, input.position)
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeVoteRepositoryError(
              "Failed to check existing vote status",
            ),
        ),
      );

    if (hasVoted) {
      return yield* Effect.fail(new ChallengeVoteAlreadyExistsError());
    }

    // Create domain entity using Effect-based static create method
    const vote = yield* ChallengeVote.create({
      challengeId: input.challengeId,
      submissionId: input.submissionId,
      voterId: input.voterId,
      position: input.position,
      points: input.points,
      weight: input.weight,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeVoteCreationError(validationError.message),
      ),
    );

    // Save to repository
    const saved = yield* voteRepo
      .create(vote)
      .pipe(
        Effect.mapError(
          () => new ChallengeVoteRepositoryError("Failed to create vote"),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(vote: ChallengeVote): CreateChallengeVoteOutput {
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
