import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import { GroupPort } from "../../group/ports/GroupPort";
import type { CoinTransactionWithDetailsDTO } from "../dto/CoinDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import { CoinTransactionId, GroupId, UserId } from "@mirai-app/domain";
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
  execute(
    input: GetCoinTransactionsInput,
  ): Effect.Effect<
    CoinTransactionWithDetailsDTO[],
    ApplicationError | GroupNotFoundError,
    CoinTransactionPort | GroupPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;
      const groupPort = yield* GroupPort;

      // If groupId is provided, verify it exists and belongs to the trip
      if (input.groupId) {
        const group = yield* groupPort.findById(input.groupId);

        if (!group || group.isDeleted || group.tripId !== input.tripId) {
          return yield* Effect.fail(
            new GroupNotFoundError({ groupId: input.groupId }),
          );
        }
      }

      // Get transactions
      const transactions = input.groupId
        ? yield* coinPort.findByTripIdAndGroupId(input.tripId, input.groupId)
        : yield* coinPort.findByTripId(input.tripId);

      // Limit results
      const limitedTransactions = transactions.slice(0, input.limit);

      return limitedTransactions.map((t) => ({
        id: CoinTransactionId.unsafeCreate(t.id),
        groupId: GroupId.unsafeCreate(t.groupId),
        amount: t.amount,
        reason: t.reason,
        adminId: t.adminId ? UserId.unsafeCreate(t.adminId) : ("" as UserId),
        createdAt: t.createdAt,
        group: null, // Will be hydrated by adapter
        admin: null, // Will be hydrated by adapter
      }));
    });
  }
}
