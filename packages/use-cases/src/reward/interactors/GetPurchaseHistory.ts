import { Effect } from "effect";
import type { ApplicationError, TripId, GroupId } from "@mirai-app/domain";
import {
  TripId as TripIdFactory,
  GroupId as GroupIdFactory,
} from "@mirai-app/domain";
import { RewardPurchasePort } from "../ports/RewardPurchasePort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
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
  execute(
    input: GetPurchaseHistoryInput,
  ): Effect.Effect<
    PaginatedPurchasesDTO,
    ApplicationError | TripNotFoundError,
    RewardPurchasePort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const purchasePort = yield* RewardPurchasePort;
      const participantPort = yield* TripParticipantPort;

      const tripId = TripIdFactory.unsafeCreate(input.tripId);
      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      let groupId: GroupId | undefined;

      // If not staff, restrict to user's group
      if (!input.isStaff) {
        const participant = yield* participantPort.findByUserAndTrip(
          input.userId,
          input.tripId,
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
