import { Effect } from "effect";
import type { TripId, GroupId, UserId } from "@mirai-app/domain";
import {
  TripId as TripIdFactory,
  GroupId as GroupIdFactory,
  UserId as UserIdFactory,
} from "@mirai-app/domain";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import type {
  PaginatedPurchasesDTO,
  RewardPurchaseDTO,
} from "../dto/RewardDTOs";
import { TripNotFoundError } from "../errors/RewardErrors";

/**
 * Input for GetPurchaseHistoryUseCase
 */
export interface GetPurchaseHistoryInput {
  tripId: string;
  userId: string;
  isStaff: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get Purchase History Use Case
 *
 * Retrieves purchase history for a trip.
 * Staff can see all purchases, regular users only see their group's purchases.
 */
export class GetPurchaseHistoryUseCase {
  execute(input: GetPurchaseHistoryInput) {
    return Effect.gen(function* () {
      const purchasePort = yield* RewardPurchasePortTag;
      const participantPort = yield* TripParticipantPortTag;

      const tripId = TripIdFactory.unsafeCreate(input.tripId);
      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      let groupId: GroupId | undefined;

      // If not staff, restrict to user's group
      if (!input.isStaff) {
        const userId = UserIdFactory.unsafeCreate(input.userId);
        const participant = yield* participantPort.findByUserAndTrip(
          userId,
          tripId,
        );

        if (!participant?.groupId) {
          return yield* Effect.fail(
            new TripNotFoundError({ tripId: input.tripId }),
          );
        }

        groupId = GroupIdFactory.unsafeCreate(participant.groupId);
      }

      // Get purchases
      const { purchases, total, hasMore } = groupId
        ? yield* purchasePort.findPaginatedByTripIdAndGroupId(tripId, groupId, {
            limit,
            offset,
          })
        : yield* purchasePort.findPaginatedByTripId(tripId, { limit, offset });

      // Map to DTOs
      const purchaseDTOs: RewardPurchaseDTO[] = purchases.map((purchase) => ({
        id: purchase.id,
        rewardId: purchase.rewardId,
        groupId: purchase.groupId,
        userId: purchase.purchasedById,
        quantity: purchase.quantity,
        totalCost: purchase.totalCost,
        status: purchase.status,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      }));

      return {
        purchases: purchaseDTOs,
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
