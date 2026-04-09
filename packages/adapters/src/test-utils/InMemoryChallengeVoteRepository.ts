import type { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./InMemoryRepository";

/**
 * In-Memory ChallengeVote Repository for Testing
 *
 * Implements ChallengeVoteRepository port with in-memory storage.
 * Uses Map<string, ChallengeVote> for storage, keyed by vote ID.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryChallengeVoteRepository();
 *
 * // Seed with test data
 * repo.seed([mockVote1, mockVote2]);
 *
 * // Find votes by challenge
 * const votes = await repo.findByChallengeId("challenge-123");
 * expect(votes).toHaveLength(2);
 *
 * // Check if user has voted
 * const hasVoted = await repo.hasVoted("challenge-123", "user-456");
 * expect(hasVoted).toBe(true);
 *
 * // Clean up after test
 * repo.reset();
 * ```
 */
export class InMemoryChallengeVoteRepository
  extends InMemoryRepository<ChallengeVote>
  implements ChallengeVoteRepository
{
  /**
   * Create a new vote
   */
  async create(vote: ChallengeVote): Promise<ChallengeVote> {
    return this.createGeneric(vote);
  }

  /**
   * Create multiple votes in a batch
   */
  async createMany(votes: ChallengeVote[]): Promise<ChallengeVote[]> {
    votes.forEach((vote) => this.storage.set(vote.id as string, vote));
    return votes;
  }

  /**
   * Find vote by ID
   * @returns Vote or null if not found
   */
  async findById(id: string): Promise<ChallengeVote | null> {
    return this.findByIdGeneric(id);
  }

  /**
   * Find all votes for a challenge
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeVote[]> {
    return this.getAllItems().filter(
      (vote) => vote.challengeId === challengeId,
    );
  }

  /**
   * Find all votes by a specific voter in a challenge
   */
  async findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Promise<ChallengeVote[]> {
    return this.getAllItems().filter(
      (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
    );
  }

  /**
   * Find all votes for a specific submission
   */
  async findBySubmissionId(submissionId: string): Promise<ChallengeVote[]> {
    return this.getAllItems().filter(
      (vote) => vote.submissionId === submissionId,
    );
  }

  /**
   * Check if a voter has already voted in a challenge
   */
  async hasVoted(challengeId: string, voterId: string): Promise<boolean> {
    return this.getAllItems().some(
      (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
    );
  }

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  async hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Promise<boolean> {
    return this.getAllItems().some(
      (vote) =>
        vote.challengeId === challengeId &&
        vote.voterId === voterId &&
        vote.position.value === position,
    );
  }

  /**
   * Get vote positions filled by a voter in a challenge
   */
  async getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Promise<number[]> {
    return this.getAllItems()
      .filter(
        (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
      )
      .map((vote) => vote.position.value)
      .sort((a, b) => a - b);
  }

  /**
   * Delete a vote
   */
  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  /**
   * Delete all votes for a challenge (useful for testing/reset)
   */
  async deleteByChallengeId(challengeId: string): Promise<void> {
    const votesToDelete = this.getAllItems().filter(
      (vote) => vote.challengeId === challengeId,
    );
    votesToDelete.forEach((vote) => {
      this.storage.delete(vote.id as string);
    });
  }

  /**
   * Reset the repository - clears all stored votes.
   * Call this in beforeEach for test isolation.
   */
  override reset(): void {
    this.storage.clear();
  }

  /**
   * Seed the repository with initial votes.
   * Useful for setting up test scenarios.
   */
  override seed(votes: ChallengeVote[]): void {
    votes.forEach((vote) => this.storage.set(vote.id as string, vote));
  }
}
