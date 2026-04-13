import type { Reward, RewardPurchase, RewardId } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * Repository error type for port interfaces
 * This is a common error type used across all repository implementations
 */
export class DatabaseError extends Error {
  readonly _tag = "DatabaseError" as const;
  readonly code = "DATABASE_ERROR" as const;
  readonly operation: string;
  override readonly message: string;
  override readonly cause?: unknown;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(`Database error in '${props.operation}': ${props.message}`);
    this.operation = props.operation;
    this.message = props.message;
    this.cause = props.cause;
  }
}

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * RewardRepository Port
 *
 * This interface defines what operations the application needs
 * from any reward repository implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleRewardRepository: Uses Drizzle ORM
 * - InMemoryRewardRepository: For testing
 */
export interface RewardRepository {
  /**
   * Create a new reward
   */
  create(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;

  /**
   * Find reward by ID
   * @returns Reward or null if not found
   */
  findById(id: RewardId): Effect.Effect<Reward | null, DatabaseError, never>;

  /**
   * Find all rewards for a trip
   */
  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never>;

  /**
   * Find all visible (not hidden) rewards for a trip
   */
  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never>;

  /**
   * Update reward
   */
  update(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;

  /**
   * Delete reward (only allowed if no purchases exist)
   */
  delete(id: RewardId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if reward has any purchases
   */
  hasPurchases(id: RewardId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Get purchase count for a reward
   */
  getPurchaseCount(id: RewardId): Effect.Effect<number, DatabaseError, never>;

  /**
   * Decrement available quantity (atomic operation)
   * Used during purchase transactions
   */
  decrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never>;

  /**
   * Increment available quantity (atomic operation)
   * Used during refund/cancellation
   */
  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never>;
}

/**
 * RewardRepository Context.Tag for Effect dependency injection
 */
export class RewardRepositoryTag extends Context.Tag("RewardRepository")<
  RewardRepositoryTag,
  {
    create: (reward: Reward) => Effect.Effect<Reward, DatabaseError, never>;
    findById: (
      id: RewardId,
    ) => Effect.Effect<Reward | null, DatabaseError, never>;
    findByTripId: (
      tripId: string,
      options?: { includeHidden?: boolean } & PaginationOptions,
    ) => Effect.Effect<PaginatedResult<Reward>, DatabaseError, never>;
    findVisibleByTripId: (
      tripId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<PaginatedResult<Reward>, DatabaseError, never>;
    update: (reward: Reward) => Effect.Effect<Reward, DatabaseError, never>;
    delete: (id: RewardId) => Effect.Effect<void, DatabaseError, never>;
    hasPurchases: (
      id: RewardId,
    ) => Effect.Effect<boolean, DatabaseError, never>;
    getPurchaseCount: (
      id: RewardId,
    ) => Effect.Effect<number, DatabaseError, never>;
    decrementQuantity: (
      id: RewardId,
      amount: number,
    ) => Effect.Effect<Reward, DatabaseError, never>;
    incrementQuantity: (
      id: RewardId,
      amount: number,
    ) => Effect.Effect<Reward, DatabaseError, never>;
  }
>() {}

/**
 * RewardPurchaseRepository Port
 *
 * This interface defines operations for reward purchases.
 */
export interface RewardPurchaseRepository {
  /**
   * Create a new purchase
   */
  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;

  /**
   * Find purchase by ID
   */
  findById(
    id: string,
  ): Effect.Effect<RewardPurchase | null, DatabaseError, never>;

  /**
   * Find purchases by reward ID
   */
  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;

  /**
   * Find purchases by group ID
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;

  /**
   * Find all purchases for a trip
   */
  findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;

  /**
   * Update purchase status
   */
  updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;

  /**
   * Count purchases for a reward
   */
  countByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<number, DatabaseError, never>;
}

/**
 * RewardPurchaseRepository Context.Tag for Effect dependency injection
 */
export class RewardPurchaseRepositoryTag extends Context.Tag(
  "RewardPurchaseRepository",
)<
  RewardPurchaseRepositoryTag,
  {
    create: (
      purchase: RewardPurchase,
    ) => Effect.Effect<RewardPurchase, DatabaseError, never>;
    findById: (
      id: string,
    ) => Effect.Effect<RewardPurchase | null, DatabaseError, never>;
    findByRewardId: (
      rewardId: RewardId,
      options?: PaginationOptions,
    ) => Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;
    findByGroupId: (
      groupId: string,
      options?: PaginationOptions,
    ) => Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;
    findByTripId: (
      tripId: string,
      options?: { groupId?: string } & PaginationOptions,
    ) => Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never>;
    updateStatus: (
      id: string,
      status: string,
      updatedById: string,
      collectionMethod?: string | null,
    ) => Effect.Effect<RewardPurchase, DatabaseError, never>;
    countByRewardId: (
      rewardId: RewardId,
    ) => Effect.Effect<number, DatabaseError, never>;
  }
>() {}

/**
 * TripPointsCalculator Port
 *
 * Calculates total available points for a trip (used for dynamic pricing)
 */
export interface TripPointsCalculator {
  /**
   * Calculate total available points for a trip
   * Based on challenges and their point values
   */
  calculateTotalAvailablePoints(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never>;
}

/**
 * TripPointsCalculator Context.Tag for Effect dependency injection
 */
export class TripPointsCalculatorTag extends Context.Tag(
  "TripPointsCalculator",
)<
  TripPointsCalculatorTag,
  {
    calculateTotalAvailablePoints: (
      tripId: string,
    ) => Effect.Effect<number, DatabaseError, never>;
  }
>() {}

/**
 * GroupCoinsService Port
 *
 * Manages group coin balances
 */
export interface GroupCoinsService {
  /**
   * Get current coin balance for a group
   */
  getBalance(groupId: string): Effect.Effect<number, never, never>;

  /**
   * Deduct coins from a group (atomic)
   * Returns error if insufficient funds
   */
  deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Add coins to a group (atomic)
   * Used for refunds
   */
  addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Effect.Effect<void, never, never>;
}

/**
 * GroupCoinsService Context.Tag for Effect dependency injection
 */
export class GroupCoinsServiceTag extends Context.Tag("GroupCoinsService")<
  GroupCoinsServiceTag,
  {
    getBalance: (groupId: string) => Effect.Effect<number, never, never>;
    deductCoins: (
      groupId: string,
      amount: number,
      reason: string,
      adminId: string,
    ) => Effect.Effect<void, never, never>;
    addCoins: (
      groupId: string,
      amount: number,
      reason: string,
      adminId: string,
    ) => Effect.Effect<void, never, never>;
  }
>() {}

/**
 * TripAccessChecker Port
 *
 * Validates access permissions for trip operations
 */
export interface TripAccessChecker {
  /**
   * Check if user is a group leader for a trip
   */
  isGroupLeader(
    userId: string,
    tripId: string,
  ): Effect.Effect<
    {
      isLeader: boolean;
      groupId?: string;
      groupName?: string;
      coins?: number;
    },
    never,
    never
  >;

  /**
   * Check if user is staff (admin or moderator)
   */
  isStaff(userId: string): Effect.Effect<boolean, never, never>;

  /**
   * Check if trip has ended
   */
  hasTripEnded(tripId: string): Effect.Effect<boolean, never, never>;
}

/**
 * TripAccessChecker Context.Tag for Effect dependency injection
 */
export class TripAccessCheckerTag extends Context.Tag("TripAccessChecker")<
  TripAccessCheckerTag,
  {
    isGroupLeader: (
      userId: string,
      tripId: string,
    ) => Effect.Effect<
      {
        isLeader: boolean;
        groupId?: string;
        groupName?: string;
        coins?: number;
      },
      never,
      never
    >;
    isStaff: (userId: string) => Effect.Effect<boolean, never, never>;
    hasTripEnded: (tripId: string) => Effect.Effect<boolean, never, never>;
  }
>() {}
