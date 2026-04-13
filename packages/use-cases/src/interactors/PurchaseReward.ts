import { RewardPurchase, CoinAmount } from "@mirai-app/domain";
import {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  TripPointsCalculatorTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
  type PaginationOptions,
  type PaginatedResult,
} from "../ports/RewardRepository";
import { Effect } from "effect";
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
export class RewardNotFoundError extends Error {
  readonly _tag = "RewardNotFoundError";
  constructor() {
    super("Reward not found");
  }
}

export class TripEndedError extends Error {
  readonly _tag = "TripEndedError";
  constructor() {
    super("Cannot purchase rewards for ended trips");
  }
}

export class RewardHiddenError extends Error {
  readonly _tag = "RewardHiddenError";
  constructor() {
    super("Reward is hidden");
  }
}

export class InsufficientQuantityError extends Error {
  readonly _tag = "InsufficientQuantityError";
  constructor(requested: number, available: number) {
    super(
      `Not enough rewards available (requested: ${requested}, available: ${available})`,
    );
  }
}

export class NotGroupLeaderError extends Error {
  readonly _tag = "NotGroupLeaderError";
  constructor() {
    super("Only group leaders can purchase rewards");
  }
}

export class InsufficientCoinsError extends Error {
  readonly _tag = "InsufficientCoinsError";
  constructor(needed: number, have: number) {
    super(`Not enough coins (need: ${needed}, have: ${have})`);
  }
}

export class RewardRepositoryError extends Error {
  readonly _tag = "RewardRepositoryError";
  constructor(message: string = "Failed to load reward") {
    super(message);
  }
}

export class TripAccessCheckerError extends Error {
  readonly _tag = "TripAccessCheckerError";
  constructor(message: string) {
    super(message);
  }
}

export class TripPointsCalculatorError extends Error {
  readonly _tag = "TripPointsCalculatorError";
  constructor(message: string = "Failed to calculate points") {
    super(message);
  }
}

export class GroupCoinsServiceError extends Error {
  readonly _tag = "GroupCoinsServiceError";
  constructor(message: string) {
    super(message);
  }
}

export class PurchaseCreationError extends Error {
  readonly _tag = "PurchaseCreationError";
  constructor(message: string) {
    super(`Failed to create purchase: ${message}`);
  }
}

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
 *   Effect.provideService(RewardRepositoryTag, rewardRepo),
 *   Effect.provideService(RewardPurchaseRepositoryTag, purchaseRepo),
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
  | RewardRepositoryTag
  | RewardPurchaseRepositoryTag
  | TripPointsCalculatorTag
  | GroupCoinsServiceTag
  | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;
    const purchaseRepo = yield* RewardPurchaseRepositoryTag;
    const pointsCalculator = yield* TripPointsCalculatorTag;
    const coinsService = yield* GroupCoinsServiceTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Find the reward
    const reward = yield* rewardRepo.findById(input.rewardId).pipe(
      Effect.mapError(() => new RewardRepositoryError("Failed to load reward")),
      Effect.flatMap((r) =>
        r === null ? Effect.fail(new RewardNotFoundError()) : Effect.succeed(r),
      ),
    );

    // Check if trip has ended
    const hasEnded = yield* accessChecker
      .hasTripEnded(reward.tripId)
      .pipe(
        Effect.mapError(
          () => new TripAccessCheckerError("Failed to check trip status"),
        ),
      );

    if (hasEnded) {
      return yield* Effect.fail(new TripEndedError());
    }

    // Check if reward is hidden
    if (reward.isHidden) {
      return yield* Effect.fail(new RewardHiddenError());
    }

    // Check if sufficient quantity is available
    if (!reward.canPurchaseQuantity(input.quantity)) {
      return yield* Effect.fail(
        new InsufficientQuantityError(input.quantity, reward.availableQuantity),
      );
    }

    // Verify user is a group leader for this trip
    const leaderCheck = yield* accessChecker
      .isGroupLeader(input.userId, reward.tripId)
      .pipe(
        Effect.mapError(
          () => new TripAccessCheckerError("Failed to check leader status"),
        ),
      );

    if (!leaderCheck.isLeader || !leaderCheck.groupId) {
      return yield* Effect.fail(new NotGroupLeaderError());
    }

    // Calculate dynamic coin cost
    const totalPoints = yield* pointsCalculator
      .calculateTotalAvailablePoints(reward.tripId)
      .pipe(
        Effect.mapError(
          () => new TripPointsCalculatorError("Failed to calculate points"),
        ),
      );

    // Calculate total cost (returns Effect)
    const totalCost = yield* reward
      .calculateTotalCost(input.quantity, totalPoints)
      .pipe(
        Effect.mapError(
          () => new RewardRepositoryError("Failed to calculate total cost"),
        ),
      );

    // Check if group has enough coins
    const groupCoins = yield* coinsService
      .getBalance(leaderCheck.groupId)
      .pipe(
        Effect.mapError(
          () => new GroupCoinsServiceError("Failed to get group coins"),
        ),
      );

    const groupCoinsAmount = CoinAmount.unsafeCreate(groupCoins);

    if (!groupCoinsAmount.isGreaterThanOrEqual(totalCost)) {
      return yield* Effect.fail(
        new InsufficientCoinsError(totalCost.toNumber(), groupCoins),
      );
    }

    // Execute the purchase steps

    // 1. Decrement reward quantity
    const updatedReward = yield* rewardRepo
      .decrementQuantity(input.rewardId, input.quantity)
      .pipe(
        Effect.mapError(
          () =>
            new RewardRepositoryError("Failed to decrement reward quantity"),
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
          () => new GroupCoinsServiceError("Failed to deduct coins"),
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
          new PurchaseCreationError(error.message),
      ),
    );

    const savedPurchase = yield* purchaseRepo
      .create(purchase)
      .pipe(
        Effect.mapError(
          () => new RewardRepositoryError("Failed to save purchase"),
        ),
      );

    // 4. Get remaining group coins
    const remainingCoins = yield* coinsService
      .getBalance(leaderCheck.groupId)
      .pipe(
        Effect.mapError(
          () => new GroupCoinsServiceError("Failed to get remaining balance"),
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
