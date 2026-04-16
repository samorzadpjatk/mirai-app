import type { ChallengeId, DatabaseError, Connection } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengePaginatedResult,
} from "../dto";

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
 * ChallengeGateway Port
 *
 * This interface defines what operations the application needs
 * from any challenge gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeGateway: Uses Drizzle ORM
 * - InMemoryChallengeGateway: For testing
 */
export interface ChallengeGateway {
  /**
   * Create a new challenge
   */
  create(
    challenge: ChallengeDTO,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never>;

  /**
   * Find challenge by ID
   * @returns ChallengeDTO or null if not found
   */
  findById(
    id: ChallengeId,
  ): Effect.Effect<ChallengeDTO | null, DatabaseError, never>;

  /**
   * Update challenge
   */
  update(
    challenge: ChallengeDTO,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never>;

  /**
   * Update challenge status
   */
  updateStatus(
    id: ChallengeId,
    status: string,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never>;

  /**
   * Delete challenge
   */
  delete(id: ChallengeId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if challenge exists
   */
  exists(id: ChallengeId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count challenges by trip
   */
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;

  // ===== Cursor-based Connection Methods =====

  /**
   * Find challenges by trip ID with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find challenges by status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByStatusConnection(
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find challenges by trip ID and status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find challenges by submission type with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findBySubmissionTypeConnection(
    type: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find challenges by scoring category with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByScoringCategoryConnection(
    category: string,
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find active challenges with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findActiveConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find challenges open for submission with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findOpenForSubmissionConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find recurring challenges with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findRecurringConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;

  /**
   * Find all challenges with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findAllConnection(
    args: ChallengeConnectionArgs,
  ): Effect.Effect<Connection<ChallengeDTO>, DatabaseError, never>;
}

/**
 * ChallengeSubmissionGateway Port
 *
 * This interface defines operations for challenge submissions.
 */
export interface ChallengeSubmissionGateway {
  /**
   * Create a new submission
   */
  create(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never>;

  /**
   * Find submission by ID
   */
  findById(
    id: string,
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
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if submission exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

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
 * ChallengeGateway Context.Tag for Effect dependency injection
 */
export class ChallengeGatewayTag extends Context.Tag("ChallengeGateway")<
  ChallengeGatewayTag,
  ChallengeGateway
>() {}

/**
 * ChallengeSubmissionGateway Context.Tag for Effect dependency injection
 */
export class ChallengeSubmissionGatewayTag extends Context.Tag(
  "ChallengeSubmissionGateway",
)<ChallengeSubmissionGatewayTag, ChallengeSubmissionGateway>() {}
