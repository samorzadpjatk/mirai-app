import { describe, it, expect, mock } from "bun:test";
import {
  ForceEndVotingUseCase,
  type ForceEndVotingInput,
} from "./ForceEndVoting";
import {
  Challenge,
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";
import { ChallengeVote } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "../ports/ChallengeVoteRepository";
import type { ChallengeRepository } from "../ports/ChallengeRepository";
import type { ChallengeSubmissionRepository } from "../ports/ChallengeSubmissionRepository";

describe("[UNIT] ForceEndVotingUseCase", () => {
  const createValidChallenge = (
    overrides?: Partial<{
      id: string;
      status: ChallengeStatus;
      scoringCategory: ScoringCategory;
      tripId: string;
    }>,
  ): Challenge => {
    const result = Challenge.create({
      id: overrides?.id ?? "challenge-123",
      tripId: overrides?.tripId ?? "trip-123",
      name: "Test Challenge",
      description: "Test description",
      basePoints: 100,
      submissionType: SubmissionType.IMAGE,
      scoringCategory:
        overrides?.scoringCategory ?? ScoringCategory.JUDGED_STAFF,
      status: overrides?.status ?? ChallengeStatus.ACTIVE,
      startTime: new Date("2026-01-01"),
      endTime: new Date(Date.now() - 86400000), // Yesterday
      createdById: "user-123",
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test challenge: ${result.error}`);
    }
    return result.value;
  };

  const createValidVote = (
    overrides?: Partial<{
      id: string;
      challengeId: string;
    }>,
  ): ChallengeVote => {
    const result = ChallengeVote.create({
      id: overrides?.id ?? "vote-123",
      challengeId: overrides?.challengeId ?? "challenge-123",
      submissionId: "submission-123",
      voterId: "voter-123",
      position: 1,
      points: 10,
      weight: 1.0,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test vote: ${result.error}`);
    }
    return result.value;
  };

  const createMockVoteRepo = (
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

  const createMockChallengeRepo = (
    overrides?: Partial<ChallengeRepository>,
  ): ChallengeRepository => ({
    create: mock(() => Promise.resolve(createValidChallenge())),
    findById: mock(() => Promise.resolve(null)),
    findByTripId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findByTripIdAndStatus: mock(() => Promise.resolve([])),
    findBySubmissionType: mock(() => Promise.resolve([])),
    findByScoringCategory: mock(() => Promise.resolve([])),
    findActiveForTrip: mock(() => Promise.resolve([])),
    findVisibleForTrip: mock(() => Promise.resolve([])),
    findUpcomingForTrip: mock(() => Promise.resolve([])),
    findActiveBetween: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createValidChallenge())),
    updateStatus: mock(() => Promise.resolve(createValidChallenge())),
    delete: mock(() => Promise.resolve()),
    exists: mock(() => Promise.resolve(false)),
    countByTripId: mock(() => Promise.resolve(0)),
    countByTripIdAndStatus: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  const createMockSubmissionRepo = (): ChallengeSubmissionRepository => ({
    create: mock(() => Promise.resolve({} as any)),
    findById: mock(() => Promise.resolve(null)),
    findByChallengeAndGroup: mock(() => Promise.resolve(null)),
    findByChallengeId: mock(() => Promise.resolve([])),
    findByGroupId: mock(() => Promise.resolve([])),
    findByStatus: mock(() => Promise.resolve([])),
    findMany: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve({} as any)),
    delete: mock(() => Promise.resolve()),
    existsForChallengeAndGroup: mock(() => Promise.resolve(false)),
    countByChallengeId: mock(() => Promise.resolve(0)),
    countByChallengeAndStatus: mock(() => Promise.resolve(0)),
  });

  describe("execute", () => {
    it("should return error when challengeId is empty", async () => {
      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        createMockChallengeRepo(),
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Challenge ID is required");
      }
    });

    it("should return error when tripId is empty", async () => {
      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        createMockChallengeRepo(),
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "challenge-123",
        tripId: "",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Trip ID is required");
      }
    });

    it("should return error when adminId is empty", async () => {
      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        createMockChallengeRepo(),
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminId: "",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Admin ID is required");
      }
    });

    it("should return error when challenge not found", async () => {
      const mockChallengeRepo = createMockChallengeRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        mockChallengeRepo,
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "non-existent",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Challenge not found");
      }
    });

    it("should return error when challenge is not judged staff type", async () => {
      const mockChallenge = createValidChallenge({
        id: "challenge-456",
        scoringCategory: ScoringCategory.PEER_VOTING,
      });
      const mockChallengeRepo = createMockChallengeRepo({
        findById: mock(() => Promise.resolve(mockChallenge)),
      });

      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        mockChallengeRepo,
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "challenge-456",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Force end is available only for judged staff challenges",
        );
      }
    });

    it("should return error when challenge is cancelled", async () => {
      const mockChallenge = createValidChallenge({
        id: "challenge-cancelled",
        status: ChallengeStatus.CANCELLED,
        scoringCategory: ScoringCategory.JUDGED_STAFF,
      });
      const mockChallengeRepo = createMockChallengeRepo({
        findById: mock(() => Promise.resolve(mockChallenge)),
      });

      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        mockChallengeRepo,
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "challenge-cancelled",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Cancelled challenge cannot be finalized");
      }
    });

    it("should handle repository errors", async () => {
      const mockChallengeRepo = createMockChallengeRepo({
        findById: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new ForceEndVotingUseCase(
        createMockVoteRepo(),
        mockChallengeRepo,
        createMockSubmissionRepo(),
      );

      const input: ForceEndVotingInput = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to load challenge");
      }
    });
  });
});
