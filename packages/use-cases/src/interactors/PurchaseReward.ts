import { Effect } from "effect";
import { RewardPurchase, CoinAmount } from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  TripPointsCalculator,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";
import {
  UseCaseNotFoundError,
  UseCaseConflictError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";
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

  execute(
    input: PurchaseRewardInput,
  ): Effect.Effect<PurchaseRewardOutput, UseCaseError> {
    const rewardRepository = this.rewardRepository;
    const purchaseRepository = this.purchaseRepository;
    const pointsCalculator = this.pointsCalculator;
    const coinsService = this.coinsService;
    const accessChecker = this.accessChecker;

    return Effect.gen(function* () {
      // Find the reward
      const reward = yield* Effect.tryPromise({
        try: () => rewardRepository.findById(input.rewardId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.findById",
            message: "Failed to load reward",
            cause,
          }),
      });

      if (!reward) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Reward",
            message: "Reward not found",
          }),
        );
      }

      // Check if trip has ended
      const hasEnded = yield* Effect.tryPromise({
        try: () => accessChecker.hasTripEnded(reward.tripId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.hasTripEnded",
            message: "Failed to check trip status",
            cause,
          }),
      });

      if (hasEnded) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Trip",
            message: "Cannot purchase rewards for ended trips",
          }),
        );
      }

      // Check if reward is hidden
      if (reward.isHidden) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Reward",
            message: "Reward is hidden",
          }),
        );
      }

      // Check if sufficient quantity is available
      if (!reward.canPurchaseQuantity(input.quantity)) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Reward",
            message: `Not enough rewards available (requested: ${input.quantity}, available: ${reward.availableQuantity})`,
          }),
        );
      }

      // Verify user is a group leader for this trip
      const leaderCheck = yield* Effect.tryPromise({
        try: () => accessChecker.isGroupLeader(input.userId, reward.tripId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.isGroupLeader",
            message: "Failed to check leader status",
            cause,
          }),
      });

      if (!leaderCheck.isLeader || !leaderCheck.groupId) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "User",
            message: "Only group leaders can purchase rewards",
          }),
        );
      }

      // Calculate dynamic coin cost
      const totalPoints = yield* Effect.tryPromise({
        try: () =>
          pointsCalculator.calculateTotalAvailablePoints(reward.tripId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.calculateTotalAvailablePoints",
            message: "Failed to calculate points",
            cause,
          }),
      });

      const totalCost = reward.calculateTotalCost(input.quantity, totalPoints);

      // Check if group has enough coins
      const groupCoins = yield* Effect.tryPromise({
        try: () => coinsService.getBalance(leaderCheck.groupId!),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.getBalance",
            message: "Failed to get group coins",
            cause,
          }),
      });

      const groupCoinsAmount = CoinAmount.unsafeCreate(groupCoins);

      if (!groupCoinsAmount.isGreaterThanOrEqual(totalCost)) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Coins",
            message: `Not enough coins (need: ${totalCost.toNumber()}, have: ${groupCoins})`,
          }),
        );
      }

      // Execute the purchase steps

      // 1. Decrement reward quantity
      const updatedReward = yield* Effect.tryPromise({
        try: () =>
          rewardRepository.decrementQuantity(input.rewardId, input.quantity),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.decrementQuantity",
            message: "Failed to decrement reward quantity",
            cause,
          }),
      });

      // 2. Deduct coins from group
      yield* Effect.tryPromise({
        try: () =>
          coinsService.deductCoins(
            leaderCheck.groupId!,
            totalCost.toNumber(),
            `Claimed ${input.quantity}x ${reward.name}`,
            input.userId,
          ),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.deductCoins",
            message: "Failed to deduct coins",
            cause,
          }),
      });

      // 3. Create purchase record
      const purchaseResult = RewardPurchase.create({
        rewardId: input.rewardId,
        groupId: leaderCheck.groupId!,
        quantity: input.quantity,
        totalCost: totalCost.toNumber(),
        purchasedById: input.userId,
        statusUpdatedById: input.userId,
      });

      if (purchaseResult.kind === "err") {
        // This shouldn't happen since we validated everything
        return yield* Effect.fail(
          new UseCaseRepositoryError({
            operation: "PurchaseReward.createPurchase",
            message: `Failed to create purchase: ${purchaseResult.error}`,
            cause: purchaseResult.error,
          }),
        );
      }

      const savedPurchase = yield* Effect.tryPromise({
        try: () => purchaseRepository.create(purchaseResult.value),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.savePurchase",
            message: "Failed to save purchase",
            cause,
          }),
      });

      // 4. Get remaining group coins
      const remainingCoins = yield* Effect.tryPromise({
        try: () => coinsService.getBalance(leaderCheck.groupId!),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "PurchaseReward.getRemainingBalance",
            message: "Failed to get remaining balance",
            cause,
          }),
      });

      return {
        purchaseId: savedPurchase.id,
        rewardId: reward.id,
        groupId: leaderCheck.groupId!,
        quantity: input.quantity,
        totalCost: totalCost.toNumber(),
        status: savedPurchase.status,
        purchasedAt: savedPurchase.purchasedAt,
        remainingGroupCoins: remainingCoins,
        remainingRewardQuantity: updatedReward.availableQuantity,
      };
    });
  }
}
