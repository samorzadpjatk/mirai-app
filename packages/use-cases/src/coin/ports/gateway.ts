import { Context, Effect } from "effect";
import type {
  CoinTransactionDTO,
  Connection,
  DatabaseError,
} from "@mirai-app/domain";

/**
 * CoinTransactionGateway Port
 *
 * This interface defines what operations the application needs
 * from any coin transaction gateway implementation.
 *
 * All methods return CoinTransactionDTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleCoinTransactionGateway: Uses Drizzle ORM
 * - InMemoryCoinTransactionGateway: For testing
 */

export interface CoinTransactionFilters {
  tripId?: string;
  groupId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * Cursor data for coin transaction pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface CoinTransactionCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for coin transaction connection pagination
 */
export interface CoinTransactionConnectionArgs {
  first?: number;
  after?: CoinTransactionCursorData | null;
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
  adminName?: string;
  transactionCount: number;
  coinsAwarded: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CoinTransactionGateway {
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
   * Find transactions with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findManyConnection(
    filters: Partial<CoinTransactionFilters>,
    args: CoinTransactionConnectionArgs,
  ): Effect.Effect<Connection<CoinTransactionDTO>, never, never>;

  /**
   * Find recent transactions
   */
  findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Effect.Effect<CoinTransactionDTO[], never, never>;

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
  }): Effect.Effect<CoinTransactionDTO, never, never>;

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
 * CoinTransactionGateway Context.Tag for Effect dependency injection
 */
export class CoinTransactionGatewayTag extends Context.Tag(
  "CoinTransactionGateway",
)<CoinTransactionGatewayTag, CoinTransactionGateway>() {}
