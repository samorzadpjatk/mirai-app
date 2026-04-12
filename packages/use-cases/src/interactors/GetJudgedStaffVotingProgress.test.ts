import { describe, it, expect } from "bun:test";
import {
  getJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  GetVotingProgressValidationError,
} from "./GetJudgedStaffVotingProgress";
import { Effect, Either } from "effect";
import { ChallengeVoteRepositoryTag } from "../ports/ChallengeVoteRepository";

// Create mock repository service
const createMockRepoService = (overrides?: {
  getVotedPositions?: (
    challengeId: string,
    voterId: string,
  ) => Promise<number[]>;
}) => ({
  create: () => Effect.promise(() => Promise.resolve({} as any)),
  createMany: () => Effect.promise(() => Promise.resolve([])),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByChallengeId: () => Effect.promise(() => Promise.resolve([])),
  findByChallengeAndVoter: () => Effect.promise(() => Promise.resolve([])),
  findBySubmissionId: () => Effect.promise(() => Promise.resolve([])),
  hasVoted: () => Effect.promise(() => Promise.resolve(false)),
  hasVotedForPosition: () => Effect.promise(() => Promise.resolve(false)),
  getVotedPositions: (challengeId: string, voterId: string) =>
    Effect.promise(() =>
      overrides?.getVotedPositions
        ? overrides.getVotedPositions(challengeId, voterId)
        : Promise.resolve([]),
    ),
  delete: () => Effect.promise(() => Promise.resolve()),
  deleteByChallengeId: () => Effect.promise(() => Promise.resolve()),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: GetJudgedStaffVotingProgressInput,
  repoOverrides?: {
    getVotedPositions?: (
      challengeId: string,
      voterId: string,
    ) => Promise<number[]>;
  },
) => {
  const program = getJudgedStaffVotingProgressUseCase(input).pipe(
    Effect.provideService(
      ChallengeVoteRepositoryTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] getJudgedStaffVotingProgressUseCase (Effect)", () => {
  describe("execute", () => {
    it("should return voting progress for all admins", async () => {
      const mockGetVotedPositions = (challengeId: string, voterId: string) => {
        if (voterId === "admin-1") return Promise.resolve([1, 2, 3]);
        if (voterId === "admin-2") return Promise.resolve([1, 2]);
        if (voterId === "admin-3") return Promise.resolve([]);
        return Promise.resolve([]);
      };

      const result = await runUseCase(
        {
          challengeId: "challenge-123",
          tripId: "trip-123",
          adminParticipantIds: ["admin-1", "admin-2", "admin-3"],
          requiredPositions: 3,
          eligibleSubmissionsCount: 5,
        },
        { getVotedPositions: mockGetVotedPositions },
      );

      expect(result.requiredPositions).toBe(3);
      expect(result.eligibleSubmissionsCount).toBe(5);
      expect(result.totalAdmins).toBe(3);
      expect(result.votedAdmins).toBe(1); // Only admin-1 has all 3 positions
      expect(result.pendingAdmins).toBe(2);
      expect(result.allAdminsVoted).toBe(false);
      expect(result.adminProgress).toHaveLength(3);
      expect(result.adminProgress[0].participantId).toBe("admin-1");
      expect(result.adminProgress[0].hasVotedAll).toBe(true);
      expect(result.adminProgress[1].hasVotedAll).toBe(false);
      expect(result.adminProgress[2].hasVotedAll).toBe(false);
    });

    it("should return all admins voted when everyone completed voting", async () => {
      const result = await runUseCase(
        {
          challengeId: "challenge-123",
          tripId: "trip-123",
          adminParticipantIds: ["admin-1", "admin-2"],
          requiredPositions: 3,
          eligibleSubmissionsCount: 5,
        },
        { getVotedPositions: () => Promise.resolve([1, 2, 3]) },
      );

      expect(result.votedAdmins).toBe(2);
      expect(result.pendingAdmins).toBe(0);
      expect(result.allAdminsVoted).toBe(true);
    });

    it("should handle empty admin list", async () => {
      const result = await runUseCase({
        challengeId: "challenge-123",
        tripId: "trip-123",
        adminParticipantIds: [],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      });

      expect(result.totalAdmins).toBe(0);
      expect(result.votedAdmins).toBe(0);
      expect(result.pendingAdmins).toBe(0);
      expect(result.allAdminsVoted).toBe(false);
      expect(result.adminProgress).toHaveLength(0);
    });

    it("should fail when challengeId is empty", async () => {
      const program = getJudgedStaffVotingProgressUseCase({
        challengeId: "",
        tripId: "trip-123",
        adminParticipantIds: ["admin-1"],
        requiredPositions: 3,
        eligibleSubmissionsCount: 5,
      }).pipe(
        Effect.provideService(
          ChallengeVoteRepositoryTag,
          createMockRepoService(),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
      }
    });
  });
});
