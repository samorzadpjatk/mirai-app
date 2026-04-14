import type { ChallengeVote } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

/**
 * ChallengeVoteRepository Port
 *
 * This interface defines what operations the application needs
 * from any challenge vote repository implementation.
 *
 * Implementations (in adapters layer):
 * - DrizzleChallengeVoteRepository: Uses Drizzle ORM
 * - InMemoryChallengeVoteRepository: For testing
 */
export interface ChallengeVoteRepository {
  /**
   * Create a new vote
   */
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never>;

  /**
   * Create multiple votes in a batch
   */
  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;

  /**
   * Find vote by ID
   * @returns Vote or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never>;

  /**
   * Find all votes for a challenge
   */
  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;

  /**
   * Find all votes by a specific voter in a challenge
   */
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;

  /**
   * Find all votes for a specific submission
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never>;

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
 * ChallengeVoteRepository Context.Tag for Effect dependency injection
 */
export class ChallengeVoteRepositoryTag extends Context.Tag(
  "ChallengeVoteRepository",
)<
  ChallengeVoteRepositoryTag,
  {
    create: (
      vote: ChallengeVote,
    ) => Effect.Effect<ChallengeVote, DatabaseError, never>;
    createMany: (
      votes: ChallengeVote[],
    ) => Effect.Effect<ChallengeVote[], DatabaseError, never>;
    findById: (
      id: string,
    ) => Effect.Effect<ChallengeVote | null, DatabaseError, never>;
    findByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<ChallengeVote[], DatabaseError, never>;
    findByChallengeAndVoter: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<ChallengeVote[], DatabaseError, never>;
    findBySubmissionId: (
      submissionId: string,
    ) => Effect.Effect<ChallengeVote[], DatabaseError, never>;
    hasVoted: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<boolean, DatabaseError, never>;
    hasVotedForPosition: (
      challengeId: string,
      voterId: string,
      position: number,
    ) => Effect.Effect<boolean, DatabaseError, never>;
    getVotedPositions: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<number[], DatabaseError, never>;
    delete: (id: string) => Effect.Effect<void, DatabaseError, never>;
    deleteByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<void, DatabaseError, never>;
  }
>() {}
