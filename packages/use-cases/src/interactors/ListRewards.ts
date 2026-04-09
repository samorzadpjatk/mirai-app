import type { Result } from "@mirai-app/domain";
import { ok, CoinAmount } from "@mirai-app/domain";
import type {
  RewardRepository,
  TripPointsCalculator,
  PaginationOptions,
  PaginatedResult,
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
 * ListRewards Use Case
 *
 * Lists all rewards for a trip with calculated dynamic coin costs.
 * Optionally calculates affordability if group coins are provided.
 */
export class ListRewardsUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private pointsCalculator: TripPointsCalculator,
  ) {}

  async execute(
    input: ListRewardsInput,
  ): Promise<Result<ListRewardsOutput, string>> {
    // Get total available points for dynamic pricing
    const totalPoints =
      await this.pointsCalculator.calculateTotalAvailablePoints(input.tripId);

    // Fetch rewards
    const result = input.includeHidden
      ? await this.rewardRepository.findByTripId(input.tripId, {
          includeHidden: true,
          ...input.pagination,
        })
      : await this.rewardRepository.findVisibleByTripId(
          input.tripId,
          input.pagination,
        );

    // Calculate affordability if group coins provided
    const groupCoins =
      input.groupCoins !== undefined
        ? CoinAmount.unsafeCreate(input.groupCoins)
        : null;

    // Map to output with calculations
    const items = result.items.map((reward) => {
      const dynamicCost = reward.calculateDynamicCoinCost(totalPoints);
      const totalCost =
        groupCoins !== null
          ? reward.canAfford(groupCoins, 1, totalPoints)
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
        purchaseCount: result.total, // Note: per-item count needs adjustment in real implementation
        canAfford: totalCost,
      };
    });

    return ok({
      items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  }
}
