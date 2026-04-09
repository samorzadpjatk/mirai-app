import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";

/**
 * Input for GetCoinTransactions use case
 */
export interface GetCoinTransactionsInput {
  tripId: string;
  groupId?: string;
  pagination?: Partial<PaginationOptions>;
}

/**
 * Output for GetCoinTransactions use case
 */
export interface GetCoinTransactionsOutput {
  transactions: CoinTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * GetCoinTransactions Use Case
 *
 * Retrieves paginated list of coin transactions for a trip.
 * Can optionally filter by group.
 */
export class GetCoinTransactionsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinTransactionsInput,
  ): Promise<Result<GetCoinTransactionsOutput, string>> {
    try {
      const limit = input.pagination?.limit ?? 50;
      const offset = input.pagination?.offset ?? 0;

      const filters = {
        tripId: input.tripId,
        ...(input.groupId && { groupId: input.groupId }),
      };

      const [transactions, total] = await Promise.all([
        this.coinRepo.findMany(filters, { limit, offset }),
        this.coinRepo.count(filters),
      ]);

      return ok({
        transactions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      return err(
        `Failed to get coin transactions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
