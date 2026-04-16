import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { challenges } from "@mirai-app/frameworks/drizzle/schema";
import { eq } from "drizzle-orm";
import { Effect, Data } from "effect";
import type { TripPointsCalculator as TripPointsCalculatorPort } from "@mirai-app/use-cases";

/**
 * Error for points calculation operations
 */
export class PointsCalculatorError extends Data.TaggedError(
  "PointsCalculatorError",
)<{
  operation: string;
  message: string;
  cause?: unknown;
}>() {}

/**
 * Drizzle implementation of TripPointsCalculator
 *
 * Calculates total available points for a trip based on challenge configurations
 */
export class DrizzleTripPointsCalculator implements TripPointsCalculatorPort {
  constructor(private db: DrizzleDb) {}

  calculateTotalAvailablePoints(
    tripId: string,
  ): Effect.Effect<number, PointsCalculatorError, never> {
    return Effect.tryPromise({
      try: async () => {
        const challengeRows = await this.db
          .select({
            basePoints: challenges.basePoints,
            firstPlacePoints: challenges.firstPlacePoints,
            secondPlacePoints: challenges.secondPlacePoints,
            thirdPlacePoints: challenges.thirdPlacePoints,
            scoringCategory: challenges.scoringCategory,
          })
          .from(challenges)
          .where(eq(challenges.tripId, tripId));

        let totalPoints = 0;

        for (const challenge of challengeRows) {
          const basePoints = challenge.basePoints ?? 0;

          if (challenge.scoringCategory === "UNLIMITED") {
            totalPoints += basePoints;
          } else {
            totalPoints += basePoints;
            totalPoints += challenge.firstPlacePoints ?? 0;
            totalPoints += challenge.secondPlacePoints ?? 0;
            totalPoints += challenge.thirdPlacePoints ?? 0;
          }
        }

        return totalPoints;
      },
      catch: (error) =>
        new PointsCalculatorError({
          operation: "calculateTotalAvailablePoints",
          message: `Failed to calculate total available points for trip ${tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
