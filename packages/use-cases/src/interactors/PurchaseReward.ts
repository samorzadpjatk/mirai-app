import { RewardPurchase, CoinAmount } from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";
import { AppError } from "../errors";
import type { RewardId } from "@mirai-app/domain";

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
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new PurchaseRewardUseCase(
 *   rewardRepo,
 *   purchaseRepo,
 *   pointsCalc,
 *   coinsService,
 *   accessChecker
 * );
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("purchaseRewardUseCase");
 * ```
 */
export class PurchaseRewardUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private pointsCalculator: TripPointsCalculator,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(input: PurchaseRewardInput): Promise<PurchaseRewardOutput> {
    // Find the reward
    let reward: import("@mirai-app/domain").Reward | null;
    try {
      reward = await this.rewardRepository.findById(input.rewardId);
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.findById",
        message: "Failed to load reward",
        cause,
      });
    }

    if (!reward) {
      throw AppError.notFound({
        entity: "Reward",
        message: "Reward not found",
      });
    }

    // Check if trip has ended
    let hasEnded: boolean;
    try {
      hasEnded = await this.accessChecker.hasTripEnded(reward.tripId);
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.hasTripEnded",
        message: "Failed to check trip status",
        cause,
      });
    }

    if (hasEnded) {
      throw AppError.conflict({
        entity: "Trip",
        message: "Cannot purchase rewards for ended trips",
      });
    }

    // Check if reward is hidden
    if (reward.isHidden) {
      throw AppError.conflict({
        entity: "Reward",
        message: "Reward is hidden",
      });
    }

    // Check if sufficient quantity is available
    if (!reward.canPurchaseQuantity(input.quantity)) {
      throw AppError.conflict({
        entity: "Reward",
        message: `Not enough rewards available (requested: ${input.quantity}, available: ${reward.availableQuantity})`,
      });
    }

    // Verify user is a group leader for this trip
    let leaderCheck: { isLeader: boolean; groupId: string | null };
    try {
      leaderCheck = await this.accessChecker.isGroupLeader(
        input.userId,
        reward.tripId,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.isGroupLeader",
        message: "Failed to check leader status",
        cause,
      });
    }

    if (!leaderCheck.isLeader || !leaderCheck.groupId) {
      throw AppError.conflict({
        entity: "User",
        message: "Only group leaders can purchase rewards",
      });
    }

    // Calculate dynamic coin cost
    let totalPoints: number;
    try {
      totalPoints = await this.pointsCalculator.calculateTotalAvailablePoints(
        reward.tripId,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.calculateTotalAvailablePoints",
        message: "Failed to calculate points",
        cause,
      });
    }

    const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

    // Check if group has enough coins
    let groupCoins: number;
    try {
      groupCoins = await this.coinsService.getBalance(leaderCheck.groupId);
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.getBalance",
        message: "Failed to get group coins",
        cause,
      });
    }

    const groupCoinsAmount = CoinAmount.unsafeCreate(groupCoins);

    if (!groupCoinsAmount.isGreaterThanOrEqual(totalCost)) {
      throw AppError.conflict({
        entity: "Coins",
        message: `Not enough coins (need: ${totalCost.toNumber()}, have: ${groupCoins})`,
      });
    }

    // Execute the purchase steps

    // 1. Decrement reward quantity
    let updatedReward: import("@mirai-app/domain").Reward;
    try {
      updatedReward = await this.rewardRepository.decrementQuantity(
        input.rewardId,
        input.quantity,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.decrementQuantity",
        message: "Failed to decrement reward quantity",
        cause,
      });
    }

    // 2. Deduct coins from group
    try {
      await this.coinsService.deductCoins(
        leaderCheck.groupId,
        totalCost.toNumber(),
        `Claimed ${input.quantity}x ${reward.name}`,
        input.userId,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.deductCoins",
        message: "Failed to deduct coins",
        cause,
      });
    }

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
      throw AppError.repository({
        operation: "PurchaseReward.createPurchase",
        message: `Failed to create purchase: ${purchaseResult.error}`,
        cause: purchaseResult.error,
      });
    }

    let savedPurchase: import("@mirai-app/domain").RewardPurchase;
    try {
      savedPurchase = await this.purchaseRepository.create(
        purchaseResult.value,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.savePurchase",
        message: "Failed to save purchase",
        cause,
      });
    }

    // 4. Get remaining group coins
    let remainingCoins: number;
    try {
      remainingCoins = await this.coinsService.getBalance(leaderCheck.groupId);
    } catch (cause) {
      throw AppError.repository({
        operation: "PurchaseReward.getRemainingBalance",
        message: "Failed to get remaining balance",
        cause,
      });
    }

    return {
      purchaseId: savedPurchase.id,
      rewardId: reward.id,
      groupId: leaderCheck.groupId,
      quantity: input.quantity,
      totalCost: totalCost.toNumber(),
      status: savedPurchase.status,
      purchasedAt: savedPurchase.purchasedAt,
      remainingGroupCoins: remainingCoins,
      remainingRewardQuantity: updatedReward.availableQuantity,
    };
  }
}
