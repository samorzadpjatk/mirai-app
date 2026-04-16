import type { RewardId, PurchaseId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions, PaginatedResult } from "../../system/shared/dto";
import type {
  RewardDTO,
  RewardPurchaseDTO,
  RewardPaginatedResult,
  PurchasePaginatedResult,
} from "../dto";
import type { DatabaseError } from "./errors";

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
   * Find all rewards for a trip
   */
  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<RewardPaginatedResult, DatabaseError, never>;

  /**
   * Find all visible (not hidden) rewards for a trip
   */
  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<RewardPaginatedResult, DatabaseError, never>;

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
   * Find purchases by reward ID
   */
  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never>;

  /**
   * Find purchases by group ID
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never>;

  /**
   * Find all purchases for a trip
   */
  findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never>;

  /**
   * Update purchase status
   */
  updateStatus(
    id: PurchaseId,
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
