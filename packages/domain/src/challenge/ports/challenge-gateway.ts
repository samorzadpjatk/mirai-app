import type { Challenge } from "../entities/challenge";
import type {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "../../challenge/enums";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for challenge pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface ChallengeCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for challenge connection pagination
 */
export interface ChallengeConnectionArgs {
  first?: number;
  after?: ChallengeCursorData | null;
}

/**
 * ChallengeGateway Port
 *
 * This interface defines what operations the application needs
 * from any challenge gateway implementation.
 */
export interface ChallengeGateway {
  /**
   * Create a new challenge
   */
  create(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;

  /**
   * Find challenge by ID
   * @returns Challenge or null if not found
   */
  findById(id: string): Effect.Effect<Challenge | null, DatabaseError, never>;

  /**
   * Update challenge
   */
  update(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never>;

  /**
   * Update challenge status
   */
  updateStatus(
    id: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge, DatabaseError, never>;

  /**
   * Delete challenge
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if challenge exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count challenges for a trip
   */
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find challenges by trip ID with cursor-based pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find challenges by status with cursor-based pagination
   */
  findByStatusConnection(
    status: ChallengeStatus,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find challenges for a trip by status with cursor-based pagination
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: ChallengeStatus,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find challenges by submission type with cursor-based pagination
   */
  findBySubmissionTypeConnection(
    type: SubmissionType,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find challenges by scoring category with cursor-based pagination
   */
  findByScoringCategoryConnection(
    category: ScoringCategory,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find active challenges with cursor-based pagination
   */
  findActiveConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find open challenges with cursor-based pagination
   */
  findOpenForSubmissionConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find recurring challenges with cursor-based pagination
   */
  findRecurringConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;

  /**
   * Find all challenges with cursor-based pagination
   */
  findAllConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<Challenge>, DatabaseError, never>;
}
