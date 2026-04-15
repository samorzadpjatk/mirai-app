import type { ChallengeSubmission } from "../../entities/challenge/ChallengeSubmission";
import type { SubmissionStatus } from "../../enums/challenge";
import type { SubmissionId } from "../../value-objects/SubmissionId";
import type { Effect } from "effect";
import type { DatabaseError } from "../database-error";

/**
 * ChallengeSubmissionRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge submission repository implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeSubmissionGateway: Uses Prisma ORM
 * - InMemoryChallengeSubmissionGateway: For testing
 */
export interface ChallengeSubmissionRepository {
  /**
   * Create a new challenge submission
   */
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never>;

  /**
   * Find submission by ID
   * @returns Submission or null if not found
   */
  findById(
    id: SubmissionId,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never>;

  /**
   * Find submission by challenge ID and group ID
   * @returns Submission or null if not found
   */
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never>;

  /**
   * Find all submissions for a challenge
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;

  /**
   * Find all submissions by a group
   */
  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;

  /**
   * Find submissions by status
   */
  findByStatus(
    status: SubmissionStatus,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;

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
  }): Effect.Effect<ChallengeSubmission[], DatabaseError, never>;

  /**
   * Update submission
   */
  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never>;

  /**
   * Delete submission
   */
  delete(id: SubmissionId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if submission exists for challenge and group
   */
  existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count submissions for a challenge
   */
  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count submissions by status for a challenge
   */
  countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Effect.Effect<number, DatabaseError, never>;
}
