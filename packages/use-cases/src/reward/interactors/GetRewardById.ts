import { Effect } from "effect";
import type {
  ApplicationError,
  RewardId,
  UserId,
  RewardPurchase,
} from "@mirai-app/domain";
import { RewardId as RewardIdFactory } from "@mirai-app/domain";
import { RewardPort } from "../ports/RewardPort";
import { RewardPurchasePort } from "../ports/RewardPurchasePort";
import { ChallengePortTag } from "../../challenge/ports/ChallengePort";
import type {
  RewardWithAvailabilityDTO,
  RewardPurchaseStatus,
} from "../dto/RewardDTOs";
import { RewardNotFoundError, RewardHiddenError } from "../errors/RewardErrors";

/**
 * Input for GetRewardByIdUseCase
 */
export interface GetRewardByIdInput {
  rewardId: string;
  userId: string;
  isStaff: boolean;
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
 * Purchase info type
 */
interface PurchaseInfo {
  id: string;
  groupId: string;
  groupName: string;
  quantity: number;
  totalCost: number;
  status: RewardPurchaseStatus;
  purchasedBy: CreatorInfo;
  statusUpdatedBy: CreatorInfo | null;
  purchasedAt: Date;
}

/**
 * Result for GetRewardByIdUseCase
 */
export interface GetRewardByIdResult extends RewardWithAvailabilityDTO {
  creator: CreatorInfo | null;
  images: string[];
  signedImageUrls: string[];
  purchasedCount: number;
  originalCoinCost: number;
  purchases: PurchaseInfo[];
}

/**
 * Get Reward By ID Use Case
 *
 * Retrieves a single reward by ID with full details including purchase history.
 * Staff can see hidden rewards, regular users cannot.
 */
export class GetRewardByIdUseCase {
  execute(
    input: GetRewardByIdInput,
  ): Effect.Effect<
    GetRewardByIdResult,
    ApplicationError | RewardNotFoundError | RewardHiddenError,
    RewardPort | RewardPurchasePort | ChallengePortTag
  > {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPort;
      const challengePort = yield* ChallengePortTag;
      const purchasePort = yield* RewardPurchasePort;

      const rewardId = RewardIdFactory.unsafeCreate(input.rewardId);

      // Find reward
      const reward = yield* rewardPort.findById(rewardId);

      if (!reward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Check if hidden and user is not staff
      if (reward.isHidden && !input.isStaff) {
        return yield* Effect.fail(
          new RewardHiddenError({ rewardId: input.rewardId }),
        );
      }

      // Calculate total available points for dynamic pricing
      let totalAvailablePoints = 0;
      const challenges = yield* challengePort.findByTripId(reward.tripId);
      for (const challenge of challenges) {
        totalAvailablePoints += challenge.basePoints;
        if (challenge.scoringCategory !== "UNLIMITED") {
          totalAvailablePoints += challenge.firstPlacePoints ?? 0;
          totalAvailablePoints += challenge.secondPlacePoints ?? 0;
          totalAvailablePoints += challenge.thirdPlacePoints ?? 0;
        }
      }

      // Calculate dynamic coin cost
      let dynamicCoinCost = reward.coinCost;
      if (totalAvailablePoints > 0) {
        const percentageOfTotal = reward.coinCost / 100;
        dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);
        dynamicCoinCost = Math.max(1, dynamicCoinCost);
      }

      // Parse images
      const images: string[] = reward.image
        ? reward.image.startsWith("[")
          ? (JSON.parse(reward.image) as string[])
          : [reward.image]
        : [];

      // Get purchase count
      const purchaseCount = yield* purchasePort.countByRewardId(reward.id);

      // Get purchases (only for staff)
      let purchases: PurchaseInfo[] = [];
      if (input.isStaff) {
        const purchaseRecords = yield* purchasePort.findByRewardId(reward.id);
        // Note: Full purchase info with user details will be populated by adapter
        purchases = purchaseRecords.map((p) => ({
          id: p.id,
          groupId: p.groupId,
          groupName: "", // Populated by adapter
          quantity: p.quantity,
          totalCost: p.totalCost,
          status: p.status as RewardPurchaseStatus,
          purchasedBy: { id: p.purchasedById, firstName: "", lastName: "" },
          statusUpdatedBy: p.statusUpdatedById
            ? { id: p.statusUpdatedById, firstName: "", lastName: "" }
            : null,
          purchasedAt: p.purchasedAt,
        }));
      }

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
        purchasedCount: purchaseCount,
        purchases,
      };
    });
  }
}
