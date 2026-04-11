import { describe, it, expect, mock } from "bun:test";
import {
  GetVotesByChallengeUseCase,
  type GetVotesByChallengeInput,
} from "./GetVotesByChallenge";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] GetVotesByChallengeUseCase", () => {
  const createValidVote = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
      voterId: string;
      position: number;
    }>,
  ): ChallengeVote => {
    const result = ChallengeVote.create({
      id: overrides?.id ?? "vote-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      submissionId: "submission-123",
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
    it("should return votes for challenge", async () => {
      const mockVotes = [
        createValidVote({ id: "vote-1", voterId: "voter-a", position: 1 }),
        createValidVote({ id: "vote-2", voterId: "voter-a", position: 2 }),
        createValidVote({ id: "vote-3", voterId: "voter-b", position: 1 }),
      ];
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.resolve(mockVotes)),
      });

      const useCase = new GetVotesByChallengeUseCase(mockRepo);
      const input: GetVotesByChallengeInput = {
        challengeId: "challenge-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votes).toHaveLength(3);
        expect(result.value.totalVotes).toBe(3);
        expect(result.value.uniqueVoters).toBe(2);
      }
      expect(mockRepo.findByChallengeId).toHaveBeenCalledWith("challenge-123");
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetVotesByChallengeUseCase(mockRepo);
      const input: GetVotesByChallengeInput = {
        challengeId: "",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("challengeId is required");
      }
    });

    it("should return empty list when no votes exist", async () => {
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.resolve([])),
      });

      const useCase = new GetVotesByChallengeUseCase(mockRepo);
      const input: GetVotesByChallengeInput = {
        challengeId: "challenge-empty",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votes).toHaveLength(0);
        expect(result.value.totalVotes).toBe(0);
        expect(result.value.uniqueVoters).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findByChallengeId: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetVotesByChallengeUseCase(mockRepo);
      const input: GetVotesByChallengeInput = {
        challengeId: "challenge-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
