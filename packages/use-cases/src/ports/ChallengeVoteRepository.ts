import type { ChallengeVote } from "@mirai-app/domain";
import { Context, Effect } from "effect";

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
  create(vote: ChallengeVote): Promise<ChallengeVote>;

  /**
   * Create multiple votes in a batch
   */
  createMany(votes: ChallengeVote[]): Promise<ChallengeVote[]>;

  /**
   * Find vote by ID
   * @returns Vote or null if not found
   */
  findById(id: string): Promise<ChallengeVote | null>;

  /**
   * Find all votes for a challenge
   */
  findByChallengeId(challengeId: string): Promise<ChallengeVote[]>;

  /**
   * Find all votes by a specific voter in a challenge
   */
  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Promise<ChallengeVote[]>;

  /**
   * Find all votes for a specific submission
   */
  findBySubmissionId(submissionId: string): Promise<ChallengeVote[]>;

  /**
   * Check if a voter has already voted in a challenge
   */
  hasVoted(challengeId: string, voterId: string): Promise<boolean>;

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Promise<boolean>;

  /**
   * Get vote positions filled by a voter in a challenge
   */
  getVotedPositions(challengeId: string, voterId: string): Promise<number[]>;

  /**
   * Delete a vote
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all votes for a challenge (useful for testing/reset)
   */
  deleteByChallengeId(challengeId: string): Promise<void>;
}

/**
 * ChallengeVoteRepository Context.Tag for Effect dependency injection
 */
export class ChallengeVoteRepositoryTag extends Context.Tag(
  "ChallengeVoteRepository",
)<
  ChallengeVoteRepositoryTag,
  {
    create: (vote: ChallengeVote) => Effect.Effect<ChallengeVote, never, never>;
    createMany: (
      votes: ChallengeVote[],
    ) => Effect.Effect<ChallengeVote[], never, never>;
    findById: (id: string) => Effect.Effect<ChallengeVote | null, never, never>;
    findByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<ChallengeVote[], never, never>;
    findByChallengeAndVoter: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<ChallengeVote[], never, never>;
    findBySubmissionId: (
      submissionId: string,
    ) => Effect.Effect<ChallengeVote[], never, never>;
    hasVoted: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<boolean, never, never>;
    hasVotedForPosition: (
      challengeId: string,
      voterId: string,
      position: number,
    ) => Effect.Effect<boolean, never, never>;
    getVotedPositions: (
      challengeId: string,
      voterId: string,
    ) => Effect.Effect<number[], never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    deleteByChallengeId: (
      challengeId: string,
    ) => Effect.Effect<void, never, never>;
  }
>() {}
