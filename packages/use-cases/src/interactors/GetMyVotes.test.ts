import { describe, it, expect, mock } from "bun:test";
import { GetMyVotesUseCase, type GetMyVotesInput } from "./GetMyVotes";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] GetMyVotesUseCase", () => {
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
    it("should return votes for specific voter", async () => {
      const mockVotes = [
        createValidVote({ id: "vote-1", voterId: "voter-456", position: 1 }),
        createValidVote({ id: "vote-2", voterId: "voter-456", position: 2 }),
        createValidVote({ id: "vote-3", voterId: "voter-456", position: 3 }),
      ];
      const mockRepo = createMockRepo({
        findByChallengeAndVoter: mock(() => Promise.resolve(mockVotes)),
      });

      const useCase = new GetMyVotesUseCase(mockRepo);
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votes).toHaveLength(3);
        expect(result.value.totalVotes).toBe(3);
        // Votes should be sorted by position
        expect(result.value.votes[0].votePosition).toBe(1);
        expect(result.value.votes[1].votePosition).toBe(2);
        expect(result.value.votes[2].votePosition).toBe(3);
      }
      expect(mockRepo.findByChallengeAndVoter).toHaveBeenCalledWith(
        "challenge-123",
        "voter-456",
      );
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetMyVotesUseCase(mockRepo);
      const input: GetMyVotesInput = {
        challengeId: "",
        voterId: "voter-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("challengeId is required");
      }
    });

    it("should return error when voterId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetMyVotesUseCase(mockRepo);
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("voterId is required");
      }
    });

    it("should return empty list when voter has not voted", async () => {
      const mockRepo = createMockRepo({
        findByChallengeAndVoter: mock(() => Promise.resolve([])),
      });

      const useCase = new GetMyVotesUseCase(mockRepo);
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-no-votes",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votes).toHaveLength(0);
        expect(result.value.totalVotes).toBe(0);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findByChallengeAndVoter: mock(() =>
          Promise.reject(new Error("DB error")),
        ),
      });

      const useCase = new GetMyVotesUseCase(mockRepo);
      const input: GetMyVotesInput = {
        challengeId: "challenge-123",
        voterId: "voter-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
