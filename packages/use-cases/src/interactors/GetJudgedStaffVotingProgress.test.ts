import { describe, it, expect, mock } from "bun:test";
import {
  GetJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
} from "./GetJudgedStaffVotingProgress";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";

describe("[UNIT] GetJudgedStaffVotingProgressUseCase", () => {
  const createMockRepo = (
    overrides?: Partial<ChallengeVoteRepository>,
  ): ChallengeVoteRepository => ({
    create: mock(() => Promise.resolve({} as any)),
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
    it("should return voting progress for all admins", async () => {
      const mockRepo = createMockRepo({
        getVotedPositions: mock((challengeId: string, voterId: string) => {
          if (voterId === "admin-1") return Promise.resolve([1, 2, 3]);
          if (voterId === "admin-2") return Promise.resolve([1, 2]);
          if (voterId === "admin-3") return Promise.resolve([]);
          return Promise.resolve([]);
        }),
      });

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1", "admin-2", "admin-3"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.requiredPositions).toBe(3);
        expect(result.value.eligibleSubmissionsCount).toBe(5);
        expect(result.value.totalAdmins).toBe(3);
        expect(result.value.votedAdmins).toBe(1); // Only admin-1 has all 3 positions
        expect(result.value.pendingAdmins).toBe(2);
        expect(result.value.allAdminsVoted).toBe(false);
        expect(result.value.adminProgress).toHaveLength(3);
        expect(result.value.adminProgress[0].participantId).toBe("admin-1");
        expect(result.value.adminProgress[0].hasVotedAll).toBe(true);
        expect(result.value.adminProgress[1].hasVotedAll).toBe(false);
        expect(result.value.adminProgress[2].hasVotedAll).toBe(false);
      }
    });

    it("should return all admins voted when everyone completed voting", async () => {
      const mockRepo = createMockRepo({
        getVotedPositions: mock(() => Promise.resolve([1, 2, 3])),
      });

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1", "admin-2"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.votedAdmins).toBe(2);
        expect(result.value.pendingAdmins).toBe(0);
        expect(result.value.allAdminsVoted).toBe(true);
      }
    });

    it("should handle empty admin list", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: [],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.totalAdmins).toBe(0);
        expect(result.value.votedAdmins).toBe(0);
        expect(result.value.pendingAdmins).toBe(0);
        expect(result.value.allAdminsVoted).toBe(false);
        expect(result.value.adminProgress).toHaveLength(0);
      }
    });

    it("should return error when challengeId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("challengeId is required");
      }
    });

    it("should return error when tripId is empty", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("tripId is required");
      }
    });

    it("should return error when requiredPositions is not positive", async () => {
      const mockRepo = createMockRepo();

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 0,
        eligibleSubmissionsCount: 5,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("requiredPositions must be positive");
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        getVotedPositions: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetJudgedStaffVotingProgressUseCase(mockRepo);
      const input: GetJudgedStaffVotingProgressInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
