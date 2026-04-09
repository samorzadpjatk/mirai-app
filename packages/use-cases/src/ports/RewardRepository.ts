import type { Reward, RewardPurchase, RewardId } from "@repo/domain";

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
 * - PrismaRewardRepository: Uses Prisma ORM
 * - InMemoryRewardRepository: For testing
 */
export interface RewardRepository {
  /**
   * Create a new reward
   */
  create(reward: Reward): Promise<Reward>;

  /**
   * Find reward by ID
   * @returns Reward or null if not found
   */
  findById(id: RewardId): Promise<Reward | null>;

  /**
   * Find all rewards for a trip
   */
  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Promise<PaginatedResult<Reward>>;

  /**
   * Find all visible (not hidden) rewards for a trip
   */
  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Reward>>;

  /**
   * Update reward
   */
  update(reward: Reward): Promise<Reward>;

  /**
   * Delete reward (only allowed if no purchases exist)
   */
  delete(id: RewardId): Promise<void>;

  /**
   * Check if reward has any purchases
   */
  hasPurchases(id: RewardId): Promise<boolean>;

  /**
   * Get purchase count for a reward
   */
  getPurchaseCount(id: RewardId): Promise<number>;

  /**
   * Decrement available quantity (atomic operation)
   * Used during purchase transactions
   */
  decrementQuantity(id: RewardId, amount: number): Promise<Reward>;

  /**
   * Increment available quantity (atomic operation)
   * Used during refund/cancellation
   */
  incrementQuantity(id: RewardId, amount: number): Promise<Reward>;
}

/**
 * RewardPurchaseRepository Port
 *
 * This interface defines operations for reward purchases.
 */
export interface RewardPurchaseRepository {
  /**
   * Create a new purchase
   */
  create(purchase: RewardPurchase): Promise<RewardPurchase>;

  /**
   * Find purchase by ID
   */
  findById(id: string): Promise<RewardPurchase | null>;

  /**
   * Find purchases by reward ID
   */
  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>>;

  /**
   * Find purchases by group ID
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>>;

  /**
   * Find all purchases for a trip
   */
  findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>>;

  /**
   * Update purchase status
   */
  updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Promise<RewardPurchase>;

  /**
   * Count purchases for a reward
   */
  countByRewardId(rewardId: RewardId): Promise<number>;
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
  calculateTotalAvailablePoints(tripId: string): Promise<number>;
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
  getBalance(groupId: string): Promise<number>;

  /**
   * Deduct coins from a group (atomic)
   * Returns error if insufficient funds
   */
  deductCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void>;

  /**
   * Add coins to a group (atomic)
   * Used for refunds
   */
  addCoins(
    groupId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<void>;
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
  ): Promise<{
    isLeader: boolean;
    groupId?: string;
    groupName?: string;
    coins?: number;
  }>;

  /**
   * Check if user is staff (admin or moderator)
   */
  isStaff(userId: string): Promise<boolean>;

  /**
   * Check if trip has ended
   */
  hasTripEnded(tripId: string): Promise<boolean>;
}
