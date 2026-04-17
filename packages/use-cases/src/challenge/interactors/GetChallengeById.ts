import { Effect, Data } from "effect";
import { ChallengePortTag } from "../ports/ChallengePort";
import { ChallengeNotFoundError } from "../errors/ChallengeErrors";
import type { ChallengeDTO } from "../dto/ChallengeDTOs";

/**
 * Input for GetChallengeByIdUseCase
 */
export interface GetChallengeByIdInput {
  challengeId: string;
  tripId: string;
  isAdmin?: boolean;
}

/**
 * Get Challenge By ID Use Case
 *
 * Retrieves a challenge by ID with optional admin privileges.
 * Resolves recurring challenge IDs for non-admin users.
 */
export class GetChallengeByIdUseCase {
  execute(input: GetChallengeByIdInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      // Activate visible challenges for this trip
      yield* challengePort.activateVisibleChallenges(input.tripId);

      // Find challenge
      const challenge = yield* challengePort.findById(input.challengeId);

      if (!challenge) {
        return yield* Effect.fail(
          new ChallengeNotFoundError({ challengeId: input.challengeId }),
        );
      }

      // Map to DTO
      return {
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
      };
    });
  }
}
