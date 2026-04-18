import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Challenge } from "../entities/Challenge";
import type { ChallengeId } from "../value-objects/ChallengeId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Challenge Repository Port
 *
 * Defines the interface for challenge persistence operations.
 * Auth verification uses AuthContextTag and AuthZPortTag in the Effect context.
 *
 * Note: Methods may require AuthContextTag and AuthZPortTag in the Effect context
 * for authorization checks. Use Effect.provide() to supply these dependencies.
 */
export interface IChallengePort {
  /**
   * Find challenge by ID
   * Authorization via AuthContext (participants can view)
   */
  findById(id: ChallengeId): Effect.Effect<Challenge | null, IPortError, unknown>;

  /**
   * Find challenges by trip
   */
  findByTripId(tripId: TripId): Effect.Effect<Challenge[], IPortError, never>;

  /**
   * Find active challenges for a trip
   */
  findActiveByTripId(
    tripId: TripId,
    atDate?: Date,
  ): Effect.Effect<Challenge[], IPortError, never>;

  /**
   * Find paginated challenges by trip
   */
  findPaginatedByTripId(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { challenges: Challenge[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Create new challenge
   * Authorization via AuthContext (organizers only)
   */
  create(challenge: Challenge): Effect.Effect<Challenge, IPortError, unknown>;

  /**
   * Update existing challenge
   * Authorization via AuthContext (organizers only)
   */
  update(challenge: Challenge): Effect.Effect<Challenge, IPortError, unknown>;

  /**
   * Delete challenge by ID
   * Authorization via AuthContext (organizers only)
   */
  delete(id: ChallengeId): Effect.Effect<void, IPortError, unknown>;

  /**
   * Check if challenge exists
   */
  exists(id: ChallengeId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count challenges by trip
   */
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;

  /**
   * Activate visible challenges
   * @param tripId - Optional trip ID to limit activation to specific trip
   * Authorization via AuthContext (organizers only)
   */
  activateVisibleChallenges(
    tripId?: TripId,
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Find all challenges across all trips (admin only)
   * Authorization via AuthContext (admin only)
   */
  findAll(): Effect.Effect<Challenge[], IPortError, unknown>;
}
