import { describe, it, expect, mock } from "bun:test";
import {
  ListSubmissionsByChallengeUseCase,
  type ListSubmissionsByChallengeInput,
} from "./ListSubmissionsByChallenge";
import { SubmissionId } from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] ListSubmissionsByChallengeUseCase", () => {
  const createMockSubmission = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      groupId: string;
      voteScore: number;
    }>,
  ) => ({
    id: SubmissionId.unsafeCreate(overrides?.id ?? "submission-123"),
    challengeId: overrides?.challengeId ?? "challenge-123",
    groupId: overrides?.groupId ?? "group-123",
    imageIds: ["image-1"],
    videoId: null,
    textContent: "Test content",
    latitude: 52.52,
    longitude: 13.405,
    status: "PENDING",
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    awardedPoints: 0,
    bonusPoints: 0,
    ranking: null,
    voteCount: 0,
    voteScore: overrides?.voteScore ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: null,
    reviewedBy: null,
  });

  const createMockRepo = (
    overrides?: Partial<ChallengeSubmissionRepository>,
  ): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve(createMockSubmission() as any)),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createMockSubmission() as any)),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should list submissions for a challenge", async () => {
      const mockSubmissions = [
        createMockSubmission({ id: "submission-1", voteScore: 100 }),
        createMockSubmission({ id: "submission-2", voteScore: 50 }),
      ];
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve(mockSubmissions as any)),
        countByChallengeId: mock(() => Promise.resolve(2)),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.submissions).toHaveLength(2);
        expect(result.value.totalCount).toBe(2);
        expect(result.value.submissions[0].challengeId).toBe("challenge-123");
        expect(result.value.submissions[0].voteScore).toBe(100);
      }
      expect(mockRepo.findMany).toHaveBeenCalledWith({
        challengeId: "challenge-123",
        orderBy: "voteScore",
        orderDirection: "desc",
      });
    });

    it("should sort by vote score descending by default", async () => {
      const mockSubmissions = [
        createMockSubmission({ id: "submission-1", voteScore: 100 }),
        createMockSubmission({ id: "submission-2", voteScore: 50 }),
      ];
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve(mockSubmissions as any)),
        countByChallengeId: mock(() => Promise.resolve(2)),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      await useCase.execute(input);

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: "voteScore",
          orderDirection: "desc",
        }),
      );
    });

    it("should sort by createdAt when specified", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve([])),
        countByChallengeId: mock(() => Promise.resolve(0)),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        orderBy: "createdAt",
        orderDirection: "asc",
      };

      await useCase.execute(input);

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: "createdAt",
          orderDirection: "asc",
        }),
      );
    });

    it("should apply pagination options", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve([])),
        countByChallengeId: mock(() => Promise.resolve(100)),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
        limit: 10,
        offset: 20,
      };

      await useCase.execute(input);

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
        }),
      );
    });

    it("should return empty list when no submissions exist", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve([])),
        countByChallengeId: mock(() => Promise.resolve(0)),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-empty",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.submissions).toHaveLength(0);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new ListSubmissionsByChallengeUseCase(mockRepo);
      const input: ListSubmissionsByChallengeInput = {
        challengeId: "challenge-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
