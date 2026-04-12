import { Effect } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";
import { ChallengeStatus } from "@mirai-app/domain";
import type { Challenge } from "@mirai-app/domain";

/**
 * Input for UpdateChallengeStatus use case
 */
export interface UpdateChallengeStatusInput {
  challengeId: string;
  newStatus: ChallengeStatus;
}

/**
 * Output DTO for UpdateChallengeStatus use case
 */
export interface UpdateChallengeStatusOutput {
  id: string;
  tripId: string;
  name: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: Date;
}

/**
 * Error when challenge is not found
 */
export class ChallengeNotFoundError extends Error {
  readonly _tag = "ChallengeNotFoundError";
  constructor() {
    super("Challenge not found");
  }
}

/**
 * Error when status transition is invalid
 */
export class InvalidStatusTransitionError extends Error {
  readonly _tag = "InvalidStatusTransitionError";
  constructor(
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(`Invalid status transition from ${fromStatus} to ${toStatus}`);
  }
}

/**
 * Error when challenge update fails
 */
export class ChallengeUpdateError extends Error {
  readonly _tag = "ChallengeUpdateError";
  constructor(public readonly cause: unknown) {
    super("Failed to update challenge");
  }
}

/**
 * UpdateChallengeStatus Use Case (Effect-based)
 *
 * Updates a challenge's status with workflow validation.
 * Returns error if challenge not found or transition is invalid.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = updateChallengeStatusUseCase(input).pipe(
 *   Effect.provideService(ChallengeRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateChallengeStatusUseCase(
  input: UpdateChallengeStatusInput,
): Effect.Effect<
  UpdateChallengeStatusOutput,
  ChallengeNotFoundError | InvalidStatusTransitionError | ChallengeUpdateError,
  ChallengeRepositoryTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeRepositoryTag;

    // Find existing challenge
    const challenge = yield* challengeRepo.findById(input.challengeId);

    if (!challenge) {
      return yield* Effect.fail(new ChallengeNotFoundError());
    }

    const previousStatus = challenge.status;

    // Check if transition is valid
    if (!challenge.canTransitionTo(input.newStatus)) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError(previousStatus, input.newStatus),
      );
    }

    // Apply status update
    const updateResult = challenge.updateStatus(input.newStatus);

    if (updateResult.kind === "err") {
      return yield* Effect.fail(new ChallengeUpdateError(updateResult.error));
    }

    // Persist changes
    const saved = yield* challengeRepo.update(updateResult.value);

    return {
      id: saved.id,
      tripId: saved.tripId,
      name: saved.name,
      previousStatus,
      newStatus: saved.status,
      updatedAt: saved.updatedAt,
    };
  });
}
