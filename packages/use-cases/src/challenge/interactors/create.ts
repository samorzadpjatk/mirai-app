import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
  ValidationError,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeGatewayTag } from "../ports/gateway";

/**
 * Input for CreateChallenge use case
 */
export interface CreateChallengeInput {
  tripId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  submissionType: SubmissionType;
  scoringCategory: ScoringCategory;
  isRecurring?: boolean;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  basePoints?: number;
  firstPlacePoints?: number | null;
  secondPlacePoints?: number | null;
  thirdPlacePoints?: number | null;
  status?: ChallengeStatus;
  startTime?: Date | null;
  endTime?: Date | null;
  targetLatitude?: number | null;
  targetLongitude?: number | null;
  expectedValue?: string | null;
  autoApprove?: boolean;
}

/**
 * Output DTO for CreateChallenge use case
 */
export interface CreateChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  submissionType: string;
  scoringCategory: string;
  status: string;
  basePoints: number;
  createdAt: Date;
}

/**
 * Error types for CreateChallenge use case
 */
export class ChallengeCreationError extends Data.TaggedError(
  "ChallengeCreationError",
)<{ message: string }> {}

export class ChallengeRepositoryError extends Data.TaggedError(
  "ChallengeRepositoryError",
)<{ message: string }> {}

/**
 * CreateChallenge Use Case
 *
 * Creates a new challenge.
 * Returns error if validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createChallengeUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createChallengeUseCase(
  input: CreateChallengeInput,
): Effect.Effect<
  CreateChallengeOutput,
  ChallengeCreationError | ChallengeRepositoryError,
  ChallengeGatewayTag
> {
  return Effect.gen(function* () {
    const challengeRepo = yield* ChallengeGatewayTag;

    // Create domain entity using Effect-based static create method
    const challenge = yield* Challenge.create({
      tripId: input.tripId,
      name: input.name,
      description: input.description ?? null,
      image: input.image ?? null,
      submissionType: input.submissionType,
      scoringCategory: input.scoringCategory,
      isRecurring: input.isRecurring ?? false,
      dailyStartTime: input.dailyStartTime ?? null,
      dailyEndTime: input.dailyEndTime ?? null,
      basePoints: input.basePoints ?? 0,
      firstPlacePoints: input.firstPlacePoints ?? null,
      secondPlacePoints: input.secondPlacePoints ?? null,
      thirdPlacePoints: input.thirdPlacePoints ?? null,
      status: input.status ?? ChallengeStatus.HIDDEN,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      targetLatitude: input.targetLatitude ?? null,
      targetLongitude: input.targetLongitude ?? null,
      expectedValue: input.expectedValue ?? null,
      autoApprove: input.autoApprove ?? false,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeCreationError({ message: validationError.message }),
      ),
    );

    // Save to repository
    const saved = yield* challengeRepo.create(challenge).pipe(
      Effect.mapError(
        () =>
          new ChallengeRepositoryError({
            message: "Failed to create challenge",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(challenge: Challenge): CreateChallengeOutput {
  return {
    id: challenge.id,
    tripId: challenge.tripId,
    name: challenge.name,
    description: challenge.description,
    submissionType: challenge.submissionType,
    scoringCategory: challenge.scoringCategory,
    status: challenge.status,
    basePoints: challenge.basePoints,
    createdAt: challenge.createdAt,
  };
}
