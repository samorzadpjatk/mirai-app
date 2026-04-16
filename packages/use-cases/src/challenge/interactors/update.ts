import { Challenge, ChallengeStatus, ValidationError } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";

/**
 * Input for UpdateChallenge use case
 */
export interface UpdateChallengeInput {
  challengeId: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  basePoints?: number;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
  startTime?: Date | null;
  endTime?: Date | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
  expectedValue?: string | null;
  autoApprove?: boolean;
}

/**
 * Output DTO for UpdateChallenge use case
 */
export interface UpdateChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  basePoints: number;
  status: string;
  updatedAt: Date;
  isOpenForSubmission: boolean;
}

/**
 * Error types for UpdateChallenge use case
 */
export class ChallengeNotFoundError extends Data.TaggedError(
  "ChallengeNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeUpdateValidationError extends Data.TaggedError(
  "ChallengeUpdateValidationError",
)<{
  message: string;
}> {}

export class ChallengeTerminalStateError extends Data.TaggedError(
  "ChallengeTerminalStateError",
)<{
  message: string;
}> {}

export class ChallengeUpdateRepositoryError extends Data.TaggedError(
  "ChallengeUpdateRepositoryError",
)<{
  message: string;
}> {}

/**
 * UpdateChallenge Use Case
 *
 * Updates a challenge's details.
 * Returns error if challenge not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection.
 */
export function updateChallengeUseCase(
  input: UpdateChallengeInput,
): Effect.Effect<
  UpdateChallengeOutput,
  | ChallengeNotFoundError
  | ChallengeUpdateValidationError
  | ChallengeTerminalStateError
  | ChallengeUpdateRepositoryError,
  ChallengeGatewayTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeGatewayTag;

    // Find existing challenge
    const challenge = yield* challengeRepo.findById(input.challengeId).pipe(
      Effect.mapError(
        () =>
          new ChallengeUpdateRepositoryError({
            message: "Failed to load challenge",
          }),
      ),
    );

    if (!challenge) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({ message: "Challenge not found" }),
      );
    }

    // Check if challenge is in terminal state
    if (challenge.isTerminal()) {
      return yield* Effect.fail(
        new ChallengeTerminalStateError({
          message: "Cannot update a completed or cancelled challenge",
        }),
      );
    }

    // Apply updates
    let updatedChallenge: Challenge = challenge;

    // Update details if provided
    if (
      input.name !== undefined ||
      input.description !== undefined ||
      input.image !== undefined
    ) {
      updatedChallenge = yield* updatedChallenge
        .updateDetails({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.image !== undefined && { image: input.image }),
        })
        .pipe(
          Effect.mapError(
            (validationError: ValidationError) =>
              new ChallengeUpdateValidationError({
                message: validationError.message,
              }),
          ),
        );
    }

    // Update points if provided
    if (
      input.basePoints !== undefined ||
      input.firstPlacePoints !== undefined ||
      input.secondPlacePoints !== undefined ||
      input.thirdPlacePoints !== undefined
    ) {
      updatedChallenge = yield* updatedChallenge
        .updatePoints({
          ...(input.basePoints !== undefined && {
            basePoints: input.basePoints,
          }),
          ...(input.firstPlacePoints !== undefined && {
            firstPlacePoints: input.firstPlacePoints,
          }),
          ...(input.secondPlacePoints !== undefined && {
            secondPlacePoints: input.secondPlacePoints,
          }),
          ...(input.thirdPlacePoints !== undefined && {
            thirdPlacePoints: input.thirdPlacePoints,
          }),
        })
        .pipe(
          Effect.mapError(
            (validationError: ValidationError) =>
              new ChallengeUpdateValidationError({
                message: validationError.message,
              }),
          ),
        );
    }

    // Update schedule if any time-related fields provided
    if (
      input.startTime !== undefined ||
      input.endTime !== undefined ||
      input.dailyStartTime !== undefined ||
      input.dailyEndTime !== undefined
    ) {
      updatedChallenge = yield* updatedChallenge
        .updateSchedule({
          ...(input.startTime !== undefined && { startTime: input.startTime }),
          ...(input.endTime !== undefined && { endTime: input.endTime }),
          ...(input.dailyStartTime !== undefined && {
            dailyStartTime: input.dailyStartTime,
          }),
          ...(input.dailyEndTime !== undefined && {
            dailyEndTime: input.dailyEndTime,
          }),
        })
        .pipe(
          Effect.mapError(
            (validationError: ValidationError) =>
              new ChallengeUpdateValidationError({
                message: validationError.message,
              }),
          ),
        );
    }

    // Persist changes
    const saved = yield* challengeRepo.update(updatedChallenge).pipe(
      Effect.mapError(
        () =>
          new ChallengeUpdateRepositoryError({
            message: "Failed to save challenge",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(challenge: Challenge): UpdateChallengeOutput {
  return {
    id: challenge.id,
    tripId: challenge.tripId,
    name: challenge.name,
    description: challenge.description,
    basePoints: challenge.basePoints,
    status: challenge.status,
    updatedAt: challenge.updatedAt,
    isOpenForSubmission: challenge.isOpenForSubmission(),
  };
}
