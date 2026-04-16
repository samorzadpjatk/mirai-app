import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import { ChallengeStatus } from "@mirai-app/domain";
import type { Challenge } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

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
export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{
  message: string;
}> {}

/**
 * Error when status transition is invalid
 */
export class InvalidStatusTransitionError extends Data.TaggedError(
  "InvalidStatusTransitionError",
)<{
  message: string;
  fromStatus: string;
  toStatus: string;
}> {}

/**
 * Error when challenge update fails
 */
export class ChallengeUpdateError extends Data.TaggedError(
  "ChallengeUpdateError",
)<{
  message: string;
  cause: unknown;
}> {}

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
 *   Effect.provideService(ChallengeGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateChallengeStatusUseCase(
  input: UpdateChallengeStatusInput,
): Effect.Effect<
  UpdateChallengeStatusOutput,
  | DatabaseError
  | ChallengeNotFoundError
  | InvalidStatusTransitionError
  | ChallengeUpdateError,
  ChallengeGatewayTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeGatewayTag;

    // Find existing challenge
    const challenge = yield* challengeRepo.findById(input.challengeId);

    if (!challenge) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({ message: "Challenge not found" }),
      );
    }

    const previousStatus = challenge.status;

    // Check if transition is valid
    if (!challenge.canTransitionTo(input.newStatus)) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          message: `Invalid status transition from ${previousStatus} to ${input.newStatus}`,
          fromStatus: previousStatus,
          toStatus: input.newStatus,
        }),
      );
    }

    // Apply status update
    const updatedChallenge = yield* challenge
      .updateStatus(input.newStatus)
      .pipe(
        Effect.mapError(
          (stateError) =>
            new ChallengeUpdateError({
              message: "Failed to update challenge",
              cause: stateError,
            }),
        ),
      );

    // Persist changes
    const saved = yield* challengeRepo.update(updatedChallenge);

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
