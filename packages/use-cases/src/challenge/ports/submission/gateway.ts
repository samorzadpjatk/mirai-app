import type { SubmissionId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import type {
  ChallengeSubmissionDTO,
  SubmissionPaginatedResult,
  ChallengeSubmissionCreatedAtCursorData,
  ChallengeSubmissionVoteScoreCursorData,
} from "../../dto";
import type { Connection } from "@mirai-app/domain";

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
 * All methods return ChallengeSubmissionDTOs instead of domain entities.
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
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never>;

  /**
   * Find submission by ID
   * @returns SubmissionDTO or null if not found
   */
  findById(
    id: SubmissionId,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never>;

  /**
   * Find submission by challenge ID and group ID
   * @returns SubmissionDTO or null if not found
   */
  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never>;

  /**
   * Update submission
   */
  update(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never>;

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
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<number, DatabaseError, never>;

  // ============================================================================
  // Simple array methods (non-paginated)
  // ============================================================================

  /**
   * Find all submissions for a challenge (simple array version)
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never>;

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find submissions by challenge ID with cursor-based pagination
   * Uses (voteScore, id) sort for peer voting challenges
   * Returns highest scoring submissions first
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeSubmissionVoteScoreConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never>;

  /**
   * Find submissions by challenge ID with cursor-based pagination sorted by createdAt
   * Uses (createdAt, id) sort for chronological ordering
   */
  findByChallengeIdByCreatedAtConnection(
    challengeId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never>;

  /**
   * Find all submissions by a group with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never>;

  /**
   * Find submissions by status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByStatusConnection(
    status: "PENDING" | "APPROVED" | "REJECTED",
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never>;

  /**
   * Find submissions with advanced filtering and cursor-based pagination
   * Uses (voteScore, id) or (createdAt, id) sort depending on params.orderBy
   */
  findManyConnection(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    first?: number;
    after?:
      | ChallengeSubmissionCreatedAtCursorData
      | ChallengeSubmissionVoteScoreCursorData
      | null;
  }): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never>;
}

/**
 * ChallengeSubmissionGateway Context.Tag for Effect dependency injection
 */
export class ChallengeSubmissionGatewayTag extends Context.Tag(
  "ChallengeSubmissionGateway",
)<ChallengeSubmissionGatewayTag, ChallengeSubmissionGateway>() {}
