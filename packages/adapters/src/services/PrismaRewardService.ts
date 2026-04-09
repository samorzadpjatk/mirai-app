import type { PrismaTripAccessChecker } from "./PrismaTripAccessChecker";
import type { PrismaTripPointsCalculator } from "./PrismaTripPointsCalculator";
import type { RewardController } from "../controllers/reward-controller";

/**
 * PrismaRewardService
 *
 * Handles reward operations with additional verification and calculations.
 * Coordinates access checks and points calculations around reward operations.
 */
export class PrismaRewardService {
  constructor(
    private accessChecker: PrismaTripAccessChecker,
    private pointsCalculator: PrismaTripPointsCalculator,
    private controller: RewardController,
  ) {}

  /**
   * Get reward by ID with hidden check and staff verification
   */
  async getByIdWithAccessCheck(input: {
    rewardId: string;
    userId: string;
  }): Promise<
    { success: true; data: unknown } | { success: false; error: string }
  > {
    // Get the reward
    const result = await this.controller.getById({ id: input.rewardId });

    if (!result.success) {
      return result;
    }

    // Check if reward is hidden and verify staff status
    if (result.data.isHidden) {
      const isStaff = await this.accessChecker.isStaff(input.userId);
      if (!isStaff) {
        return {
          success: false,
          error: "Reward not found",
        };
      }
    }

    return result;
  }

  /**
   * Get purchase history with staff verification
   */
  async getPurchaseHistoryWithAccessCheck(input: {
    tripId: string;
    userId: string;
    pagination?: { limit?: number; offset?: number };
  }): Promise<
    { success: true; data: unknown } | { success: false; error: string }
  > {
    // Check if user is staff
    const isStaff = await this.accessChecker.isStaff(input.userId);

    // Delegate to controller
    return this.controller.getPurchaseHistory({
      tripId: input.tripId,
      userId: input.userId,
      isStaff,
      pagination: input.pagination,
    });
  }

  /**
   * Get total available points for a trip
   */
  async getTotalAvailablePoints(input: {
    tripId: string;
  }): Promise<{ totalPoints: number }> {
    const totalPoints =
      await this.pointsCalculator.calculateTotalAvailablePoints(input.tripId);
    return { totalPoints };
  }
}
