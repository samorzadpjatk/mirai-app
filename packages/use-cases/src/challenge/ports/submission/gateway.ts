import type { SubmissionId, SubmissionStatus } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import type {
  ChallengeSubmissionDTO,
  SubmissionPaginatedResult,
} from "../../dto";

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
   * Find submissions by challenge ID with pagination
   */
  findByChallengeId(
    challengeId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<SubmissionPaginatedResult, DatabaseError, never>;

  /**
   * Find submissions by user ID with pagination
   */
  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<SubmissionPaginatedResult, DatabaseError, never>;

  /**
   * Find submissions by status
   */
  findByStatus(
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never>;

  /**
   * Find submissions with advanced filtering
   */
  findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never>;

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
}

/**
 * ChallengeSubmissionGateway Context.Tag for Effect dependency injection
 */
export class ChallengeSubmissionGatewayTag extends Context.Tag(
  "ChallengeSubmissionGateway",
)<ChallengeSubmissionGatewayTag, ChallengeSubmissionGateway>() {}
