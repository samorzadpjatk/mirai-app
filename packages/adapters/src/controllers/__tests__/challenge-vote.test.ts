import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ChallengeVoteController } from "../challenge-vote";
import type {
  ChallengeVoteRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
} from "@mirai-app/use-cases";

describe("[UNIT] ChallengeVoteController", () => {
  let controller: ChallengeVoteController;
  let mockVoteRepository: ChallengeVoteRepository;
  let mockChallengeRepository: ChallengeRepository;
  let mockSubmissionRepository: ChallengeSubmissionRepository;
  let mockOnChallengeCompleted: (params: {
    challengeId: string;
    tripId: string;
    adminId: string;
  }) => Promise<void>;

  beforeEach(() => {
    mockVoteRepository = {
      findByChallengeId: mock(() => Promise.resolve([])),
      findByVoterAndChallenge: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({} as any)),
      delete: mock(() => Promise.resolve()),
      countByChallenge: mock(() => Promise.resolve(0)),
    } as unknown as ChallengeVoteRepository;

    mockChallengeRepository = {
      findById: mock(() =>
        Promise.resolve({
          id: "challenge-123",
          status: "VOTING_PHASE",
          tripId: "trip-123",
        } as any),
      ),
      update: mock(() => Promise.resolve({} as any)),
    } as unknown as ChallengeRepository;

    mockSubmissionRepository = {
      findById: mock(() => Promise.resolve({ id: "submission-123" } as any)),
      findByChallengeId: mock(() => Promise.resolve([])),
    } as unknown as ChallengeSubmissionRepository;

    mockOnChallengeCompleted = mock(() => Promise.resolve());

    controller = new ChallengeVoteController(
      mockVoteRepository,
      mockChallengeRepository,
      mockSubmissionRepository,
      mockOnChallengeCompleted,
    );
  });

  describe("getMyVotes", () => {
    it("should return votes for voter", async () => {
      const input = {
        challengeId: "challenge-123",
        voterId: "user-123",
      };

      const result = await controller.getMyVotes(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.votes).toEqual([]);
      }
    });

    it("should return error for invalid input", async () => {
      const result = await controller.getMyVotes({
        challengeId: "",
        voterId: "user-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getByChallenge", () => {
    it("should return all votes for challenge", async () => {
      const input = {
        challengeId: "challenge-123",
      };

      const result = await controller.getByChallenge(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalVotes).toBe(0);
      }
    });
  });

  describe("getVotingProgress", () => {
    it("should return voting progress", async () => {
      const input = {
        challengeId: "challenge-123",
      };

      const result = await controller.getVotingProgress(input);

      expect(result.success).toBe(true);
    });
  });

  describe("getJudgedStaffProgress", () => {
    it("should return staff voting progress", async () => {
      const input = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1", "admin-2"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await controller.getJudgedStaffProgress(input);

      expect(result.success).toBe(true);
    });

    it("should return error without admin IDs", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: [],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("submitVote", () => {
    it("should submit vote", async () => {
      const input = {
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "user-123",
        position: 1,
      };

      const result = await controller.submitVote(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid position", async () => {
      const result = await controller.submitVote({
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "user-123",
        position: 5, // Invalid - max is 3
      });

      expect(result.success).toBe(false);
    });
  });

  describe("submitVotes", () => {
    it("should submit multiple votes", async () => {
      const input = {
        challengeId: "challenge-123",
        voterId: "user-123",
        votes: [
          { submissionId: "sub-1", position: 1 },
          { submissionId: "sub-2", position: 2 },
          { submissionId: "sub-3", position: 3 },
        ],
        requiredPositions: 3,
      };

      const result = await controller.submitVotes(input);

      expect(result.success).toBe(true);
    });

    it("should return error for empty votes", async () => {
      const result = await controller.submitVotes({
        challengeId: "challenge-123",
        voterId: "user-123",
        votes: [],
        requiredPositions: 3,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("forceEndVoting", () => {
    it("should force end voting", async () => {
      const input = {
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminId: "admin-123",
      };

      const result = await controller.forceEndVoting(input);

      expect(result.success).toBe(true);
      expect(mockOnChallengeCompleted).toHaveBeenCalled();
    });
  });
});
