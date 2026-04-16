import {
  Challenge,
  ChallengeStatus,
  ValidationError,
  ChallengeId,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";
import type { ChallengeDTO } from "../dto";

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
    const challengeDto = yield* challengeRepo
      .findById(ChallengeId.unsafeCreate(input.challengeId))
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeUpdateRepositoryError({
              message: "Failed to load challenge",
            }),
        ),
      );

    if (!challengeDto) {
      return yield* Effect.fail(
        new ChallengeNotFoundError({ message: "Challenge not found" }),
      );
    }

    // Convert DTO to domain entity
    const challenge = yield* dtoToChallenge(challengeDto).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeUpdateValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Check if challenge is in terminal state
    if (challenge.isTerminal()) {
      return yield* Effect.fail(
        new ChallengeTerminalStateError({
          message: "Cannot update a completed or cancelled challenge",
        }),
      );
    }

    // Build update props
    const updateProps: Parameters<typeof Challenge.create>[0] = {
      id: challenge.id,
      tripId: challenge.tripId,
      name: input.name ?? challenge.name,
      description: input.description ?? challenge.description,
      image: input.image ?? challenge.image,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      basePoints: input.basePoints ?? challenge.basePoints,
      firstPlacePoints: input.firstPlacePoints ?? challenge.firstPlacePoints,
      secondPlacePoints: input.secondPlacePoints ?? challenge.secondPlacePoints,
      thirdPlacePoints: input.thirdPlacePoints ?? challenge.thirdPlacePoints,
      status: challenge.status,
      startTime: input.startTime ?? challenge.startTime,
      endTime: input.endTime ?? challenge.endTime,
      dailyStartTime: input.dailyStartTime ?? challenge.dailyStartTime,
      dailyEndTime: input.dailyEndTime ?? challenge.dailyEndTime,
      targetLatitude: input.targetLatitude ?? challenge.targetLatitude,
      targetLongitude: input.targetLongitude ?? challenge.targetLongitude,
      expectedValue: input.expectedValue ?? challenge.expectedValue,
      autoApprove: input.autoApprove ?? challenge.autoApprove,
      createdAt: challenge.createdAt,
      updatedAt: new Date(),
    };

    // Create updated challenge entity
    const updatedChallenge = yield* Challenge.create(updateProps).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeUpdateValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Convert back to DTO for persistence
    const updatedDto: ChallengeDTO = {
      id: updatedChallenge.id,
      tripId: updatedChallenge.tripId,
      title: updatedChallenge.name,
      description: updatedChallenge.description,
      status: updatedChallenge.status,
      submissionType: updatedChallenge.submissionType,
      scoringCategory: updatedChallenge.scoringCategory,
      points: updatedChallenge.basePoints,
      maxPoints: challengeDto.maxPoints,
      startDate: updatedChallenge.startTime,
      endDate: updatedChallenge.endTime,
      createdById: challengeDto.createdById,
      createdAt: updatedChallenge.createdAt,
      updatedAt: updatedChallenge.updatedAt,
    };

    // Persist changes
    const saved = yield* challengeRepo.update(updatedDto).pipe(
      Effect.mapError(
        () =>
          new ChallengeUpdateRepositoryError({
            message: "Failed to save challenge",
          }),
      ),
    );

    // Convert saved DTO back to entity for output
    const savedEntity = yield* dtoToChallenge(saved).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeUpdateValidationError({
            message: validationError.message,
          }),
      ),
    );

    return toOutput(savedEntity);
  });
}

/**
 * Convert ChallengeDTO to Challenge domain entity
 */
function dtoToChallenge(
  dto: ChallengeDTO,
): Effect.Effect<Challenge, ValidationError, never> {
  return Challenge.create({
    id: dto.id,
    tripId: dto.tripId,
    name: dto.title,
    description: dto.description,
    submissionType: dto.submissionType,
    scoringCategory: dto.scoringCategory,
    basePoints: dto.points,
    status: dto.status,
    startTime: dto.startDate,
    endTime: dto.endDate,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
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
    isOpenForSubmission: challenge.canAcceptSubmissions(),
  };
}
