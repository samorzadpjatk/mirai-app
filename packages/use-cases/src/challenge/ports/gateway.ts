import type { ChallengeId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type {
  ChallengeDTO,
  ChallengeSubmissionDTO,
  ChallengePaginatedResult,
  SubmissionPaginatedResult,
} from "../dto";
import type { DatabaseError } from "./errors";

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
   * Find challenges by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never>;

  /**
   * Find challenges by status
   */
  findByStatus(
    status: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never>;

  /**
   * Find active challenges
   */
  findActive(): Effect.Effect<ChallengeDTO[], DatabaseError, never>;

  /**
   * Find all challenges with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengePaginatedResult, DatabaseError, never>;

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
   * Find submissions by challenge ID
   */
  findByChallengeId(
    challengeId: ChallengeId,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<SubmissionPaginatedResult, DatabaseError, never>;

  /**
   * Find submissions by user ID
   */
  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<SubmissionPaginatedResult, DatabaseError, never>;

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
