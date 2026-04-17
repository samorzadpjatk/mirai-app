import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import type {
  ChallengeSubmission,
  IChallengeSubmissionPort,
} from "@mirai-app/use-cases";

/**
 * In-Memory ChallengeSubmission Gateway
 *
 * Implements IChallengeSubmissionPort using in-memory Map storage for testing.
 */
export class InMemoryChallengeSubmissionGateway implements IChallengeSubmissionPort {
  private submissions: Map<string, ChallengeSubmission> = new Map();

  findById(
    id: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return Effect.sync(() => {
      const submission = this.submissions.get(id);
      return submission ?? null;
    });
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.submissions.values())
        .filter((submission) => submission.challengeId === challengeId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    });
  }

  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return Effect.sync(() => {
      const submission = Array.from(this.submissions.values()).find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return submission ?? null;
    });
  }

  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.submissions.values())
        .filter((submission) => submission.groupId === groupId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    });
  }

  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return Effect.sync(() => {
      this.submissions.set(submission.id, submission);
      return submission;
    });
  }

  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return Effect.sync(() => {
      this.submissions.set(submission.id, submission);
      return submission;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.submissions.delete(id);
    });
  }

  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.submissions.values()).filter(
        (submission) => submission.challengeId === challengeId,
      ).length;
    });
  }

  countPendingByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.submissions.values()).filter(
        (submission) =>
          submission.challengeId === challengeId &&
          submission.status === "PENDING",
      ).length;
    });
  }

  /**
   * Helper method to add a submission (for testing)
   */
  addSubmission(submission: ChallengeSubmission): void {
    this.submissions.set(submission.id, submission);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.submissions.clear();
  }
}
