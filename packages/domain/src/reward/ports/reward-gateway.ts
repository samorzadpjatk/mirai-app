import type { Reward } from "../entities/reward";
import type { RewardPurchase } from "../entities/reward-purchase";
import type { RewardId } from "../../reward/value-objects/id";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type {
  PaginationOptions,
  PaginatedResult,
} from "../../activity/ports/activity-feed-gateway";

export type { PaginationOptions, PaginatedResult };

/**
 * RewardGateway Port
 *
 * This interface defines what operations the application needs
 * from any reward gateway implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleRewardGateway: Uses Drizzle ORM
 * - InMemoryRewardGateway: For testing
 */
export interface RewardGateway {
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
 * RewardPurchaseGateway Port
 *
 * This interface defines operations for reward purchases.
 */
export interface RewardPurchaseGateway {
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
