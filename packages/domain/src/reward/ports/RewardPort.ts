import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { Reward } from "../entities/Reward";
import type { RewardId } from "../value-objects/RewardId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Reward Repository Port
 *
 * Defines the interface for reward persistence operations.
 */
export interface IRewardPort {
  /**
   * Find reward by ID
   */
  findById(id: RewardId): Effect.Effect<Reward | null, DatabaseError, never>;

  /**
   * Find rewards by trip
   */
  findByTripId(tripId: TripId): Effect.Effect<Reward[], DatabaseError, never>;

  /**
   * Find available rewards for a trip
   */
  findAvailableByTripId(
    tripId: TripId,
  ): Effect.Effect<Reward[], DatabaseError, never>;

  /**
   * Create new reward
   */
  create(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;

  /**
   * Update existing reward
   */
  update(reward: Reward): Effect.Effect<Reward, DatabaseError, never>;

  /**
   * Delete reward by ID
   */
  delete(id: RewardId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if reward exists
   */
  exists(id: RewardId): Effect.Effect<boolean, DatabaseError, never>;
}
