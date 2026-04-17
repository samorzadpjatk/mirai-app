import { Effect } from "effect";
import type {
  ChallengeSubmission,
  IChallengeSubmissionPort,
} from "@mirai-app/use-cases/challenge-submission/ports/ChallengeSubmissionPort";

/**
 * In-Memory ChallengeSubmission Gateway
 *
 * Implements IChallengeSubmissionPort using in-memory Map storage for testing.
 */
export class InMemoryChallengeSubmissionGateway implements IChallengeSubmissionPort {
  private submissions: Map<string, ChallengeSubmission> = new Map();

  findById(id: string) {
    return Effect.sync(() => {
      const submission = this.submissions.get(id);
      return submission ?? null;
    });
  }

  findByChallengeId(challengeId: string) {
    return Effect.sync(() => {
      return Array.from(this.submissions.values())
        .filter((submission) => submission.challengeId === challengeId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    });
  }

  findByChallengeAndGroup(challengeId: string, groupId: string) {
    return Effect.sync(() => {
      const submission = Array.from(this.submissions.values()).find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
      return submission ?? null;
    });
  }

  findByGroupId(groupId: string) {
    return Effect.sync(() => {
      return Array.from(this.submissions.values())
        .filter((submission) => submission.groupId === groupId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    });
  }

  create(submission: ChallengeSubmission) {
    return Effect.sync(() => {
      this.submissions.set(submission.id, submission);
      return submission;
    });
  }

  update(submission: ChallengeSubmission) {
    return Effect.sync(() => {
      this.submissions.set(submission.id, submission);
      return submission;
    });
  }

  delete(id: string) {
    return Effect.sync(() => {
      this.submissions.delete(id);
    });
  }

  countByChallengeId(challengeId: string) {
    return Effect.sync(() => {
      return Array.from(this.submissions.values()).filter(
        (submission) => submission.challengeId === challengeId,
      ).length;
    });
  }

  countPendingByChallengeId(challengeId: string) {
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
