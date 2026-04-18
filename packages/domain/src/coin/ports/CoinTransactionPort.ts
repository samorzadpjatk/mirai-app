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
 *
 * Authorization Pattern:
 * All methods requiring authorization use AuthContext pattern via Effect context.
 * AuthContextTag provides userId, role, and tripRoles.
 * AuthZPortTag provides verifyAccess() for permission checks.
 *
 * Financial data requires strict authorization for all operations.
 */
export interface ICoinTransactionPort {
  /**
   * Find transaction by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findById(
    id: string,
  ): Effect.Effect<CoinTransactionDTO | null, IPortError, unknown>;

  /**
   * Find transactions by group ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findByGroupId(
    groupId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, unknown>;

  /**
   * Find transactions by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, unknown>;

  /**
   * Find transactions by trip ID with pagination
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { transactions: CoinTransactionDTO[]; total: number },
    IPortError,
    unknown
  >;

  /**
   * Find transactions by trip ID and group ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findByTripIdAndGroupId(
    tripId: string,
    groupId: string,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, unknown>;

  /**
   * Create new transaction
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  create(
    transaction: CoinTransactionDTO,
  ): Effect.Effect<CoinTransactionDTO, IPortError, unknown>;

  /**
   * Delete transaction by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  delete(id: string): Effect.Effect<void, IPortError, unknown>;

  /**
   * Sum transactions by group ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  sumByGroupId(groupId: string): Effect.Effect<number, IPortError, unknown>;

  // Statistics methods
  /**
   * Count transactions by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  countByTripId(tripId: string): Effect.Effect<number, IPortError, unknown>;

  /**
   * Sum positive transactions by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  sumPositiveByTripId(tripId: string): Effect.Effect<number, IPortError, unknown>;

  /**
   * Sum negative transactions by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  sumNegativeByTripId(tripId: string): Effect.Effect<number, IPortError, unknown>;

  /**
   * Get most active admin statistics by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  getMostActiveAdminStats(tripId: string): Effect.Effect<
    Array<{
      adminId: string;
      totalAmount: number;
      transactionCount: number;
    }>,
    IPortError,
    unknown
  >;

  /**
   * Get group with highest coin balance by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  getRichestGroup(
    tripId: string,
  ): Effect.Effect<
    { groupId: GroupId; totalCoins: number } | null,
    IPortError,
    unknown
  >;

  /**
   * Find recent transactions by trip ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context. Financial data requires strict auth verification.
   */
  findRecentByTripId(
    tripId: string,
    limit: number,
  ): Effect.Effect<CoinTransactionDTO[], IPortError, unknown>;
}
