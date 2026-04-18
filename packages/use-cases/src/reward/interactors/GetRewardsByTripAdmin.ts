import { Effect } from "effect";
import type { TripId, UserId, Reward } from "@mirai-app/domain";
import { TripId as TripIdFactory } from "@mirai-app/domain";
import { RewardPortTag } from "../ports/RewardPort";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import type {
  RewardWithAvailabilityDTO,
  PaginatedRewardsDTO,
} from "../dto/RewardDTOs";
import { TripNotFoundError } from "../errors/RewardErrors";

/**
 * Input for GetRewardsByTripAdminUseCase
 */
export interface GetRewardsByTripAdminInput {
  tripId: string;
  limit?: number;
  offset?: number;
}

/**
 * Creator info type
 */
interface CreatorInfo {
  id: UserId;
  firstName: string;
  lastName: string;
}

/**
 * Result reward type with admin fields
 */
interface AdminRewardResult extends RewardWithAvailabilityDTO {
  creator: CreatorInfo | null;
  images: string[];
  signedImageUrls: string[];
  canAfford: boolean;
  isEligibleToBuy: boolean;
  isOutOfStock: boolean;
  purchasedCount: number;
  originalCoinCost: number;
}

/**
 * Get Rewards By Trip Admin Use Case
 *
 * Retrieves all rewards for a trip (including hidden ones) with pagination.
 * For admin/moderator use.
 */
export class GetRewardsByTripAdminUseCase {
  execute(input: GetRewardsByTripAdminInput) {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPortTag;
      const challengePort = yield* ChallengePortTag;

      const isAllTrips = input.tripId === "all";
      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      const tripId = isAllTrips
        ? null
        : TripIdFactory.unsafeCreate(input.tripId);

      // Get paginated rewards (all, including hidden)
      const paginatedResult = isAllTrips
        ? yield* rewardPort.findAllPaginated({ limit, offset })
        : tripId
          ? yield* rewardPort.findPaginatedByTripId(tripId, { limit, offset })
          : { rewards: [] as Reward[], total: 0, hasMore: false };

      const { rewards, total, hasMore } = paginatedResult;

      // Calculate total available points for dynamic pricing
      let totalAvailablePoints = 0;
      if (!isAllTrips && tripId) {
        const challenges = yield* challengePort.findByTripId(tripId);
        for (const challenge of challenges) {
          totalAvailablePoints += challenge.basePoints;
          if (challenge.scoringCategory !== "UNLIMITED") {
            totalAvailablePoints += challenge.firstPlacePoints ?? 0;
            totalAvailablePoints += challenge.secondPlacePoints ?? 0;
            totalAvailablePoints += challenge.thirdPlacePoints ?? 0;
          }
        }
      }

      // Build result with dynamic pricing
      const rewardsWithDetails: AdminRewardResult[] = yield* Effect.all(
        rewards.map((reward: Reward) =>
          Effect.gen(function* () {
            // Calculate dynamic coin cost
            let dynamicCoinCost = reward.coinCost;
            if (!isAllTrips && totalAvailablePoints > 0) {
              const percentageOfTotal = reward.coinCost / 100;
              dynamicCoinCost = Math.round(
                totalAvailablePoints * percentageOfTotal,
              );
              dynamicCoinCost = Math.max(1, dynamicCoinCost);
            }

            // Parse images
            const images: string[] = reward.image
              ? reward.image.startsWith("[")
                ? (JSON.parse(reward.image) as string[])
                : [reward.image]
              : [];

            // Get purchase count
            const purchaseCount = yield* RewardPurchasePortTag.pipe(
              Effect.flatMap((port) => port.countByRewardId(reward.id)),
            );

            return {
              id: reward.id,
              name: reward.name,
              description: reward.description,
              availableQuantity: reward.availableQuantity,
              isHidden: reward.isHidden,
              image: reward.image,
              coinCost: dynamicCoinCost,
              originalCoinCost: reward.coinCost,
              tripId: reward.tripId,
              createdById: reward.createdById,
              createdAt: reward.createdAt,
              updatedAt: reward.updatedAt,
              remainingQuantity: reward.availableQuantity,
              isAvailable: reward.isAvailable(),
              creator: null, // Will be populated by adapter layer
              images,
              signedImageUrls: [], // Will be populated by adapter layer
              canAfford: false, // Not relevant for admin
              isEligibleToBuy: false, // Not relevant for admin
              isOutOfStock: reward.availableQuantity <= 0,
              purchasedCount: purchaseCount,
            };
          }),
        ),
      );

      return {
        rewards: rewardsWithDetails,
        pagination: {
          total,
          limit,
          offset,
          hasMore,
        },
      };
    });
  }
}
