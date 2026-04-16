import type { ChallengeVote } from "../entities/challenge-vote";
import type { ChallengeVoteId } from "../value-objects/vote-id";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for challenge vote pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface ChallengeVoteCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for challenge vote connection pagination
 */
export interface ChallengeVoteConnectionArgs {
  first?: number;
  after?: ChallengeVoteCursorData | null;
}

/**
 * ChallengeVoteGateway Port
 *
 * This interface defines what operations the application needs
 * from any challenge vote gateway implementation.
 */
export interface ChallengeVoteGateway {
  /**
   * Create a new vote
   */
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never>;

  /**
   * Find vote by ID
   * @returns Vote or null if not found
   */
  findById(
    id: ChallengeVoteId,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never>;

  /**
   * Find votes by submission ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVote>, DatabaseError, never>;

  /**
   * Find votes by user ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByUserIdConnection(
    userId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVote>, DatabaseError, never>;

  /**
   * Find votes by challenge ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVote>, DatabaseError, never>;

  /**
   * Check if user has voted on a submission
   */
  hasUserVoted(
    userId: string,
    submissionId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Find vote by user and submission
   */
  findByUserAndSubmission(
    userId: string,
    submissionId: string,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never>;

  /**
   * Update vote
   */
  update(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never>;

  /**
   * Delete vote
   */
  delete(id: ChallengeVoteId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Count votes for a submission
   */
  countBySubmissionId(
    submissionId: string,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count votes by position for a submission
   */
  countBySubmissionAndPosition(
    submissionId: string,
    position: string,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Calculate vote score for a submission (weighted by vote weight)
   */
  calculateVoteScore(
    submissionId: string,
  ): Effect.Effect<number, DatabaseError, never>;
}
