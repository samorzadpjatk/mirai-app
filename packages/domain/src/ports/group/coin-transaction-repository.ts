import type { CoinTransaction as CoinTransactionEntity } from "../../entities/group/CoinTransaction";
import type { Effect } from "effect";
import type { DatabaseError } from "../database-error";
import type {
  PaginationOptions,
  PaginatedResult,
} from "../activity/ActivityFeedRepository";

// Re-export entity type for consumers
export type CoinTransaction = CoinTransactionEntity;

export type { PaginationOptions, PaginatedResult };

/**
 * Filters for coin transaction queries
 */
export interface CoinTransactionFilters {
  groupId?: string;
  tripId?: string;
  challengeId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Coin statistics
 */
export interface CoinStatistics {
  totalEarned: number;
  totalSpent: number;
  netBalance: number;
}

/**
 * Most active admin statistics
 */
export interface MostActiveAdminStat {
  adminId: string;
  adminName: string;
  transactionCount: number;
  coinsAwarded: number;
}

/**
 * CoinTransactionRepository Port
 *
 * This interface defines what operations the application needs
 * from any coin transaction repository implementation.
 */
export interface CoinTransactionRepository {
  /**
   * Create a new coin transaction
   */
  create(
    transaction: CoinTransaction,
  ): Effect.Effect<CoinTransaction, DatabaseError, never>;

  /**
   * Find transaction by ID
   * @returns Transaction or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<CoinTransaction | null, DatabaseError, never>;

  /**
   * Find transactions by group ID
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<CoinTransaction>, DatabaseError, never>;

  /**
   * Find transactions with filters
   */
  findMany(
    filters: CoinTransactionFilters,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<CoinTransaction>, DatabaseError, never>;

  /**
   * Get coin statistics for a group
   */
  getStatistics(
    groupId: string,
  ): Effect.Effect<CoinStatistics, DatabaseError, never>;

  /**
   * Get most active admins for a trip
   */
  getMostActiveAdmins(
    tripId: string,
    limit?: number,
  ): Effect.Effect<MostActiveAdminStat[], DatabaseError, never>;

  /**
   * Get current balance for a group
   */
  getBalance(groupId: string): Effect.Effect<number, DatabaseError, never>;
}
