import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { GroupId } from "../../group/value-objects/GroupId";

/**
 * CoinTransaction DTO (defined in use-cases, referenced here)
 * This is the persistence DTO used by adapters
 */
export interface CoinTransactionDTO {
  id: string;
  tripId: string;
  groupId: string;
  amount: number;
  reason: string | null;
  adminId: string | null;
  createdAt: Date;
}

/**
 * CoinTransaction Port - Repository interface
 *
 * This interface defines what operations the application needs
 * from any CoinTransaction storage implementation.
 */
export interface ICoinTransactionPort {
  findById(
    id: string,
  ): Effect.Effect<CoinTransactionDTO | null, IPortError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, never>;
  findByTripId(
    tripId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, never>;
  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { transactions: CoinTransactionDTO[]; total: number },
    IPortError,
    never
  >;
  findByTripIdAndGroupId(
    tripId: string,
    groupId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, never>;
  create(
    transaction: CoinTransactionDTO,
  ): Effect.Effect<CoinTransactionDTO, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  sumByGroupId(groupId: string): Effect.Effect<number, IPortError, never>;

  // Statistics methods
  countByTripId(tripId: string): Effect.Effect<number, IPortError, never>;
  sumPositiveByTripId(tripId: string): Effect.Effect<number, IPortError, never>;
  sumNegativeByTripId(tripId: string): Effect.Effect<number, IPortError, never>;
  getMostActiveAdminStats(tripId: string): Effect.Effect<
    Array<{
      adminId: string;
      totalAmount: number;
      transactionCount: number;
    }>,
    IPortError,
    never
  >;
  getRichestGroup(
    tripId: string,
  ): Effect.Effect<
    { groupId: GroupId; totalCoins: number } | null,
    IPortError,
    never
  >;
  findRecentByTripId(
    tripId: string,
    limit: number,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, never>;
}
