import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import { ChallengeStatus } from "@mirai-app/domain";
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
 * Valid status transitions map
 */
const VALID_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  [ChallengeStatus.HIDDEN]: [
    ChallengeStatus.VISIBLE,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.VISIBLE]: [
    ChallengeStatus.HIDDEN,
    ChallengeStatus.ACTIVE,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.ACTIVE]: [
    ChallengeStatus.VISIBLE,
    ChallengeStatus.VOTING_PHASE,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.VOTING_PHASE]: [
    ChallengeStatus.ACTIVE,
    ChallengeStatus.COMPLETED,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.COMPLETED]: [],
  [ChallengeStatus.CANCELLED]: [],
};

/**
 * Check if a status transition is valid
 */
function canTransitionTo(
  fromStatus: ChallengeStatus,
  toStatus: ChallengeStatus,
): boolean {
  // Always allow transition to CANCELLED from non-terminal states
  if (
    toStatus === ChallengeStatus.CANCELLED &&
    fromStatus !== ChallengeStatus.COMPLETED &&
    fromStatus !== ChallengeStatus.CANCELLED
  ) {
    return true;
  }

  const validTargets = VALID_TRANSITIONS[fromStatus] || [];
  return validTargets.includes(toStatus);
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
    const challengeDto = yield* challengeRepo.findById(input.challengeId);

    if (!challengeDto) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({ message: "Challenge not found" }),
      );
    }

    const previousStatus = challengeDto.status;

    // Check if transition is valid
    if (!canTransitionTo(previousStatus, input.newStatus)) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          message: `Invalid status transition from ${previousStatus} to ${input.newStatus}`,
          fromStatus: previousStatus,
          toStatus: input.newStatus,
        }),
      );
    }

    // Cannot transition from terminal states
    if (
      previousStatus === ChallengeStatus.COMPLETED ||
      previousStatus === ChallengeStatus.CANCELLED
    ) {
      return yield* Effect.fail(
        new InvalidStatusTransitionError({
          message: `Cannot transition from terminal state ${previousStatus}`,
          fromStatus: previousStatus,
          toStatus: input.newStatus,
        }),
      );
    }

    // Update status via repository
    const saved = yield* challengeRepo
      .updateStatus(input.challengeId, input.newStatus)
      .pipe(
        Effect.mapError(
          (dbError) =>
            new ChallengeUpdateError({
              message: "Failed to update challenge status",
              cause: dbError,
            }),
        ),
      );

    return {
      id: saved.id,
      tripId: saved.tripId,
      name: saved.title,
      previousStatus,
      newStatus: saved.status,
      updatedAt: saved.updatedAt,
    };
  });
}
