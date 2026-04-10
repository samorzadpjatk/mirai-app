import type {
  ChallengeSubmission,
  SubmissionId,
  SubmissionStatus,
} from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./InMemoryRepository";

/**
 * In-Memory Challenge Submission Repository for Testing
 *
 * Implements ChallengeSubmissionRepository port with in-memory storage.
 * Uses Map<string, ChallengeSubmission> keyed by submission ID.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryChallengeSubmissionRepository();
 * repo.seed([mockSubmission]);
 *
 * const byChallenge = await repo.findByChallengeId("challenge-123");
 * expect(byChallenge).toHaveLength(1);
 *
 * repo.reset(); // Clear for next test
 * ```
 */
export class InMemoryChallengeSubmissionRepository
  extends InMemoryRepository<ChallengeSubmission>
  implements ChallengeSubmissionRepository
{
  /**
   * Create a new challenge submission
   */
  async create(submission: ChallengeSubmission): Promise<ChallengeSubmission> {
    return this.createGeneric(submission);
  }

  /**
   * Find submission by ID
   * @returns Submission or null if not found
   */
  async findById(id: SubmissionId): Promise<ChallengeSubmission | null> {
    return this.findByIdGeneric(id as string);
  }

  /**
   * Find submission by challenge ID and group ID
   * @returns Submission or null if not found
   */
  async findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<ChallengeSubmission | null> {
    return (
      this.getAllItems().find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      ) ?? null
    );
  }

  /**
   * Find all submissions for a challenge
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeSubmission[]> {
    return this.getAllItems().filter((s) => s.challengeId === challengeId);
  }

  /**
   * Find all submissions by a group
   */
  async findByGroupId(groupId: string): Promise<ChallengeSubmission[]> {
    return this.getAllItems().filter((s) => s.groupId === groupId);
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: SubmissionStatus): Promise<ChallengeSubmission[]> {
    return this.getAllItems().filter((s) => s.status === status);
  }

  /**
   * Find submissions with advanced filtering and sorting
   */
  async findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Promise<ChallengeSubmission[]> {
    let items = this.getAllItems();

    // Apply filters
    if (params.challengeId) {
      items = items.filter((s) => s.challengeId === params.challengeId);
    }

    if (params.groupId) {
      items = items.filter((s) => s.groupId === params.groupId);
    }

    if (params.status) {
      items = items.filter((s) => s.status === params.status);
    }

    // Apply sorting
    const orderBy = params.orderBy ?? "voteScore";
    const orderDirection = params.orderDirection ?? "desc";

    items.sort((a, b) => {
      if (orderBy === "voteScore") {
        if (orderDirection === "desc") {
          return b.voteScore - a.voteScore;
        }
        return a.voteScore - b.voteScore;
      } else {
        // createdAt
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        if (orderDirection === "desc") {
          return bTime - aTime;
        }
        return aTime - bTime;
      }
    });

    // Apply pagination
    if (params.offset) {
      items = items.slice(params.offset);
    }

    if (params.limit !== undefined) {
      items = items.slice(0, params.limit);
    }

    return items;
  }

  /**
   * Update submission
   */
  async update(submission: ChallengeSubmission): Promise<ChallengeSubmission> {
    return this.updateGeneric(submission);
  }

  /**
   * Delete submission
   */
  async delete(id: SubmissionId): Promise<void> {
    return this.deleteGeneric(id as string);
  }

  /**
   * Check if submission exists for challenge and group
   */
  async existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<boolean> {
    return this.getAllItems().some(
      (s) => s.challengeId === challengeId && s.groupId === groupId,
    );
  }

  /**
   * Count submissions for a challenge
   */
  async countByChallengeId(challengeId: string): Promise<number> {
    return this.getAllItems().filter((s) => s.challengeId === challengeId)
      .length;
  }

  /**
   * Count submissions by status for a challenge
   */
  async countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Promise<number> {
    return this.getAllItems().filter(
      (s) => s.challengeId === challengeId && s.status === status,
    ).length;
  }

  /**
   * Reset the repository - clears all stored data.
   * Call this in beforeEach for test isolation.
   */
  reset(): void {
    super.reset();
  }

  /**
   * Seed the repository with initial data.
   * Useful for setting up test scenarios.
   */
  seed(items: ChallengeSubmission[]): void {
    super.seed(items);
  }
}
