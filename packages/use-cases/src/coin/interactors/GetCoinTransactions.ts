import { Effect } from "effect";
import { TripId, GroupId } from "@mirai-app/domain";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import type { CoinTransactionWithDetailsDTO } from "../dto/CoinDTOs";
import { CoinTransactionId, UserId } from "@mirai-app/domain";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

/**
 * Input for GetCoinTransactionsUseCase
 */
export interface GetCoinTransactionsInput {
  tripId: string;
  groupId?: string;
  userId: string;
  limit: number;
}

/**
 * Get Coin Transactions Use Case
 *
 * Retrieves coin transactions for a user in a trip.
 */
export class GetCoinTransactionsUseCase {
  execute(input: GetCoinTransactionsInput) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);

      // If groupId is provided, verify it exists and belongs to the trip
      if (input.groupId) {
        const groupId = GroupId.unsafeCreate(input.groupId);
        const group = yield* groupPort.findById(groupId);

        if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
          return yield* Effect.fail(
            new GroupNotFoundError({ groupId: input.groupId }),
          );
        }
      }

      // Get transactions
      const transactions = input.groupId
        ? yield* coinPort.findByTripIdAndGroupId(tripId, GroupId.unsafeCreate(input.groupId))
        : yield* coinPort.findByTripId(tripId);

      // Limit results
      const limitedTransactions = transactions.slice(0, input.limit);

      // Collect unique groupIds and adminIds for parallel fetching
      const uniqueGroupIds = Array.from(
        new Set(limitedTransactions.map((t) => t.groupId)),
      );
      const uniqueAdminIds = Array.from(
        new Set(limitedTransactions.filter((t) => t.adminId).map((t) => t.adminId!)),
      );

      // Parallel fetch all groups and admins
      const [groups, admins] = yield* Effect.all([
        Effect.all(uniqueGroupIds.map((id) => groupPort.findById(GroupId.unsafeCreate(id)))),
        Effect.all(uniqueAdminIds.map((id) => userPort.findById(UserId.unsafeCreate(id)))),
      ]);

      // Create lookup maps
      const groupMap = new Map(groups.filter((g) => g !== null).map((g) => [g!.id, g!]));
      const adminMap = new Map(admins.filter((u) => u !== null).map((u) => [u!.id, u!]));

      // Build fully-populated DTOs
      return limitedTransactions.map((t) => {
        const groupId = GroupId.unsafeCreate(t.groupId);
        const adminId = t.adminId ? UserId.unsafeCreate(t.adminId) : null;
        const group = groupMap.get(groupId);
        const admin = adminId ? adminMap.get(adminId) : null;

        return {
          id: CoinTransactionId.unsafeCreate(t.id),
          groupId,
          amount: t.amount,
          reason: t.reason,
          adminId: adminId ?? ("" as UserId),
          createdAt: t.createdAt,
          group: group
            ? {
                id: group.id,
                name: group.name,
                coins: group.coins,
              }
            : null,
          admin: admin
            ? {
                id: admin.id,
                firstName: admin.firstName,
                lastName: admin.lastName,
              }
            : null,
        };
      }) as CoinTransactionWithDetailsDTO[];
    });
  }
}
