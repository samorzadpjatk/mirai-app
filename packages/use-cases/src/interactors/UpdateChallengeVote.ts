import { ChallengeVote, ValidationError } from "@mirai-app/domain";
import { Effect } from "effect";
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
export class ChallengeVoteNotFoundError extends Error {
  readonly _tag = "ChallengeVoteNotFoundError";
  constructor() {
    super("Vote not found");
  }
}

export class ChallengeVoteValidationError extends Error {
  readonly _tag = "ChallengeVoteValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class ChallengeVoteUpdateRepositoryError extends Error {
  readonly _tag = "ChallengeVoteUpdateRepositoryError";
  constructor(message: string = "Failed to update vote") {
    super(message);
  }
}

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
    const existingVote = yield* voteRepo
      .findById(input.voteId)
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeVoteUpdateRepositoryError(
              "Failed to load existing vote",
            ),
        ),
      );

    if (!existingVote) {
      return yield* Effect.fail(new ChallengeVoteNotFoundError());
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
          new ChallengeVoteValidationError(validationError.message),
      ),
    );

    // Save to repository
    const saved = yield* voteRepo
      .create(vote)
      .pipe(
        Effect.mapError(
          () => new ChallengeVoteUpdateRepositoryError("Failed to update vote"),
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
