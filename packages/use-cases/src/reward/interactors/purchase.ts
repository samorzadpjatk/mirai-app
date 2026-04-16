import {
  Reward,
  RewardPurchase,
  CoinAmount,
  ValidationError,
} from "@mirai-app/domain";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
  TripPointsCalculatorTag,
} from "../ports/gateway";
import {
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../../trip/ports/gateway";
import { Effect, Data } from "effect";
import type { RewardId } from "@mirai-app/domain";
import type { RewardDTO, RewardPurchaseDTO } from "../dto";

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
    const rewardDTO = yield* rewardRepo.findById(input.rewardId).pipe(
      Effect.mapError(
        () => new RewardRepositoryError({ message: "Failed to load reward" }),
      ),
      Effect.flatMap((r) =>
        r === null ? Effect.fail(new RewardNotFoundError()) : Effect.succeed(r),
      ),
    );

    // Convert DTO to domain entity
    const reward = yield* dtoToReward(rewardDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new RewardRepositoryError({
            message: `Invalid reward data: ${validationError.message}`,
          }),
      ),
    );

    // Check if trip has ended
    const hasEnded = yield* accessChecker.hasTripEnded(reward.tripId).pipe(
      Effect.mapError(
        () =>
          new TripAccessCheckerError({
            message: "Failed to check trip status",
          }),
      ),
    );

    if (hasEnded) {
      return yield* Effect.fail(new TripEndedError());
    }

    // Check if reward is hidden
    if (reward.isHiddenReward()) {
      return yield* Effect.fail(new RewardHiddenError());
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
      return yield* Effect.fail(new NotGroupLeaderError());
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

    // Calculate total cost (domain method returns number, not Effect)
    const totalCost = reward.calculateTotalCost(input.quantity);

    // Check if group has enough coins
    const groupCoins = yield* coinsService.getBalance(leaderCheck.groupId).pipe(
      Effect.mapError(
        () =>
          new GroupCoinsServiceError({
            message: "Failed to get group coins",
          }),
      ),
    );

    if (!reward.canAfford(groupCoins)) {
      return yield* Effect.fail(
        new InsufficientCoinsError({
          needed: totalCost,
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
        totalCost,
        `Claimed ${input.quantity}x ${reward.name}`,
        input.userId,
      )
      .pipe(
        Effect.mapError(
          () =>
            new GroupCoinsServiceError({ message: "Failed to deduct coins" }),
        ),
      );

    // 3. Create purchase record (domain entity)
    const purchaseResult = RewardPurchase.create({
      rewardId: input.rewardId,
      groupId: leaderCheck.groupId,
      quantity: input.quantity,
      totalCost: totalCost,
      purchasedById: input.userId,
      statusUpdatedById: input.userId,
    });

    const purchase = yield* purchaseResult.pipe(
      Effect.mapError(
        (error: { message: string }) =>
          new PurchaseCreationError({ message: error.message }),
      ),
    );

    // Convert domain entity to DTO for gateway
    const purchaseDTO: RewardPurchaseDTO = {
      id: purchase.id,
      rewardId: purchase.rewardId,
      groupId: purchase.groupId,
      userId: purchase.purchasedById,
      pointsSpent: purchase.totalCost,
      totalCost: purchase.totalCost,
      status: purchase.status,
      quantity: purchase.quantity,
      collectionMethod: null,
      collectedAt: null,
      collectedById: null,
      notes: null,
      purchasedAt: purchase.purchasedAt,
      updatedAt: purchase.statusUpdatedAt,
      statusUpdatedAt: purchase.statusUpdatedAt,
      statusUpdatedById: purchase.statusUpdatedById,
    };

    const savedPurchaseDTO = yield* purchaseRepo
      .create(purchaseDTO)
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
      purchaseId: savedPurchaseDTO.id,
      rewardId: reward.id,
      groupId: leaderCheck.groupId,
      quantity: input.quantity,
      totalCost: totalCost,
      status: savedPurchaseDTO.status,
      purchasedAt: savedPurchaseDTO.purchasedAt,
      remainingGroupCoins: remainingCoins,
      remainingRewardQuantity: updatedReward.availableQuantity,
    };
  });
}

/**
 * Convert RewardDTO to domain Reward entity
 */
function dtoToReward(
  dto: RewardDTO,
): Effect.Effect<Reward, ValidationError, never> {
  return Reward.create({
    id: dto.id,
    name: dto.title,
    description: dto.description ?? "",
    availableQuantity: dto.availableQuantity,
    coinCost: dto.pointsCost,
    image: dto.imageUrl,
    isHidden: dto.isHidden,
    tripId: dto.tripId,
    createdById: dto.createdById,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  });
}
