import type { Result, RewardId } from "@repo/domain";
import { ok, err, RewardPurchase, CoinAmount } from "@repo/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";

/**
 * Input for PurchaseReward use case
 */
export interface PurchaseRewardInput {
  rewardId: RewardId;
  quantity: number;
  userId: string;
}

/**
 * Output DTO for PurchaseReward use case
 */
export interface PurchaseRewardOutput {
  purchaseId: string;
  rewardId: string;
  groupId: string;
  quantity: number;
  totalCost: number;
  status: string;
  purchasedAt: Date;
  remainingGroupCoins: number;
  remainingRewardQuantity: number;
}

/**
 * PurchaseReward Use Case
 *
 * Handles the purchase of a reward by a group.
 * Validates:
 * - User is a group leader for the trip
 * - Reward exists and is not hidden
 * - Sufficient quantity available
 * - Group has sufficient coins (calculated dynamically)
 * - Trip has not ended
 *
 * Side effects:
 * - Decrements reward quantity
 * - Deducts coins from group
 * - Creates purchase record
 * - Creates coin transaction record
 */
export class PurchaseRewardUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private pointsCalculator: TripPointsCalculator,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(
    input: PurchaseRewardInput,
  ): Promise<Result<PurchaseRewardOutput, string>> {
    // Find the reward
    const reward = await this.rewardRepository.findById(input.rewardId);
    if (!reward) {
      return err("Reward not found");
    }

    // Check if trip has ended
    const hasEnded = await this.accessChecker.hasTripEnded(reward.tripId);
    if (hasEnded) {
      return err("Cannot purchase rewards for ended trips");
    }

    // Check if reward is hidden
    if (reward.isHidden) {
      return err("Reward is hidden");
    }

    // Check if sufficient quantity is available
    if (!reward.canPurchaseQuantity(input.quantity)) {
      return err(
        `Not enough rewards available (requested: ${input.quantity}, available: ${reward.availableQuantity})`,
      );
    }

    // Verify user is a group leader for this trip
    const leaderCheck = await this.accessChecker.isGroupLeader(
      input.userId,
      reward.tripId,
    );

    if (!leaderCheck.isLeader || !leaderCheck.groupId) {
      return err("Only group leaders can purchase rewards");
    }

    // Calculate dynamic coin cost
    const totalPoints =
      await this.pointsCalculator.calculateTotalAvailablePoints(reward.tripId);
    const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

    // Check if group has enough coins
    const groupCoins = await this.coinsService.getBalance(leaderCheck.groupId);
    const groupCoinsAmount = CoinAmount.unsafeCreate(groupCoins);

    if (!groupCoinsAmount.isGreaterThanOrEqual(totalCost)) {
      return err(
        `Not enough coins (need: ${totalCost.toNumber()}, have: ${groupCoins})`,
      );
    }

    // Execute the purchase as a transaction
    try {
      // 1. Decrement reward quantity
      const updatedReward = await this.rewardRepository.decrementQuantity(
        input.rewardId,
        input.quantity,
      );

      // 2. Deduct coins from group
      await this.coinsService.deductCoins(
        leaderCheck.groupId,
        totalCost.toNumber(),
        `Claimed ${input.quantity}x ${reward.name}`,
        input.userId,
      );

      // 3. Create purchase record
      const purchaseResult = RewardPurchase.create({
        rewardId: input.rewardId,
        groupId: leaderCheck.groupId,
        quantity: input.quantity,
        totalCost: totalCost.toNumber(),
        purchasedById: input.userId,
        statusUpdatedById: input.userId,
      });

      if (purchaseResult.kind === "err") {
        // This shouldn't happen since we validated everything
        return err(`Failed to create purchase: ${purchaseResult.error}`);
      }

      const savedPurchase = await this.purchaseRepository.create(
        purchaseResult.value,
      );

      // 4. Get remaining group coins
      const remainingCoins = await this.coinsService.getBalance(
        leaderCheck.groupId,
      );

      return ok({
        purchaseId: savedPurchase.id,
        rewardId: reward.id,
        groupId: leaderCheck.groupId,
        quantity: input.quantity,
        totalCost: totalCost.toNumber(),
        status: savedPurchase.status,
        purchasedAt: savedPurchase.purchasedAt,
        remainingGroupCoins: remainingCoins,
        remainingRewardQuantity: updatedReward.availableQuantity,
      });
    } catch (error) {
      return err(
        `Purchase failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
