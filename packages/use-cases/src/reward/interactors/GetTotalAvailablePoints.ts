import { Effect } from "effect";
import type { TripId } from "@mirai-app/domain";
import { TripId as TripIdFactory } from "@mirai-app/domain";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import { TripNotFoundError } from "../errors/RewardErrors";

/**
 * Input for GetTotalAvailablePointsUseCase
 */
export interface GetTotalAvailablePointsInput {
  tripId: string;
}

/**
 * Result for GetTotalAvailablePointsUseCase
 */
export interface GetTotalAvailablePointsResult {
  totalPoints: number;
}

/**
 * Get Total Available Points Use Case
 *
 * Calculates the total available points for a trip based on all challenges.
 * Used for dynamic reward pricing.
 */
export class GetTotalAvailablePointsUseCase {
  execute(input: GetTotalAvailablePointsInput) {
    return Effect.gen(function* () {
      const challengePort = yield* ChallengePortTag;

      const tripId = TripIdFactory.unsafeCreate(input.tripId);

      // Get all challenges for the trip
      const challenges = yield* challengePort.findByTripId(tripId);

      // Calculate total available points
      let totalPoints = 0;
      for (const challenge of challenges) {
        const basePoints = challenge.basePoints ?? 0;

        if (challenge.scoringCategory === "UNLIMITED") {
          // For unlimited category, only base points are available
          totalPoints += basePoints;
        } else {
          // For other categories, include podium points
          totalPoints += basePoints;
          totalPoints += challenge.firstPlacePoints ?? 0;
          totalPoints += challenge.secondPlacePoints ?? 0;
          totalPoints += challenge.thirdPlacePoints ?? 0;
        }
      }

      return { totalPoints };
    });
  }
}
