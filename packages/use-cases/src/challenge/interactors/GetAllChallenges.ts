import { Effect, Data } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { ChallengePortTag } from "../ports/ChallengePort";
import type { ChallengeDTO } from "../dto/ChallengeDTOs";

/**
 * Input for GetAllChallengesUseCase
 */
export interface GetAllChallengesInput {
  includeRecurring?: boolean;
}

/**
 * Get All Challenges Use Case
 *
 * Retrieves all challenges across trips (admin only).
 * Activates visible challenges before returning.
 */
export class GetAllChallengesUseCase {
  execute(
    input: GetAllChallengesInput = {},
  ): Effect.Effect<ChallengeDTO[], ApplicationError, ChallengePortTag> {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      // Activate visible challenges first
      yield* challengePort.activateVisibleChallenges();

      // Get all challenges
      const allChallenges = yield* challengePort.findByTripId("");

      // Filter out recurring if not requested
      const challenges = input.includeRecurring
        ? allChallenges
        : allChallenges.filter((c) => !c.isRecurring);

      // Map to DTOs
      return challenges.map(
        (challenge): ChallengeDTO => ({
          id: challenge.id,
          tripId: challenge.tripId,
          name: challenge.name,
          description: challenge.description,
          image: challenge.image,
          submissionType: challenge.submissionType,
          scoringCategory: challenge.scoringCategory,
          isRecurring: challenge.isRecurring,
          dailyStartTime: challenge.dailyStartTime,
          dailyEndTime: challenge.dailyEndTime,
          basePoints: challenge.basePoints,
          firstPlacePoints: challenge.firstPlacePoints,
          secondPlacePoints: challenge.secondPlacePoints,
          thirdPlacePoints: challenge.thirdPlacePoints,
          status: challenge.status,
          startTime: challenge.startTime,
          endTime: challenge.endTime,
          votingStartTime: challenge.votingStartTime,
          votingEndTime: challenge.votingEndTime,
          targetLatitude: challenge.targetLatitude,
          targetLongitude: challenge.targetLongitude,
          expectedValue: challenge.expectedValue,
          autoApprove: challenge.autoApprove,
          createdAt: challenge.createdAt,
          updatedAt: challenge.updatedAt,
        }),
      );
    });
  }
}
