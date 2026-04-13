import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { ChallengeVoteController } from "../challenge-vote";
import type {
  ChallengeVoteRepository,
  ChallengeRepository,
  ChallengeSubmissionRepository,
} from "@mirai-app/use-cases";
import {
  ChallengeVote,
  ChallengeVoteId,
  SubmissionId,
} from "@mirai-app/domain";

// Valid UUIDs for testing
const CHALLENGE_ID = "550e8400-e29b-41d4-a716-446655440000";
const VOTER_ID = "550e8400-e29b-41d4-a716-446655440001";
const SUBMISSION_ID = "550e8400-e29b-41d4-a716-446655440002";
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440003";

// Helper to create mock vote
const createMockVote = (overrides?: Partial<ChallengeVote>): ChallengeVote =>
  ({
    id: ChallengeVoteId.unsafeCreate("550e8400-e29b-41d4-a716-446655440004"),
    challengeId: CHALLENGE_ID,
    submissionId: SubmissionId.unsafeCreate(SUBMISSION_ID),
    voterId: VOTER_ID,
    position: { value: 1 },
    points: 10,
    weight: { value: 1 },
    createdAt: new Date(),
    ...overrides,
  }) as ChallengeVote;

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
      findByChallengeId: mock(() => Effect.succeed([])),
      findByChallengeAndVoter: mock(() => Effect.succeed([])),
      findById: mock(() => Effect.succeed(null)),
      findBySubmissionId: mock(() => Effect.succeed([])),
      create: mock(() => Effect.succeed(createMockVote())),
      createMany: mock((votes: ChallengeVote[]) => Effect.succeed(votes)),
      delete: mock(() => Effect.succeed(undefined)),
      deleteByChallengeId: mock(() => Effect.succeed(undefined)),
      hasVoted: mock(() => Effect.succeed(false)),
      hasVotedForPosition: mock(() => Effect.succeed(false)),
      getVotedPositions: mock(() => Effect.succeed([])),
    } as unknown as ChallengeVoteRepository;

    mockChallengeRepository = {
      findById: mock(() =>
        Effect.succeed({
          id: CHALLENGE_ID,
          status: "ACTIVE" as const,
          tripId: TRIP_ID,
          scoringCategory: "JUDGED_STAFF" as const,
          endTime: new Date(Date.now() - 86400000), // Yesterday (ended)
          complete: function () {
            return Effect.succeed({ ...this, status: "COMPLETED" as const });
          },
        } as any),
      ),
      update: mock(() => Effect.succeed({} as any)),
      updateStatus: mock(() => Effect.succeed({} as any)),
      create: mock(() => Effect.succeed({} as any)),
      delete: mock(() => Effect.succeed(undefined)),
      findByTripId: mock(() => Effect.succeed([])),
      findActive: mock(() => Effect.succeed([])),
      findSubmissions: mock(() => Effect.succeed([])),
      findPendingVoting: mock(() => Effect.succeed([])),
      exists: mock(() => Effect.succeed(true)),
    } as unknown as ChallengeRepository;

    mockSubmissionRepository = {
      findById: mock(() => Effect.succeed({ id: SUBMISSION_ID } as any)),
      findByChallengeId: mock(() => Effect.succeed([])),
      findByGroupId: mock(() => Effect.succeed([])),
      findByStatus: mock(() => Effect.succeed([])),
      findMany: mock(() => Effect.succeed([])),
      findByChallengeAndGroup: mock(() => Effect.succeed(null)),
      create: mock(() => Effect.succeed({} as any)),
      update: mock(() => Effect.succeed({} as any)),
      delete: mock(() => Effect.succeed(undefined)),
      existsForChallengeAndGroup: mock(() => Effect.succeed(false)),
      countByChallengeId: mock(() => Effect.succeed(0)),
      countByChallengeAndStatus: mock(() => Effect.succeed(0)),
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
        challengeId: CHALLENGE_ID,
        voterId: VOTER_ID,
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
        voterId: VOTER_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getByChallenge", () => {
    it("should return all votes for challenge", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
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
        challengeId: CHALLENGE_ID,
      };

      const result = await controller.getVotingProgress(input);

      expect(result.success).toBe(true);
    });
  });

  describe("getJudgedStaffProgress", () => {
    it("should return staff voting progress", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        tripId: TRIP_ID,
        adminParticipantIds: ["admin-1", "admin-2"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      };

      const result = await controller.getJudgedStaffProgress(input);

      expect(result.success).toBe(true);
    });

    it("should return error without admin IDs", async () => {
      const result = await controller.getJudgedStaffProgress({
        challengeId: CHALLENGE_ID,
        tripId: TRIP_ID,
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
        challengeId: CHALLENGE_ID,
        submissionId: SUBMISSION_ID,
        voterId: VOTER_ID,
        position: 1,
      };

      const result = await controller.submitVote(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid position", async () => {
      const result = await controller.submitVote({
        challengeId: CHALLENGE_ID,
        submissionId: SUBMISSION_ID,
        voterId: VOTER_ID,
        position: 5, // Invalid - max is 3
      });

      expect(result.success).toBe(false);
    });
  });

  describe("submitVotes", () => {
    it("should submit multiple votes", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        voterId: VOTER_ID,
        votes: [
          { submissionId: "550e8400-e29b-41d4-a716-446655440005", position: 1 },
          { submissionId: "550e8400-e29b-41d4-a716-446655440006", position: 2 },
          { submissionId: "550e8400-e29b-41d4-a716-446655440007", position: 3 },
        ],
        requiredPositions: 3,
      };

      const result = await controller.submitVotes(input);

      expect(result.success).toBe(true);
    });

    it("should return error for empty votes", async () => {
      const result = await controller.submitVotes({
        challengeId: CHALLENGE_ID,
        voterId: VOTER_ID,
        votes: [],
        requiredPositions: 3,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("forceEndVoting", () => {
    it("should force end voting", async () => {
      const input = {
        challengeId: CHALLENGE_ID,
        tripId: TRIP_ID,
        adminId: "admin-123",
      };

      const result = await controller.forceEndVoting(input);

      expect(result.success).toBe(true);
      expect(mockOnChallengeCompleted).toHaveBeenCalled();
    });
  });
});
