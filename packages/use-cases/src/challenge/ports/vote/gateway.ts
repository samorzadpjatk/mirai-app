import { Context, Effect } from "effect";
import type { ChallengeVoteDTO } from "../../dto";
import type { DatabaseError } from "@mirai-app/domain";

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
   * Find all votes for a challenge
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

  /**
   * Find all votes by a specific voter in a challenge
   */
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

  /**
   * Find all votes for a specific submission
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never>;

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
