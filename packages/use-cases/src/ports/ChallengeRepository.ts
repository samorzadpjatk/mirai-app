import type {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

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
  create(challenge: Challenge): Promise<Challenge>;

  /**
   * Find challenge by ID
   * @returns Challenge or null if not found
   */
  findById(id: string): Promise<Challenge | null>;

  /**
   * Find all challenges for a trip
   */
  findByTripId(tripId: string): Promise<Challenge[]>;

  /**
   * Find challenges by status
   */
  findByStatus(status: ChallengeStatus): Promise<Challenge[]>;

  /**
   * Find challenges for a trip by status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Promise<Challenge[]>;

  /**
   * Find challenges by submission type
   */
  findBySubmissionType(type: SubmissionType): Promise<Challenge[]>;

  /**
   * Find challenges by scoring category
   */
  findByScoringCategory(category: ScoringCategory): Promise<Challenge[]>;

  /**
   * Find active challenges (status = ACTIVE)
   */
  findActive(): Promise<Challenge[]>;

  /**
   * Find open challenges (status = ACTIVE and within time window)
   */
  findOpenForSubmission(): Promise<Challenge[]>;

  /**
   * Find recurring challenges
   */
  findRecurring(): Promise<Challenge[]>;

  /**
   * Find all challenges with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<Challenge[]>;

  /**
   * Update challenge
   */
  update(challenge: Challenge): Promise<Challenge>;

  /**
   * Update challenge status
   */
  updateStatus(id: string, status: ChallengeStatus): Promise<Challenge>;

  /**
   * Delete challenge
   */
  delete(id: string): Promise<void>;

  /**
   * Check if challenge exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count challenges for a trip
   */
  countByTripId(tripId: string): Promise<number>;
}

/**
 * ChallengeRepository Context.Tag for Effect dependency injection
 */
export class ChallengeRepositoryTag extends Context.Tag("ChallengeRepository")<
  ChallengeRepositoryTag,
  {
    create: (challenge: Challenge) => Effect.Effect<Challenge, never, never>;
    findById: (id: string) => Effect.Effect<Challenge | null, never, never>;
    findByTripId: (tripId: string) => Effect.Effect<Challenge[], never, never>;
    findByStatus: (
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge[], never, never>;
    findByTripIdAndStatus: (
      tripId: string,
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge[], never, never>;
    findBySubmissionType: (
      type: SubmissionType,
    ) => Effect.Effect<Challenge[], never, never>;
    findByScoringCategory: (
      category: ScoringCategory,
    ) => Effect.Effect<Challenge[], never, never>;
    findActive: () => Effect.Effect<Challenge[], never, never>;
    findOpenForSubmission: () => Effect.Effect<Challenge[], never, never>;
    findRecurring: () => Effect.Effect<Challenge[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Challenge[], never, never>;
    update: (challenge: Challenge) => Effect.Effect<Challenge, never, never>;
    updateStatus: (
      id: string,
      status: ChallengeStatus,
    ) => Effect.Effect<Challenge, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    countByTripId: (tripId: string) => Effect.Effect<number, never, never>;
  }
>() {}
