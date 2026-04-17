import { Context, Effect } from "effect";
import type { DatabaseError, GroupId, UserId } from "@mirai-app/domain";

/**
 * CoinTransaction Port - Repository interface for Effect DI
 */
export interface ICoinTransactionPort {
  findById(
    id: string,
  ): Effect.Effect<CoinTransaction | null, DatabaseError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never>;
  findByTripId(
    tripId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never>;
  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { transactions: CoinTransaction[]; total: number },
    DatabaseError,
    never
  >;
  findByTripIdAndGroupId(
    tripId: string,
    groupId: string,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never>;
  create(
    transaction: CoinTransaction,
  ): Effect.Effect<CoinTransaction, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  sumByGroupId(groupId: string): Effect.Effect<number, DatabaseError, never>;

  // Statistics methods
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;
  sumPositiveByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  sumNegativeByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  getMostActiveAdminStats(tripId: string): Effect.Effect<
    Array<{
      adminId: string;
      totalAmount: number;
      transactionCount: number;
    }>,
    DatabaseError,
    never
  >;
  getRichestGroup(
    tripId: string,
  ): Effect.Effect<
    { groupId: GroupId; totalCoins: number } | null,
    DatabaseError,
    never
  >;
  findRecentByTripId(
    tripId: string,
    limit: number,
  ): Effect.Effect<CoinTransaction[], DatabaseError, never>;
}

/**
 * Context.Tag for ICoinTransactionPort dependency injection
 */
export class CoinTransactionPortTag extends Context.Tag("CoinTransactionPort")<
  CoinTransactionPortTag,
  ICoinTransactionPort
>() {}

/**
 * CoinTransaction entity interface for use cases
 */
export interface CoinTransaction {
  id: string;
  tripId: string;
  groupId: string;
  amount: number;
  reason: string | null;
  adminId: string | null;
  createdAt: Date;
}
