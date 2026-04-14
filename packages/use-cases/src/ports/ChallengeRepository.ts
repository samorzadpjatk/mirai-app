import type {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

/**
 * ChallengeRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge repository implementation.
 */
export interface ChallengeRepository {
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
   * Find all challenges for a trip
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find challenges by status
   */
  findByStatus(
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find challenges for a trip by status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find challenges by submission type
   */
  findBySubmissionType(
    type: SubmissionType,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find challenges by scoring category
   */
  findByScoringCategory(
    category: ScoringCategory,
  ): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find active challenges (status = ACTIVE)
   */
  findActive(): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find open challenges (status = ACTIVE and within time window)
   */
  findOpenForSubmission(): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find recurring challenges
   */
  findRecurring(): Effect.Effect<Challenge[], DatabaseError, never>;

  /**
   * Find all challenges with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Challenge[], DatabaseError, never>;

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
}

/**
 * ChallengeRepository Context.Tag for Effect dependency injection
 */
export class ChallengeRepositoryTag extends Context.Tag("ChallengeRepository")<
  ChallengeRepositoryTag,
  {
    create: (
      challenge: Challenge,
    ) => Effect.Effect<Challenge, DatabaseError, never>;
    findById: (
      id: string,
    ) => Effect.Effect<Challenge | null, DatabaseError, never>;
    findByTripId: (
      tripId: string,
    ) => Effect.Effect<Challenge[], DatabaseError, never>;
    findByStatus: (
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge[], DatabaseError, never>;
    findByTripIdAndStatus: (
      tripId: string,
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge[], DatabaseError, never>;
    findBySubmissionType: (
      type: SubmissionType,
    ) => Effect.Effect<Challenge[], DatabaseError, never>;
    findByScoringCategory: (
      category: ScoringCategory,
    ) => Effect.Effect<Challenge[], DatabaseError, never>;
    findActive: () => Effect.Effect<Challenge[], DatabaseError, never>;
    findOpenForSubmission: () => Effect.Effect<
      Challenge[],
      DatabaseError,
      never
    >;
    findRecurring: () => Effect.Effect<Challenge[], DatabaseError, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Challenge[], DatabaseError, never>;
    update: (
      challenge: Challenge,
    ) => Effect.Effect<Challenge, DatabaseError, never>;
    updateStatus: (
      id: string,
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge, DatabaseError, never>;
    delete: (id: string) => Effect.Effect<void, DatabaseError, never>;
    exists: (id: string) => Effect.Effect<boolean, DatabaseError, never>;
    countByTripId: (
      tripId: string,
    ) => Effect.Effect<number, DatabaseError, never>;
  }
>() {}
