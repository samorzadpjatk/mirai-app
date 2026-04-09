import { Effect } from "effect";
import {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import {
  UseCaseRepositoryError,
  UseCaseValidationError,
  type UseCaseError,
} from "../errors";

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
 * CreateChallenge Use Case
 *
 * Creates a new challenge.
 * Returns error if validation fails.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new CreateChallengeUseCase(challengeRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("createChallengeUseCase");
 * ```
 */
export class CreateChallengeUseCase {
  constructor(private challengeRepository: ChallengeRepository) {}

  execute(
    input: CreateChallengeInput,
  ): Effect.Effect<CreateChallengeOutput, UseCaseError> {
    const challengeRepository = this.challengeRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const challengeResult = Challenge.create({
        tripId: input.tripId,
        name: input.name,
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.image !== undefined && { image: input.image }),
        submissionType: input.submissionType,
        scoringCategory: input.scoringCategory,
        ...(input.isRecurring !== undefined && {
          isRecurring: input.isRecurring,
        }),
        ...(input.dailyStartTime !== undefined && {
          dailyStartTime: input.dailyStartTime,
        }),
        ...(input.dailyEndTime !== undefined && {
          dailyEndTime: input.dailyEndTime,
        }),
        ...(input.basePoints !== undefined && { basePoints: input.basePoints }),
        ...(input.firstPlacePoints !== undefined && {
          firstPlacePoints: input.firstPlacePoints,
        }),
        ...(input.secondPlacePoints !== undefined && {
          secondPlacePoints: input.secondPlacePoints,
        }),
        ...(input.thirdPlacePoints !== undefined && {
          thirdPlacePoints: input.thirdPlacePoints,
        }),
        status: input.status ?? ChallengeStatus.HIDDEN,
        ...(input.startTime !== undefined && { startTime: input.startTime }),
        ...(input.endTime !== undefined && { endTime: input.endTime }),
        ...(input.targetLatitude !== undefined && {
          targetLatitude: input.targetLatitude,
        }),
        ...(input.targetLongitude !== undefined && {
          targetLongitude: input.targetLongitude,
        }),
        ...(input.expectedValue !== undefined && {
          expectedValue: input.expectedValue,
        }),
        ...(input.autoApprove !== undefined && {
          autoApprove: input.autoApprove,
        }),
      });

      if (challengeResult.kind === "err") {
        return yield* Effect.fail(
          new UseCaseValidationError({
            field: "challenge",
            message: challengeResult.error,
          }),
        );
      }

      const saved = yield* Effect.tryPromise({
        try: () => challengeRepository.create(challengeResult.value),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "CreateChallenge.create",
            message: "Failed to create challenge",
            cause,
          }),
      });

      return toOutput(saved);
    });
  }

  private toOutput(challenge: Challenge): CreateChallengeOutput {
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
}
