import type {
  ChallengeSubmission,
  SubmissionId,
  SubmissionStatus,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * ChallengeSubmissionRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge submission repository implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeSubmissionRepository: Uses Prisma ORM
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

/**
 * ChallengeSubmissionRepository Context.Tag for Effect dependency injection
 */
export class ChallengeSubmissionRepositoryTag extends Context.Tag(
  "ChallengeSubmissionRepository",
)<
  ChallengeSubmissionRepositoryTag,
  {
    create: (
      submission: ChallengeSubmission,
    ) => Effect.Effect<ChallengeSubmission, never, never>;
    findById: (
      id: SubmissionId,
    ) => Effect.Effect<ChallengeSubmission | null, never, never>;
    findByChallengeAndGroup: (
      challengeId: string,
      groupId: string,
    ) => Effect.Effect<ChallengeSubmission | null, never, never>;
    findByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<ChallengeSubmission[], never, never>;
    findByGroupId: (
      groupId: string,
    ) => Effect.Effect<ChallengeSubmission[], never, never>;
    findByStatus: (
      status: SubmissionStatus,
    ) => Effect.Effect<ChallengeSubmission[], never, never>;
    findMany: (params: {
      challengeId?: string;
      groupId?: string;
      status?: SubmissionStatus;
      orderBy?: "voteScore" | "createdAt";
      orderDirection?: "asc" | "desc";
      limit?: number;
      offset?: number;
    }) => Effect.Effect<ChallengeSubmission[], never, never>;
    update: (
      submission: ChallengeSubmission,
    ) => Effect.Effect<ChallengeSubmission, never, never>;
    delete: (id: SubmissionId) => Effect.Effect<void, never, never>;
    existsForChallengeAndGroup: (
      challengeId: string,
      groupId: string,
    ) => Effect.Effect<boolean, never, never>;
    countByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<number, never, never>;
    countByChallengeAndStatus: (
      challengeId: string,
      status: SubmissionStatus,
    ) => Effect.Effect<number, never, never>;
  }
>() {}
