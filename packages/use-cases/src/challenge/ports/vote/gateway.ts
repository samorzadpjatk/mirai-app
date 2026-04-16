import { Context, Effect } from "effect";
import type { ChallengeVoteDTO } from "../../dto";
import type { DatabaseError, Connection } from "@mirai-app/domain";

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
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeVoteGateway: Uses Drizzle ORM
 * - InMemoryChallengeVoteGateway: For testing
 */
export interface ChallengeVoteGateway {
  /**
   * Create a new vote
   */
  create(
    vote: ChallengeVoteDTO,
  ): Effect.Effect<ChallengeVoteDTO, DatabaseError, never>;

  /**
   * Create multiple votes in a batch
   */
  createMany(
    votes: ChallengeVoteDTO[],
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

  /**
   * Find vote by ID
   * @returns VoteDTO or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<ChallengeVoteDTO | null, DatabaseError, never>;

  /**
   * Find all votes for a challenge (simple array version)
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

  /**
   * Find all votes for a challenge with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never>;

  /**
   * Find all votes by a specific voter in a challenge
   */
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

  /**
   * Find all votes by a specific voter in a challenge with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByChallengeAndVoterConnection(
    challengeId: string,
    voterId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never>;

  /**
   * Find all votes for a specific submission with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, DatabaseError, never>;

  /**
   * Check if a voter has already voted in a challenge
   */
  hasVoted(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Get vote positions filled by a voter in a challenge
   */
  getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<number[], DatabaseError, never>;

  /**
   * Delete a vote
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete all votes for a challenge (useful for testing/reset)
   */
  deleteByChallengeId(
    challengeId: string,
  ): Effect.Effect<void, DatabaseError, never>;
}

/**
 * ChallengeVoteGateway Context.Tag for Effect dependency injection
 */
export class ChallengeVoteGatewayTag extends Context.Tag(
  "ChallengeVoteGateway",
)<ChallengeVoteGatewayTag, ChallengeVoteGateway>() {}
