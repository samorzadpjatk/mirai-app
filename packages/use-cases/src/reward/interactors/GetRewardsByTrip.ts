import { Effect, Data } from "effect";
import type {
  TripId,
  UserId,
  GroupId} from "@mirai-app/domain";
import { TripId as TripIdFactory } from "@mirai-app/domain";
import { RewardPortTag } from "../ports/RewardPort";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import type { RewardWithAvailabilityDTO } from "../dto/RewardDTOs";
import { RewardNotFoundError, TripNotFoundError } from "../errors/RewardErrors";

/**
 * Input for GetRewardsByTripUseCase
 */
export interface GetRewardsByTripInput {
  tripId: string;
  userId: string;
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
 * Result for GetRewardsByTripUseCase
 */
export interface GetRewardsByTripResult {
  rewards: Array<
    RewardWithAvailabilityDTO & {
      creator: CreatorInfo | null;
      images: string[];
      signedImageUrls: string[];
      canAfford: boolean;
      isEligibleToBuy: boolean;
      isOutOfStock: boolean;
      purchasedCount: number;
      originalCoinCost: number;
    }
  >;
  totalAvailablePoints: number;
}

/**
 * Get Rewards By Trip Use Case
 *
 * Retrieves visible rewards for a specific trip with dynamic pricing
 * and user-specific eligibility information.
 */
export class GetRewardsByTripUseCase {
  execute(input: GetRewardsByTripInput) {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPortTag;
      const challengePort = yield* ChallengePortTag;
      const participantPort = yield* TripParticipantPortTag;
      const groupPort = yield* GroupPortTag;

      const isAllTrips = input.tripId === "all";
      const tripId = isAllTrips
        ? null
        : TripIdFactory.unsafeCreate(input.tripId);

      // Get visible rewards
      const rewards = isAllTrips
        ? yield* rewardPort
            .findAllPaginated({ limit: 100, offset: 0 })
            .pipe(
              Effect.map((r) => r.rewards.filter((reward) => !reward.isHidden)),
            )
        : yield* rewardPort.findAvailableByTripId(tripId!);

      // Calculate total available points for dynamic pricing
      let totalAvailablePoints = 0;
      if (!isAllTrips && tripId) {
        const challenges = yield* challengePort.findByTripId(input.tripId);
        for (const challenge of challenges) {
          totalAvailablePoints += challenge.basePoints;
          if (challenge.scoringCategory !== "UNLIMITED") {
            totalAvailablePoints += challenge.firstPlacePoints ?? 0;
            totalAvailablePoints += challenge.secondPlacePoints ?? 0;
            totalAvailablePoints += challenge.thirdPlacePoints ?? 0;
          }
        }
      }

      // Get user's group info for eligibility
      let groupCoins = 0;
      let isGroupLeader = false;
      let groupId: GroupId | null = null;

      if (!isAllTrips && tripId) {
        const participant = yield* participantPort.findByUserAndTrip(
          input.userId,
          input.tripId,
        );

        if (participant?.groupId) {
          const group = yield* groupPort.findById(participant.groupId);
          if (group) {
            groupId = group.id;
            groupCoins = group.coins;
            // Check if user is group leader (organizer)
            isGroupLeader = group.organizerId === input.userId;
          }
        }
      }

      // Build result with dynamic pricing
      const rewardsWithDetails = yield* Effect.all(
        rewards.map((reward) =>
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
              canAfford: groupCoins >= dynamicCoinCost,
              isEligibleToBuy: isGroupLeader,
              isOutOfStock: reward.availableQuantity <= 0,
              purchasedCount: purchaseCount,
            };
          }),
        ),
      );

      return {
        rewards: rewardsWithDetails,
        totalAvailablePoints,
      };
    });
  }
}
