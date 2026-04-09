import type {
  ChallengeSubmission,
  SubmissionId,
  SubmissionStatus,
} from "@mirai-app/domain";

/**
 * ChallengeSubmissionRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge submission repository implementation.
 *
 * Implementations (in adapters layer):
 * - PrismaChallengeSubmissionRepository: Uses Prisma ORM
 * - InMemoryChallengeSubmissionRepository: For testing
 */
export interface ChallengeSubmissionRepository {
  /**
   * Create a new challenge submission
   */
  create(submission: ChallengeSubmission): Promise<ChallengeSubmission>;

  /**
   * Find submission by ID
   * @returns Submission or null if not found
   */
  findById(id: SubmissionId): Promise<ChallengeSubmission | null>;

  /**
   * Find submission by challenge ID and group ID
   * @returns Submission or null if not found
   */
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<ChallengeSubmission | null>;

  /**
   * Find all submissions for a challenge
   */
  findByChallengeId(challengeId: string): Promise<ChallengeSubmission[]>;

  /**
   * Find all submissions by a group
   */
  findByGroupId(groupId: string): Promise<ChallengeSubmission[]>;

  /**
   * Find submissions by status
   */
  findByStatus(status: SubmissionStatus): Promise<ChallengeSubmission[]>;

  /**
   * Find submissions with advanced filtering
   */
  findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Promise<ChallengeSubmission[]>;

  /**
   * Update submission
   */
  update(submission: ChallengeSubmission): Promise<ChallengeSubmission>;

  /**
   * Delete submission
   */
  delete(id: SubmissionId): Promise<void>;

  /**
   * Check if submission exists for challenge and group
   */
  existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<boolean>;

  /**
   * Count submissions for a challenge
   */
  countByChallengeId(challengeId: string): Promise<number>;

  /**
   * Count submissions by status for a challenge
   */
  countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Promise<number>;
}
