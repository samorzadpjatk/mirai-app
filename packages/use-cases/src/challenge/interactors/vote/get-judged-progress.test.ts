import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getJudgedStaffVotingProgressUseCase,
  type GetJudgedStaffVotingProgressInput,
  GetVotingProgressValidationError,
  GetVotingProgressRepositoryError,
} from "./get-judged-progress";
import {
  ChallengeVoteGatewayTag,
  type ChallengeVoteGateway,
} from "../../ports/vote/gateway";
import type { ChallengeVoteDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock ChallengeVoteGateway for testing
 */
function createMockVoteGateway(
  options: {
    votedPositions?: number[];
    shouldFailGetVotedPositions?: boolean;
  } = {},
): ChallengeVoteGateway {
  return {
    create: () =>
      Effect.succeed({
        id: "vote-123",
        challengeId: "challenge-123",
        submissionId: "submission-456",
        voterId: "voter-789",
        votePosition: 1,
        votePoints: 3,
        normalizedWeight: 1.0,
        votedAt: new Date(),
      }),

    createMany: (votes: ChallengeVoteDTO[]) => Effect.succeed(votes),

    findById: () => Effect.succeed(null),

    findByChallengeIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByChallengeAndVoterConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findBySubmissionIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    hasVoted: () => Effect.succeed(false),

    hasVotedForPosition: () => Effect.succeed(false),

    getVotedPositions: () => {
      if (options.shouldFailGetVotedPositions) {
        return Effect.fail(
          new DatabaseError({
            operation: "getVotedPositions",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(options.votedPositions ?? []);
    },

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] getJudgedStaffVotingProgressUseCase", () => {
  it("should return progress for no admins", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminParticipantIds: [],
      requiredPositions: 3,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.requiredPositions).toBe(3);
    expect(result.eligibleSubmissionsCount).toBe(5);
    expect(result.totalAdmins).toBe(0);
    expect(result.votedAdmins).toBe(0);
    expect(result.pendingAdmins).toBe(0);
    expect(result.allAdminsVoted).toBe(false);
    expect(result.adminProgress).toEqual([]);
  });

  it("should return progress with all admins having voted", async () => {
    const mockGateway = createMockVoteGateway({
      votedPositions: [1, 2, 3],
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminParticipantIds: ["admin-1", "admin-2"],
      requiredPositions: 3,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalAdmins).toBe(2);
    expect(result.votedAdmins).toBe(2);
    expect(result.pendingAdmins).toBe(0);
    expect(result.allAdminsVoted).toBe(true);
    expect(result.adminProgress).toHaveLength(2);
    expect(result.adminProgress[0].hasVotedAll).toBe(true);
  });

  it("should return progress with partial voting", async () => {
    const mockGateway = createMockVoteGateway({
      votedPositions: [1, 2],
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminParticipantIds: ["admin-1", "admin-2", "admin-3"],
      requiredPositions: 3,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalAdmins).toBe(3);
    expect(result.votedAdmins).toBe(0); // No admin has voted all positions
    expect(result.pendingAdmins).toBe(3);
    expect(result.allAdminsVoted).toBe(false);
    expect(result.adminProgress).toHaveLength(3);
    expect(result.adminProgress[0].hasVotedAll).toBe(false);
  });

  it("should fail with GetVotingProgressValidationError when challengeId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "",
      tripId: "trip-123",
      adminParticipantIds: ["admin-1"],
      requiredPositions: 3,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
      expect(either.left.message).toBe("challengeId is required");
    }
  });

  it("should fail with GetVotingProgressValidationError when tripId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "",
      adminParticipantIds: ["admin-1"],
      requiredPositions: 3,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
      expect(either.left.message).toBe("tripId is required");
    }
  });

  it("should fail with GetVotingProgressValidationError when requiredPositions is zero", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminParticipantIds: ["admin-1"],
      requiredPositions: 0,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
      expect(either.left.message).toBe("requiredPositions must be positive");
    }
  });

  it("should fail with GetVotingProgressValidationError when requiredPositions is negative", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetJudgedStaffVotingProgressInput = {
      challengeId: "challenge-123",
      tripId: "trip-123",
      adminParticipantIds: ["admin-1"],
      requiredPositions: -1,
      eligibleSubmissionsCount: 5,
    };

    const program = getJudgedStaffVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
    }
  });
});
