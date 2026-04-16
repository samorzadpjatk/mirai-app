import type {
  RewardId,
  RewardPurchaseId,
  Connection,
  DatabaseError,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type {
  PaginationOptions,
  PaginatedResult,
} from "../../system/shared/dto";
import type {
  RewardDTO,
  RewardPurchaseDTO,
  RewardPaginatedResult,
  PurchasePaginatedResult,
} from "../dto";

/**
 * PurchaseId type for reward purchases
 */
export type PurchaseId = string;

/**
 * Cursor data for reward pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface RewardCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for reward connection pagination
 */
export interface RewardConnectionArgs {
  first?: number;
  after?: RewardCursorData | null;
}

/**
 * Cursor data for reward purchase pagination
 * Uses purchasedAt as the primary sort field with id as tiebreaker
 */
export interface RewardPurchaseCursorData {
  id: string;
  purchasedAt: string;
}

/**
 * Arguments for reward purchase connection pagination
 */
export interface RewardPurchaseConnectionArgs {
  first?: number;
  after?: RewardPurchaseCursorData | null;
}

/**
 * RewardGateway Port
 *
 * This interface defines what operations the application needs
 * from any reward gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleRewardGateway: Uses Drizzle ORM
 * - InMemoryRewardGateway: For testing
 */
export interface RewardGateway {
  /**
   * Create a new reward
   */
  create(reward: RewardDTO): Effect.Effect<RewardDTO, DatabaseError, never>;

  /**
   * Find reward by ID
   * @returns RewardDTO or null if not found
   */
  findById(id: RewardId): Effect.Effect<RewardDTO | null, DatabaseError, never>;

  /**
   * Find rewards by trip ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: RewardConnectionArgs,
  ): Effect.Effect<Connection<RewardDTO>, DatabaseError, never>;

  /**
   * Find visible rewards by trip ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findVisibleByTripIdConnection(
    tripId: string,
    args: RewardConnectionArgs,
  ): Effect.Effect<Connection<RewardDTO>, DatabaseError, never>;

  /**
   * Update reward
   */
  update(reward: RewardDTO): Effect.Effect<RewardDTO, DatabaseError, never>;

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
  ): Effect.Effect<RewardDTO, DatabaseError, never>;

  /**
   * Increment available quantity (atomic operation)
   * Used during refund/cancellation
   */
  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<RewardDTO, DatabaseError, never>;
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
    purchase: RewardPurchaseDTO,
  ): Effect.Effect<RewardPurchaseDTO, DatabaseError, never>;

  /**
   * Find purchase by ID
   */
  findById(
    id: PurchaseId,
  ): Effect.Effect<RewardPurchaseDTO | null, DatabaseError, never>;

  /**
   * Find purchases by reward ID with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByRewardIdConnection(
    rewardId: RewardId,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never>;

  /**
   * Find purchases by group ID with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never>;

  /**
   * Find all purchases for a trip with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never>;

  /**
   * Update purchase status
   */
  updateStatus(
    id: RewardPurchaseId,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Effect.Effect<RewardPurchaseDTO, DatabaseError, never>;

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
 * RewardGateway Context.Tag for Effect dependency injection
 */
export class RewardGatewayTag extends Context.Tag("RewardGateway")<
  RewardGatewayTag,
  RewardGateway
>() {}

/**
 * RewardPurchaseGateway Context.Tag for Effect dependency injection
 */
export class RewardPurchaseGatewayTag extends Context.Tag(
  "RewardPurchaseGateway",
)<RewardPurchaseGatewayTag, RewardPurchaseGateway>() {}

/**
 * TripPointsCalculator Context.Tag for Effect dependency injection
 */
export class TripPointsCalculatorTag extends Context.Tag(
  "TripPointsCalculator",
)<TripPointsCalculatorTag, TripPointsCalculator>() {}
