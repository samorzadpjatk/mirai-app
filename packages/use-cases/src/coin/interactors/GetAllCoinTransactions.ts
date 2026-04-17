import { Effect } from "effect";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import type {
  PaginatedCoinTransactionsDTO,
  CoinTransactionDTO,
} from "../dto/CoinDTOs";
import type { UserId } from "@mirai-app/domain";
import {
  CoinTransactionId as CoinTransactionIdFactory,
  GroupId as GroupIdFactory,
} from "@mirai-app/domain";

/**
 * Input for GetAllCoinTransactionsUseCase
 */
export interface GetAllCoinTransactionsInput {
  tripId: string;
  pagination?: {
    limit: number;
    offset: number;
  };
}

/**
 * Get All Coin Transactions Use Case
 *
 * Retrieves paginated coin transactions for a trip.
 */
export class GetAllCoinTransactionsUseCase {
  execute(input: GetAllCoinTransactionsInput) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;

      const limit = input.pagination?.limit ?? 50;
      const offset = input.pagination?.offset ?? 0;

      const result = yield* coinPort.findByTripIdPaginated(input.tripId, {
        limit,
        offset,
      });

      const transactions: CoinTransactionDTO[] = result.transactions.map(
        (t) => ({
          id: CoinTransactionIdFactory.unsafeCreate(t.id),
          groupId: GroupIdFactory.unsafeCreate(t.groupId),
          amount: t.amount,
          reason: t.reason,
          adminId: t.adminId ? (t.adminId as UserId) : ("" as UserId),
          createdAt: t.createdAt,
        }),
      );

      return {
        transactions,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total,
        },
      };
    });
  }
}
