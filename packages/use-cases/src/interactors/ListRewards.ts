import { CoinAmount, Reward } from "@mirai-app/domain";
import { Effect } from "effect";
import {
  RewardRepositoryTag,
  TripPointsCalculatorTag,
  type PaginationOptions,
  type PaginatedResult,
} from "../ports/RewardRepository";

/**
 * Input for ListRewards use case
 */
export interface ListRewardsInput {
  tripId: string;
  includeHidden?: boolean;
  groupCoins?: number; // For calculating affordability
  pagination?: PaginationOptions;
}

/**
 * Reward with calculated fields
 */
export interface RewardWithCalculations {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  dynamicCoinCost: number;
  images: string[];
  primaryImage: string | null;
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  isInStock: boolean;
  canBePurchased: boolean;
  purchaseCount: number;
  canAfford?: boolean; // If groupCoins was provided
}

/**
 * Output DTO for ListRewards use case
 */
export interface ListRewardsOutput extends PaginatedResult<RewardWithCalculations> {}

/**
 * Error types for ListRewards use case
 */
export class ListRewardsError extends Error {
  readonly _tag = "ListRewardsError";
  constructor(message: string) {
    super(message);
  }
}

export class RewardRepositoryError extends Error {
  readonly _tag = "RewardRepositoryError";
  constructor(message: string = "Failed to list rewards") {
    super(message);
  }
}

export class TripPointsCalculatorError extends Error {
  readonly _tag = "TripPointsCalculatorError";
  constructor(message: string = "Failed to calculate trip points") {
    super(message);
  }
}

/**
 * ListRewards Use Case
 *
 * Lists all rewards for a trip with calculated dynamic coin costs.
 * Optionally calculates affordability if group coins are provided.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* listRewardsUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(RewardRepositoryTag, repository),
 *   Effect.provideService(TripPointsCalculatorTag, pointsCalculator)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function listRewardsUseCase(
  input: ListRewardsInput,
): Effect.Effect<
  ListRewardsOutput,
  ListRewardsError | RewardRepositoryError | TripPointsCalculatorError,
  RewardRepositoryTag | TripPointsCalculatorTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;
    const pointsCalculator = yield* TripPointsCalculatorTag;

    // Get total available points for dynamic pricing
    const totalPoints = yield* pointsCalculator
      .calculateTotalAvailablePoints(input.tripId)
      .pipe(
        Effect.mapError(
          () =>
            new TripPointsCalculatorError("Failed to calculate trip points"),
        ),
      );

    // Fetch rewards
    const result = input.includeHidden
      ? yield* rewardRepo
          .findByTripId(input.tripId, {
            includeHidden: true,
            ...input.pagination,
          })
          .pipe(
            Effect.mapError(
              () => new RewardRepositoryError("Failed to find rewards"),
            ),
          )
      : yield* rewardRepo
          .findVisibleByTripId(input.tripId, input.pagination)
          .pipe(
            Effect.mapError(
              () => new RewardRepositoryError("Failed to find rewards"),
            ),
          );

    // Calculate affordability if group coins provided
    const groupCoins =
      input.groupCoins !== undefined
        ? CoinAmount.unsafeCreate(input.groupCoins)
        : null;

    // Map to output with calculations
    const items = yield* Effect.all(
      result.items.map((reward) =>
        Effect.gen(function* () {
          const dynamicCost = reward.calculateDynamicCoinCost(totalPoints);

          // Calculate affordability if group coins provided
          const canAfford =
            groupCoins !== null
              ? yield* reward
                  .canAfford(groupCoins, 1, totalPoints)
                  .pipe(
                    Effect.mapError(
                      () =>
                        new ListRewardsError(
                          "Failed to calculate affordability",
                        ),
                    ),
                  )
              : undefined;

          return {
            id: reward.id,
            name: reward.name,
            description: reward.description,
            availableQuantity: reward.availableQuantity,
            coinCostPercentage: reward.coinCostPercentage.toNumber(),
            dynamicCoinCost: dynamicCost.toNumber(),
            images: reward.images,
            primaryImage: reward.getPrimaryImage(),
            isHidden: reward.isHidden,
            tripId: reward.tripId,
            createdById: reward.createdById,
            createdAt: reward.createdAt,
            updatedAt: reward.updatedAt,
            isInStock: reward.isInStock(),
            canBePurchased: reward.canBePurchased(),
            purchaseCount: result.total,
            canAfford,
          };
        }),
      ),
      { concurrency: "unbounded" },
    );

    return {
      items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  });
}
