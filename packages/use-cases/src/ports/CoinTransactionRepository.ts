import { Context, Effect } from "effect";

/**
 * CoinTransactionRepository Port
 *
 * This interface defines what operations the application needs
 * from any coin transaction repository implementation.
 */

export interface CoinTransaction {
  id: string;
  groupId: string;
  amount: number;
  reason?: string | null;
  adminId: string;
  createdAt: Date;
  group?: {
    id: string;
    name: string;
    coins: number;
  } | null;
  admin?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface CoinTransactionFilters {
  tripId?: string;
  groupId?: string;
  status?: string;
  scheduleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface CoinStatistics {
  transactionCount: number;
  addedCoins: number;
  removedCoins: number;
  netBalance: number;
}

export interface MostActiveAdminStat {
  adminId: string;
  _sum: {
    amount: number | null;
  };
  _count: {
    id: number;
  };
}

export interface CoinTransactionRepository {
  /**
   * Count transactions by filters
   */
  count(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number, never, never>;

  /**
   * Sum amounts with filters
   */
  sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number | null, never, never>;

  /**
   * Sum positive amounts (added coins)
   */
  sumAddedCoins(tripId: string): Effect.Effect<number | null, never, never>;

  /**
   * Sum negative amounts (removed coins)
   */
  sumRemovedCoins(tripId: string): Effect.Effect<number | null, never, never>;

  /**
   * Get most active admin by transaction volume
   */
  getMostActiveAdmin(
    tripId: string,
  ): Effect.Effect<MostActiveAdminStat[], never, never>;

  /**
   * Find transactions with pagination
   */
  findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<CoinTransaction[], never, never>;

  /**
   * Find recent transactions
   */
  findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Effect.Effect<CoinTransaction[], never, never>;

  /**
   * Get total coins by group
   */
  getTotalCoinsByGroup(tripId: string): Effect.Effect<
    Array<{
      groupId: string;
      _sum: { amount: number | null };
    }>,
    never,
    never
  >;

  /**
   * Group by admin with count
   */
  groupByAdmin(
    tripId: string,
    limit: number,
  ): Effect.Effect<
    Array<{
      adminId: string;
      _count: { id: number };
    }>,
    never,
    never
  >;

  /**
   * Create a new coin transaction
   */
  create(data: {
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Effect.Effect<CoinTransaction, never, never>;

  /**
   * Increment group coins
   */
  incrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<void, never, never>;

  /**
   * Decrement group coins (with balance check)
   */
  decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<{ success: boolean; currentBalance?: number }, never, never>;

  /**
   * Get group coins
   */
  getGroupCoins(groupId: string): Effect.Effect<number, never, never>;

  /**
   * Verify group belongs to trip and is not deleted
   */
  verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Effect.Effect<
    {
      exists: boolean;
      tripId?: string;
      isDeleted?: boolean;
      coins?: number;
    },
    never,
    never
  >;
}

/**
 * CoinTransactionRepository Context.Tag for Effect dependency injection
 */
export class CoinTransactionRepositoryTag extends Context.Tag(
  "CoinTransactionRepository",
)<
  CoinTransactionRepositoryTag,
  {
    count: (
      filters?: Partial<CoinTransactionFilters>,
    ) => Effect.Effect<number, never, never>;
    sumAmount: (
      filters?: Partial<CoinTransactionFilters>,
    ) => Effect.Effect<number | null, never, never>;
    sumAddedCoins: (
      tripId: string,
    ) => Effect.Effect<number | null, never, never>;
    sumRemovedCoins: (
      tripId: string,
    ) => Effect.Effect<number | null, never, never>;
    getMostActiveAdmin: (
      tripId: string,
    ) => Effect.Effect<MostActiveAdminStat[], never, never>;
    findMany: (
      filters: Partial<CoinTransactionFilters>,
      pagination: PaginationOptions,
    ) => Effect.Effect<CoinTransaction[], never, never>;
    findRecent: (
      filters: Partial<CoinTransactionFilters>,
      limit: number,
    ) => Effect.Effect<CoinTransaction[], never, never>;
    getTotalCoinsByGroup: (tripId: string) => Effect.Effect<
      Array<{
        groupId: string;
        _sum: { amount: number | null };
      }>,
      never,
      never
    >;
    groupByAdmin: (
      tripId: string,
      limit: number,
    ) => Effect.Effect<
      Array<{
        adminId: string;
        _count: { id: number };
      }>,
      never,
      never
    >;
    create: (data: {
      groupId: string;
      amount: number;
      reason?: string;
      adminId: string;
    }) => Effect.Effect<CoinTransaction, never, never>;
    incrementGroupCoins: (
      groupId: string,
      amount: number,
    ) => Effect.Effect<void, never, never>;
    decrementGroupCoins: (
      groupId: string,
      amount: number,
    ) => Effect.Effect<
      { success: boolean; currentBalance?: number },
      never,
      never
    >;
    getGroupCoins: (groupId: string) => Effect.Effect<number, never, never>;
    verifyGroupInTrip: (
      groupId: string,
      tripId: string,
    ) => Effect.Effect<
      {
        exists: boolean;
        tripId?: string;
        isDeleted?: boolean;
        coins?: number;
      },
      never,
      never
    >;
  }
>() {}
