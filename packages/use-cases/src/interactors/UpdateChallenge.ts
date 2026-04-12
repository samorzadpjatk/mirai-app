import { Challenge, ChallengeStatus, ValidationError } from "@mirai-app/domain";
import { Effect } from "effect";
import { ChallengeRepositoryTag } from "../ports/ChallengeRepository";

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
export class ChallengeNotFoundError extends Error {
  readonly _tag = "ChallengeNotFoundError";
  constructor() {
    super("Challenge not found");
  }
}

export class ChallengeUpdateValidationError extends Error {
  readonly _tag = "ChallengeUpdateValidationError";
  constructor(message: string) {
    super(message);
  }
}

export class ChallengeTerminalStateError extends Error {
  readonly _tag = "ChallengeTerminalStateError";
  constructor() {
    super("Cannot update a completed or cancelled challenge");
  }
}

export class ChallengeUpdateRepositoryError extends Error {
  readonly _tag = "ChallengeUpdateRepositoryError";
  constructor(message: string = "Failed to update challenge") {
    super(message);
  }
}

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
  ChallengeRepositoryTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeRepositoryTag;

    // Find existing challenge
    const challenge = yield* challengeRepo
      .findById(input.challengeId)
      .pipe(
        Effect.mapError(
          () => new ChallengeUpdateRepositoryError("Failed to load challenge"),
        ),
      );

    if (!challenge) {
      return yield* Effect.fail(new ChallengeNotFoundError());
    }

    // Check if challenge is in terminal state
    if (challenge.isTerminal()) {
      return yield* Effect.fail(new ChallengeTerminalStateError());
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
              new ChallengeUpdateValidationError(validationError.message),
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
              new ChallengeUpdateValidationError(validationError.message),
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
              new ChallengeUpdateValidationError(validationError.message),
          ),
        );
    }

    // Persist changes
    const saved = yield* challengeRepo
      .update(updatedChallenge)
      .pipe(
        Effect.mapError(
          () => new ChallengeUpdateRepositoryError("Failed to save challenge"),
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
