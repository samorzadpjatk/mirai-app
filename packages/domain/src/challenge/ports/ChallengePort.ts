import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { Challenge } from "../entities/Challenge";
import type { ChallengeId } from "../value-objects/ChallengeId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Challenge Repository Port
 *
 * Defines the interface for challenge persistence operations.
 */
export interface IChallengePort {
  /**
   * Find challenge by ID
   */
  findById(
    id: ChallengeId,
  ): Effect.Effect<Challenge | null, DatabaseError, never>;

  /**
   * Find challenges by trip
   */
  findByTripId(
    tripId: TripId,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find active challenges for a trip
   */
  findActiveByTripId(
    tripId: TripId,
    atDate?: Date,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Create new challenge
   */
  create(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;

  /**
   * Update existing challenge
   */
  update(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;

  /**
   * Delete challenge by ID
   */
  delete(id: ChallengeId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if challenge exists
   */
  exists(id: ChallengeId): Effect.Effect<boolean, DatabaseError, never>;
}
