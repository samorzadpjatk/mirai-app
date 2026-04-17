import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
  findById(id: RewardId): Effect.Effect<Reward | null, IPortError, never>;

  /**
   * Find rewards by trip
   */
  findByTripId(tripId: TripId): Effect.Effect<Reward[], IPortError, never>;

  /**
   * Find available rewards for a trip
   */
  findAvailableByTripId(
    tripId: TripId,
  ): Effect.Effect<Reward[], IPortError, never>;

  /**
   * Find paginated rewards by trip
   */
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Find all rewards paginated
   */
  findAllPaginated(params: {
    limit: number;
    offset: number;
  }): Effect.Effect<
    { rewards: Reward[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Create new reward
   */
  create(reward: Reward): Effect.Effect<Reward, IPortError, never>;

  /**
   * Update existing reward
   */
  update(reward: Reward): Effect.Effect<Reward, IPortError, never>;

  /**
   * Delete reward by ID
   */
  delete(id: RewardId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if reward exists
   */
  exists(id: RewardId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count rewards by trip
   */
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;
}
