import { Effect } from "effect";
import type { DrizzleTripAccessChecker } from "./trip-access";
import type { DrizzleTripPointsCalculator } from "./trip-points";
import type { RewardController } from "../controllers/reward";
import { ServiceError } from "@mirai-app/adapters/errors";

/**
 * DrizzleRewardService
 *
 * Handles reward operations with additional verification and calculations.
 * Coordinates access checks and points calculations around reward operations.
 */
export class DrizzleRewardService {
  constructor(
    private accessChecker: DrizzleTripAccessChecker,
    private pointsCalculator: DrizzleTripPointsCalculator,
    private controller: RewardController,
  ) {}

  /**
   * Get reward by ID with hidden check and staff verification
   */
  getByIdWithAccessCheck(input: {
    rewardId: string;
    userId: string;
  }): Effect.Effect<
    { success: true; data: unknown } | { success: false; error: string },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Get the reward
        const result = await this.controller.getById({ id: input.rewardId });

        if (!result.success) {
          return result;
        }

        // Check if reward is hidden and verify staff status
        if (result.data.isHidden) {
          const isStaffEffect = this.accessChecker.isStaff(input.userId);
          const isStaff = await Effect.runPromise(isStaffEffect);
          if (!isStaff) {
            return {
              success: false,
              error: "Reward not found",
            };
          }
        }

        return result;
      },
      catch: (error) =>
        new ServiceError({
          operation: "getByIdWithAccessCheck",
          message: `Failed to get reward ${input.rewardId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  /**
   * Get purchase history with staff verification
   */
  getPurchaseHistoryWithAccessCheck(input: {
    tripId: string;
    userId: string;
    pagination?: { limit?: number; offset?: number };
  }): Effect.Effect<
    { success: true; data: unknown } | { success: false; error: string },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Check if user is staff
        const isStaffEffect = this.accessChecker.isStaff(input.userId);
        const isStaff = await Effect.runPromise(isStaffEffect);

        // Delegate to controller
        return this.controller.getPurchaseHistory({
          tripId: input.tripId,
          userId: input.userId,
          isStaff,
          pagination: input.pagination,
        });
      },
      catch: (error) =>
        new ServiceError({
          operation: "getPurchaseHistoryWithAccessCheck",
          message: `Failed to get purchase history for trip ${input.tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  /**
   * Get total available points for a trip
   */
  getTotalAvailablePoints(input: {
    tripId: string;
  }): Effect.Effect<{ totalPoints: number }, ServiceError, never> {
    return Effect.tryPromise({
      try: async () => {
        const totalPointsEffect =
          this.pointsCalculator.calculateTotalAvailablePoints(input.tripId);
        const totalPoints = await Effect.runPromise(totalPointsEffect);
        return { totalPoints };
      },
      catch: (error) =>
        new ServiceError({
          operation: "getTotalAvailablePoints",
          message: `Failed to get total available points for trip ${input.tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
