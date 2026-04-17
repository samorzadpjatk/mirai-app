import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
  findById(id: ChallengeId): Effect.Effect<Challenge | null, IPortError, never>;

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
   * Create new challenge
   */
  create(challenge: Challenge): Effect.Effect<Challenge, IPortError, never>;

  /**
   * Update existing challenge
   */
  update(challenge: Challenge): Effect.Effect<Challenge, IPortError, never>;

  /**
   * Delete challenge by ID
   */
  delete(id: ChallengeId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if challenge exists
   */
  exists(id: ChallengeId): Effect.Effect<boolean, IPortError, never>;
}
