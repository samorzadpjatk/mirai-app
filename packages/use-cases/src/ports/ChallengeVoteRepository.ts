import type { ChallengeVote } from "@mirai-app/domain";

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
