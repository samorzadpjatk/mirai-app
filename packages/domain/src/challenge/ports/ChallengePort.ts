import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Challenge } from "../entities/Challenge";
import type { ChallengeId } from "../value-objects/ChallengeId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Challenge Repository Port
 *
 * Defines the interface for challenge persistence operations.
 * Methods with auth support can accept an optional authToken.
 * The context type R will be inferred from the implementation.
 */
export interface IChallengePort {
  /**
   * Find challenge by ID
   * @param id - Challenge ID
   * @param authToken - Optional auth token for access verification
   */
  findById(
    id: ChallengeId,
    authToken?: string,
  ): Effect.Effect<Challenge | null, IPortError, never>;

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
   * @param challenge - Challenge to create
   * @param authToken - Optional auth token for access verification
   */
  create(
    challenge: Challenge,
    authToken?: string,
  ): Effect.Effect<Challenge, IPortError, never>;

  /**
   * Update existing challenge
   * @param challenge - Challenge to update
   * @param authToken - Optional auth token for access verification
   */
  update(
    challenge: Challenge,
    authToken?: string,
  ): Effect.Effect<Challenge, IPortError, never>;

  /**
   * Delete challenge by ID
   * @param id - Challenge ID
   * @param authToken - Optional auth token for access verification
   */
  delete(id: ChallengeId, authToken?: string): Effect.Effect<void, IPortError, never>;

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
   * @param authToken - Optional auth token for access verification
   */
  activateVisibleChallenges(
    tripId?: TripId,
    authToken?: string,
  ): Effect.Effect<void, IPortError, never>;
}
