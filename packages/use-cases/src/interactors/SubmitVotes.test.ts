import { describe, it, expect, mock } from "bun:test";
import {
  SubmitVotesUseCase,
  type SubmitVotesInput,
  type VoteInput,
} from "./SubmitVotes";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] SubmitVotesUseCase", () => {
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
    it("should submit multiple votes successfully", async () => {
      const mockVotes = [
        createValidVote({ id: "vote-1", position: 1 }),
        createValidVote({ id: "vote-2", position: 2 }),
        createValidVote({ id: "vote-3", position: 3 }),
      ];
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(false)),
        createMany: mock(() => Promise.resolve(mockVotes)),
      });

      const useCase = new SubmitVotesUseCase(mockRepo);
      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1, points: 30 },
          { submissionId: "submission-2", position: 2, points: 20 },
          { submissionId: "submission-3", position: 3, points: 10 },
        ],
        requiredPositions: 3,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.totalVotesCast).toBe(3);
        expect(result.value.votes).toHaveLength(3);
      }
      expect(mockRepo.hasVoted).toHaveBeenCalledWith(
        "challenge-123",
        "voter-123",
      );
      expect(mockRepo.createMany).toHaveBeenCalled();
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new SubmitVotesUseCase(mockRepo);
      const input: SubmitVotesInput = {
        challengeId: "",
        voterId: "voter-123",
        votes: [{ submissionId: "submission-1", position: 1 }],
        requiredPositions: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Challenge ID is required");
      }
    });

    it("should return error when voter has already voted", async () => {
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(true)),
      });

      const useCase = new SubmitVotesUseCase(mockRepo);
      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [{ submissionId: "submission-1", position: 1 }],
        requiredPositions: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("You have already voted in this challenge");
      }
    });

    it("should return error for duplicate positions", async () => {
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(false)),
      });

      const useCase = new SubmitVotesUseCase(mockRepo);
      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [
          { submissionId: "submission-1", position: 1 },
          { submissionId: "submission-2", position: 1 },
        ],
        requiredPositions: 2,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        hasVoted: mock(() => Promise.resolve(false)),
        createMany: mock(() => Promise.reject(new Error("Save failed"))),
      });

      const useCase = new SubmitVotesUseCase(mockRepo);
      const input: SubmitVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
        votes: [{ submissionId: "submission-1", position: 1 }],
        requiredPositions: 1,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to save votes");
      }
    });
  });
});
