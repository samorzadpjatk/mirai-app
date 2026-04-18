import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Reward } from "../entities/Reward";
import type { RewardId } from "../value-objects/RewardId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Reward Repository Port
 *
 * Defines the interface for reward persistence operations.
 * AuthContext is used for authorization instead of token parameters.
 *
 * Note: Methods may require AuthContextTag and AuthZPortTag in the Effect context
 * for authorization checks. Use Effect.provide() to supply these dependencies.
 */
export interface IRewardPort {
  /**
   * Find reward by ID
   * Authorization via AuthContext (participants can view)
   */
  findById(id: RewardId): Effect.Effect<Reward | null, IPortError, unknown>;

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
   * Authorization via AuthContext (organizers only)
   */
  create(reward: Reward): Effect.Effect<Reward, IPortError, unknown>;

  /**
   * Update existing reward
   * Authorization via AuthContext (organizers only)
   */
  update(reward: Reward): Effect.Effect<Reward, IPortError, unknown>;

  /**
   * Delete reward by ID
   * @param tripId - Trip ID for auth verification
   * Authorization via AuthContext (organizers only)
   */
  delete(
    id: RewardId,
    tripId: TripId,
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Check if reward exists
   */
  exists(id: RewardId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count rewards by trip
   */
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;
}
