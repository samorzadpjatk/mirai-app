import { describe, it, expect, mock } from "bun:test";
import {
  GetChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
} from "./GetChallengeVotingProgress";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] GetChallengeVotingProgressUseCase", () => {
  const createValidVote = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      position: number;
    }>,
  ): ChallengeVote => {
    const result = ChallengeVote.create({
      id: overrides?.id ?? "vote-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      submissionId: overrides?.submissionId ?? "submission-123",
      voterId: overrides?.voterId ?? "voter-123",
      position: overrides?.position ?? 1,
      points: 10,
      weight: 1.0,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test vote: ${result.error}`);
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<ChallengeVoteRepository>,
  ): ChallengeVoteRepository => ({
    create: mock(() => Promise.resolve(createValidVote())),
    createMany: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByChallengeAndVoter: mock(() => Promise.resolve([])),
    findBySubmissionId: mock(() => Promise.resolve([])),
    hasVoted: mock(() => Promise.resolve(false)),
    hasVotedForPosition: mock(() => Promise.resolve(false)),
    getVotedPositions: mock(() => Promise.resolve([])),
    delete: mock(() => Promise.resolve()),
    deleteByChallengeId: mock(() => Promise.resolve()),
    ...overrides,
  });

  describe("execute", () => {
    it("should return voting progress with submission stats", async () => {
      const mockVotes = [
        createValidVote({
          id: "vote-1",
          submissionId: "submission-a",
          position: 1,
        }),
        createValidVote({
          id: "vote-2",
          submissionId: "submission-a",
          position: 2,
        }),
        createValidVote({
          id: "vote-3",
          submissionId: "submission-b",
          position: 1,
        }),
        createValidVote({
          id: "vote-4",
          submissionId: "submission-c",
          position: 3,
        }),
      ];
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.resolve(mockVotes)),
      });

      const useCase = new GetChallengeVotingProgressUseCase(mockRepo);
      const input: GetChallengeVotingProgressInput = {
        challengeId: "challenge-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeId).toBe("challenge-123");
        expect(result.value.totalVotes).toBe(4);
        expect(result.value.submissionStats).toHaveLength(3);
        // Stats should be sorted by voteScore descending
        expect(result.value.submissionStats[0].submissionId).toBe(
          "submission-a",
        );
        expect(result.value.submissionStats[0].voteCount).toBe(2);
      }
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetChallengeVotingProgressUseCase(mockRepo);
      const input: GetChallengeVotingProgressInput = {
        challengeId: "",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("challengeId is required");
      }
    });

    it("should return empty stats when no votes exist", async () => {
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.resolve([])),
      });

      const useCase = new GetChallengeVotingProgressUseCase(mockRepo);
      const input: GetChallengeVotingProgressInput = {
        challengeId: "challenge-empty",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.totalVotes).toBe(0);
        expect(result.value.submissionStats).toHaveLength(0);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetChallengeVotingProgressUseCase(mockRepo);
      const input: GetChallengeVotingProgressInput = {
        challengeId: "challenge-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
