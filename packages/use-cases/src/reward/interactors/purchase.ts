import { RewardPurchase, CoinAmount } from "@mirai-app/domain";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
  type PaginationOptions,
  type PaginatedResult,
} from "../ports/gateway";
import { Effect, Data } from "effect";
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
 * Error types for PurchaseReward use case
 */
export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{}> {}

export class TripEndedError extends Data.TaggedError("TripEndedError")<{}> {}

export class RewardHiddenError extends Data.TaggedError(
  "RewardHiddenError",
)<{}> {}

export class InsufficientQuantityError extends Data.TaggedError(
  "InsufficientQuantityError",
)<{
  requested: number;
  available: number;
}> {}

export class NotGroupLeaderError extends Data.TaggedError(
  "NotGroupLeaderError",
)<{}> {}

export class InsufficientCoinsError extends Data.TaggedError(
  "InsufficientCoinsError",
)<{
  needed: number;
  have: number;
}> {}

export class RewardRepositoryError extends Data.TaggedError(
  "RewardRepositoryError",
)<{
  message: string;
}> {}

export class TripAccessCheckerError extends Data.TaggedError(
  "TripAccessCheckerError",
)<{
  message: string;
}> {}

export class TripPointsCalculatorError extends Data.TaggedError(
  "TripPointsCalculatorError",
)<{
  message: string;
}> {}

export class GroupCoinsServiceError extends Data.TaggedError(
  "GroupCoinsServiceError",
)<{
  message: string;
}> {}

export class PurchaseCreationError extends Data.TaggedError(
  "PurchaseCreationError",
)<{
  message: string;
}> {}

export type PurchaseRewardError =
  | RewardNotFoundError
  | TripEndedError
  | RewardHiddenError
  | InsufficientQuantityError
  | NotGroupLeaderError
  | InsufficientCoinsError
  | RewardRepositoryError
  | TripAccessCheckerError
  | TripPointsCalculatorError
  | GroupCoinsServiceError
  | PurchaseCreationError;

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
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* purchaseRewardUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(RewardGatewayTag, rewardRepo),
 *   Effect.provideService(RewardPurchaseGatewayTag, purchaseRepo),
 *   Effect.provideService(TripPointsCalculatorTag, pointsCalc),
 *   Effect.provideService(GroupCoinsServiceTag, coinsService),
 *   Effect.provideService(TripAccessCheckerTag, accessChecker)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function purchaseRewardUseCase(
  input: PurchaseRewardInput,
): Effect.Effect<
  PurchaseRewardOutput,
  PurchaseRewardError,
  | RewardGatewayTag
  | RewardPurchaseGatewayTag
  | TripPointsCalculatorTag
  | GroupCoinsServiceTag
  | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;
    const purchaseRepo = yield* RewardPurchaseGatewayTag;
    const pointsCalculator = yield* TripPointsCalculatorTag;
    const coinsService = yield* GroupCoinsServiceTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Find the reward
    const reward = yield* rewardRepo.findById(input.rewardId).pipe(
      Effect.mapError(
        () => new RewardRepositoryError({ message: "Failed to load reward" }),
      ),
      Effect.flatMap((r) =>
        r === null
          ? Effect.fail(new RewardNotFoundError({}))
          : Effect.succeed(r),
      ),
    );

    // Check if trip has ended
    const hasEnded = yield* accessChecker
      .hasTripEnded(reward.tripId)
      .pipe(
        Effect.mapError(
          () =>
            new TripAccessCheckerError({
              message: "Failed to check trip status",
            }),
        ),
      );

    if (hasEnded) {
      return yield* Effect.fail(new TripEndedError({}));
    }

    // Check if reward is hidden
    if (reward.isHidden) {
      return yield* Effect.fail(new RewardHiddenError({}));
    }

    // Check if sufficient quantity is available
    if (!reward.canPurchaseQuantity(input.quantity)) {
      return yield* Effect.fail(
        new InsufficientQuantityError({
          requested: input.quantity,
          available: reward.availableQuantity,
        }),
      );
    }

    // Verify user is a group leader for this trip
    const leaderCheck = yield* accessChecker
      .isGroupLeader(input.userId, reward.tripId)
      .pipe(
        Effect.mapError(
          () =>
            new TripAccessCheckerError({
              message: "Failed to check leader status",
            }),
        ),
      );

    if (!leaderCheck.isLeader || !leaderCheck.groupId) {
      return yield* Effect.fail(new NotGroupLeaderError({}));
    }

    // Calculate dynamic coin cost
    const totalPoints = yield* pointsCalculator
      .calculateTotalAvailablePoints(reward.tripId)
      .pipe(
        Effect.mapError(
          () =>
            new TripPointsCalculatorError({
              message: "Failed to calculate points",
            }),
        ),
      );

    // Calculate total cost (returns Effect)
    const totalCost = yield* reward
      .calculateTotalCost(input.quantity, totalPoints)
      .pipe(
        Effect.mapError(
          () =>
            new RewardRepositoryError({
              message: "Failed to calculate total cost",
            }),
        ),
      );

    // Check if group has enough coins
    const groupCoins = yield* coinsService
      .getBalance(leaderCheck.groupId)
      .pipe(
        Effect.mapError(
          () =>
            new GroupCoinsServiceError({
              message: "Failed to get group coins",
            }),
        ),
      );

    const groupCoinsAmount = CoinAmount.unsafeCreate(groupCoins);

    if (!groupCoinsAmount.isGreaterThanOrEqual(totalCost)) {
      return yield* Effect.fail(
        new InsufficientCoinsError({
          needed: totalCost.toNumber(),
          have: groupCoins,
        }),
      );
    }

    // Execute the purchase steps

    // 1. Decrement reward quantity
    const updatedReward = yield* rewardRepo
      .decrementQuantity(input.rewardId, input.quantity)
      .pipe(
        Effect.mapError(
          () =>
            new RewardRepositoryError({
              message: "Failed to decrement reward quantity",
            }),
        ),
      );

    // 2. Deduct coins from group
    yield* coinsService
      .deductCoins(
        leaderCheck.groupId,
        totalCost.toNumber(),
        `Claimed ${input.quantity}x ${reward.name}`,
        input.userId,
      )
      .pipe(
        Effect.mapError(
          () =>
            new GroupCoinsServiceError({ message: "Failed to deduct coins" }),
        ),
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

    const purchase = yield* purchaseResult.pipe(
      Effect.mapError(
        (error: { message: string }) =>
          new PurchaseCreationError({ message: error.message }),
      ),
    );

    const savedPurchase = yield* purchaseRepo
      .create(purchase)
      .pipe(
        Effect.mapError(
          () =>
            new RewardRepositoryError({ message: "Failed to save purchase" }),
        ),
      );

    // 4. Get remaining group coins
    const remainingCoins = yield* coinsService
      .getBalance(leaderCheck.groupId)
      .pipe(
        Effect.mapError(
          () =>
            new GroupCoinsServiceError({
              message: "Failed to get remaining balance",
            }),
        ),
      );

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
  });
}
