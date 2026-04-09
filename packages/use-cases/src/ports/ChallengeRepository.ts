import type {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

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
