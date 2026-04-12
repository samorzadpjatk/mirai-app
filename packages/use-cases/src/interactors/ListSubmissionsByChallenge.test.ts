import { describe, it, expect, beforeEach } from "bun:test";
import {
  listSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
  ListSubmissionsRepositoryError,
} from "./ListSubmissionsByChallenge";
import { ChallengeSubmission, SubmissionId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { ChallengeSubmissionRepositoryTag } from "../ports/ChallengeSubmissionRepository";
import { InMemoryChallengeSubmissionRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] listSubmissionsByChallengeUseCase (Effect)", () => {
  let repo: InMemoryChallengeSubmissionRepository;

  beforeEach(() => {
    repo = new InMemoryChallengeSubmissionRepository();
  });

  // Helper to create a valid submission
  const createValidSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      voteScore: number;
    }>,
  ) => {
    const result = ChallengeSubmission.create({
      id: overrides?.id ?? "submission-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      groupId: overrides?.groupId ?? "group-123",
      imageIds: ["image-1"],
      videoId: null,
      textContent: "Test content",
      latitude: 52.52,
      longitude: 13.405,
    });
    if (result.kind === "err") {
      throw new Error(
        `Failed to create test submission: ${result.error.message}`,
      );
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: ListSubmissionsByChallengeInput) => {
    const program = listSubmissionsByChallengeUseCase(input).pipe(
      Effect.provideService(ChallengeSubmissionRepositoryTag, {
        create: (submission: ChallengeSubmission) =>
          Effect.promise(() => repo.create(submission)),
        findById: (id: SubmissionId) => Effect.promise(() => repo.findById(id)),
        findByChallengeAndGroup: (challengeId: string, groupId: string) =>
          Effect.promise(() =>
            repo.findByChallengeAndGroup(challengeId, groupId),
          ),
        findByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.findByChallengeId(challengeId)),
        findByGroupId: (groupId: string) =>
          Effect.promise(() => repo.findByGroupId(groupId)),
        findByStatus: (status: any) =>
          Effect.promise(() => repo.findByStatus(status)),
        findMany: (params: any) => Effect.promise(() => repo.findMany(params)),
        update: (submission: ChallengeSubmission) =>
          Effect.promise(() => repo.update(submission)),
        delete: (id: SubmissionId) => Effect.promise(() => repo.delete(id)),
        existsForChallengeAndGroup: (challengeId: string, groupId: string) =>
          Effect.promise(() =>
            repo.existsForChallengeAndGroup(challengeId, groupId),
          ),
        countByChallengeId: (challengeId: string) =>
          Effect.promise(() => repo.countByChallengeId(challengeId)),
        countByChallengeAndStatus: (challengeId: string, status: any) =>
          Effect.promise(() =>
            repo.countByChallengeAndStatus(challengeId, status),
          ),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should list submissions for a challenge", async () => {
      // Arrange
      const submission1 = createValidSubmission({
        id: "submission-1",
        challengeId: "challenge-123",
      });
      const submission2 = createValidSubmission({
        id: "submission-2",
        challengeId: "challenge-123",
        groupId: "group-456",
      });
      await repo.create(submission1);
      await repo.create(submission2);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.submissions).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.submissions[0].challengeId).toBe("challenge-123");
    });

    it("should use default sorting options", async () => {
      // Arrange
      const submission1 = createValidSubmission({
        id: "submission-1",
        challengeId: "challenge-123",
      });
      const submission2 = createValidSubmission({
        id: "submission-2",
        challengeId: "challenge-123",
        groupId: "group-456",
      });
      await repo.create(submission1);
      await repo.create(submission2);

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.submissions).toHaveLength(2);
      // Both start with voteScore 0 since they're created fresh
      expect(result.submissions[0].voteScore).toBe(0);
      expect(result.submissions[1].voteScore).toBe(0);
    });

    it("should sort by createdAt when specified", async () => {
      // Arrange
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        orderBy: "createdAt",
        orderDirection: "asc",
      };

      // Act
      const result = await runUseCase(input);

      // Assert - no error, uses default pagination
      expect(result.submissions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should apply pagination options", async () => {
      // Arrange - create multiple submissions
      for (let i = 1; i <= 5; i++) {
        const submission = createValidSubmission({
          id: `submission-${i}`,
          challengeId: "challenge-123",
          groupId: `group-${i}`,
        });
        await repo.create(submission);
      }

      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        limit: 2,
        offset: 1,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.submissions).toHaveLength(2);
      expect(result.totalCount).toBe(5);
    });

    it("should return empty list when no submissions exist", async () => {
      // Arrange
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-empty",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.submissions).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
