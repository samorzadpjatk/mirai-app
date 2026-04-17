import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { RewardPurchase } from "../entities/RewardPurchase";
import type { RewardPurchaseId } from "../value-objects/RewardId";
import type { RewardId } from "../value-objects/RewardId";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Reward Purchase Repository Port
 *
 * Defines the interface for reward purchase persistence operations.
 */
export interface IRewardPurchasePort {
  /**
   * Find purchase by ID
   */
  findById(
    id: RewardPurchaseId,
  ): Effect.Effect<RewardPurchase | null, DatabaseError, never>;

  /**
   * Find purchases by reward
   */
  findByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;

  /**
   * Find purchases by group
   */
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;

  /**
   * Find purchases by trip
   */
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never>;

  /**
   * Find paginated purchases by trip
   */
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;

  /**
   * Find paginated purchases by trip and group
   */
  findPaginatedByTripIdAndGroupId(
    tripId: TripId,
    groupId: GroupId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { purchases: RewardPurchase[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;

  /**
   * Create new purchase
   */
  create(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;

  /**
   * Update existing purchase
   */
  update(
    purchase: RewardPurchase,
  ): Effect.Effect<RewardPurchase, DatabaseError, never>;

  /**
   * Delete purchase by ID
   */
  delete(id: RewardPurchaseId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if purchase exists
   */
  exists(id: RewardPurchaseId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count purchases by reward
   */
  countByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count purchases by trip
   */
  countByTripId(tripId: TripId): Effect.Effect<number, DatabaseError, never>;
}
