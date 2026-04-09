import { Effect } from "effect";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { Challenge } from "@mirai-app/domain";
import {
  UseCaseNotFoundError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";

/**
 * Input for GetChallenge use case
 */
export interface GetChallengeInput {
  challengeId: string;
}

/**
 * Output DTO for GetChallenge use case
 */
export interface GetChallengeOutput {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  basePoints: number;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  isActive: boolean;
  isOpenForSubmission: boolean;
  requiresLocation: boolean;
  requiresQRCode: boolean;
  hasVotingPhase: boolean;
}

/**
 * GetChallenge Use Case
 *
 * Retrieves a challenge by ID.
 * Returns error if challenge not found.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new GetChallengeUseCase(challengeRepository);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("getChallengeUseCase");
 * ```
 */
export class GetChallengeUseCase {
  constructor(private challengeRepository: ChallengeRepository) {}

  execute(
    input: GetChallengeInput,
  ): Effect.Effect<GetChallengeOutput, UseCaseError> {
    const challengeRepository = this.challengeRepository;
    const toOutput = this.toOutput.bind(this);

    return Effect.gen(function* () {
      const challenge = yield* Effect.tryPromise({
        try: () => challengeRepository.findById(input.challengeId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "GetChallenge.findById",
            message: "Failed to load challenge",
            cause,
          }),
      });

      if (!challenge) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Challenge",
            message: "Challenge not found",
          }),
        );
      }

      return toOutput(challenge);
    });
  }

  private toOutput(challenge: Challenge): GetChallengeOutput {
    return {
      id: challenge.id,
      tripId: challenge.tripId,
      name: challenge.name,
      description: challenge.description,
      image: challenge.image,
      submissionType: challenge.submissionType,
      scoringCategory: challenge.scoringCategory,
      isRecurring: challenge.isRecurring,
      basePoints: challenge.basePoints,
      status: challenge.status,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      targetLatitude: challenge.targetLatitude,
      targetLongitude: challenge.targetLongitude,
      expectedValue: challenge.expectedValue,
      autoApprove: challenge.autoApprove,
      createdAt: challenge.createdAt,
      isActive: challenge.isActive(),
      isOpenForSubmission: challenge.isOpenForSubmission(),
      requiresLocation: challenge.requiresLocation(),
      requiresQRCode: challenge.requiresQRCode(),
      hasVotingPhase: challenge.hasVotingPhase(),
    };
  }
}
