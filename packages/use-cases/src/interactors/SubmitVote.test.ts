import { describe, it, expect, mock } from "bun:test";
import { SubmitVoteUseCase, type SubmitVoteInput } from "./SubmitVote";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] SubmitVoteUseCase", () => {
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
    it("should submit vote successfully", async () => {
      const mockVote = createValidVote({
        id: "vote-456",
        challengeId: "challenge-456",
        voterId: "voter-456",
        position: 2,
      });
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(false)),
        hasVotedForPosition: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockVote)),
      });

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "challenge-456",
        submissionId: "submission-456",
        voterId: "voter-456",
        position: 2,
        points: 15,
        normalizedWeight: 1.5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.challengeId).toBe("challenge-456");
        expect(result.value.voterId).toBe("voter-456");
        expect(result.value.votePosition).toBe(2);
        expect(result.value.votedAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("challengeId is required");
      }
    });

    it("should return error when voter has already voted", async () => {
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(true)),
      });

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("You have already voted in this challenge");
      }
    });

    it("should allow partial voting when allowPartial is true", async () => {
      const mockVote = createValidVote({
        id: "vote-partial",
        position: 1,
      });
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(true)),
        hasVotedForPosition: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockVote)),
      });

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
        allowPartial: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error for invalid position", async () => {
      const mockRepo = createMockRepo();

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("position must be between 1 and 3");
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new SubmitVoteUseCase(mockRepo);
      const input: SubmitVoteInput = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-123",
        position: 1,
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
