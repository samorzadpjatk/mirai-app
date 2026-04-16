import type { ChallengeSubmission } from "../entities/challenge-submission";
import type { SubmissionStatus } from "../../challenge/enums";
import type { SubmissionId } from "../value-objects/submission-id";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for challenge submission pagination by createdAt
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface ChallengeSubmissionCreatedAtCursorData {
  id: string;
  createdAt: string;
}

/**
 * Cursor data for challenge submission pagination by voteScore
 * Uses voteScore as the primary sort field with id as tiebreaker
 */
export interface ChallengeSubmissionVoteScoreCursorData {
  id: string;
  createdAt: string;
  voteScore: number;
}

/**
 * Arguments for challenge submission connection pagination by createdAt
 */
export interface ChallengeSubmissionCreatedAtConnectionArgs {
  first?: number;
  after?: ChallengeSubmissionCreatedAtCursorData | null;
}

/**
 * Arguments for challenge submission connection pagination by voteScore
 */
export interface ChallengeSubmissionVoteScoreConnectionArgs {
  first?: number;
  after?: ChallengeSubmissionVoteScoreCursorData | null;
}

/**
 * ChallengeSubmissionGateway Port
 *
 * This interface defines what operations the application needs
 * from any challenge submission gateway implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeSubmissionGateway: Uses Drizzle ORM
 * - InMemoryChallengeSubmissionGateway: For testing
 */
export interface ChallengeSubmissionGateway {
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find submissions by challenge ID with cursor-based pagination
   * Uses (voteScore, id) sort for peer voting challenges, (createdAt, id) for others
   * When sorted by voteScore, returns highest scoring submissions first
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeSubmissionVoteScoreConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmission>, DatabaseError, never>;

  /**
   * Find submissions by challenge ID with cursor-based pagination sorted by createdAt
   * Uses (createdAt, id) sort for chronological ordering
   */
  findByChallengeIdByCreatedAtConnection(
    challengeId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmission>, DatabaseError, never>;

  /**
   * Find all submissions by a group with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmission>, DatabaseError, never>;

  /**
   * Find submissions by status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByStatusConnection(
    status: SubmissionStatus,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmission>, DatabaseError, never>;

  /**
   * Find submissions with advanced filtering and cursor-based pagination
   * Uses (voteScore, id) or (createdAt, id) sort depending on params.orderBy
   */
  findManyConnection(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    first?: number;
    after?:
      | ChallengeSubmissionCreatedAtCursorData
      | ChallengeSubmissionVoteScoreCursorData
      | null;
  }): Effect.Effect<Connection<ChallengeSubmission>, DatabaseError, never>;
}
