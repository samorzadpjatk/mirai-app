import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getChallengeVotingProgressUseCase,
  type GetChallengeVotingProgressInput,
  GetVotingProgressValidationError,
  GetVotingProgressRepositoryError,
} from "./voting-progress";
import {
  ChallengeVoteGatewayTag,
  type ChallengeVoteGateway,
} from "../ports/vote/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { ChallengeVoteDTO } from "../dto";

/**
 * Mock ChallengeVoteGateway for testing
 */
function createMockVoteGateway(
  votes: ChallengeVoteDTO[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): ChallengeVoteGateway {
  const voteList = [...votes];

  return {
    create: (vote: ChallengeVoteDTO) => {
      voteList.push(vote);
      return Effect.succeed(vote);
    },

    createMany: (votes: ChallengeVoteDTO[]) => {
      voteList.push(...votes);
      return Effect.succeed(votes);
    },

    findById: (id: string) => {
      const vote = voteList.find((v) => v.id === id);
      return Effect.succeed(vote ?? null);
    },

    findByChallengeId: () => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findByChallengeId",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(voteList);
    },

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

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

// Helper to create mock vote DTOs
function createMockVoteDTO(
  overrides: Partial<ChallengeVoteDTO> = {},
): ChallengeVoteDTO {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    challengeId: overrides.challengeId ?? "challenge-123",
    submissionId: overrides.submissionId ?? "submission-123",
    voterId: overrides.voterId ?? "voter-123",
    votePosition: overrides.votePosition ?? 1,
    votePoints: overrides.votePoints ?? 3,
    normalizedWeight: overrides.normalizedWeight ?? 1.0,
    votedAt: overrides.votedAt ?? new Date(),
  };
}

describe("[UNIT] getChallengeVotingProgressUseCase", () => {
  it("should return voting progress with no votes", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "challenge-123",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.challengeId).toBe("challenge-123");
    expect(result.totalVotes).toBe(0);
    expect(result.submissionStats).toEqual([]);
  });

  it("should return voting progress with votes aggregated by submission", async () => {
    const votes = [
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 3,
        normalizedWeight: 1.0,
      }),
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 2,
        normalizedWeight: 1.0,
      }),
      createMockVoteDTO({
        submissionId: "sub-2",
        votePoints: 3,
        normalizedWeight: 1.0,
      }),
    ];
    const mockGateway = createMockVoteGateway(votes);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "challenge-123",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalVotes).toBe(3);
    expect(result.submissionStats).toHaveLength(2);

    // Sorted by voteScore desc
    const sub1Stats = result.submissionStats.find(
      (s) => s.submissionId === "sub-1",
    );
    expect(sub1Stats?.voteCount).toBe(2);
    expect(sub1Stats?.voteScore).toBe(5); // 3 + 2

    const sub2Stats = result.submissionStats.find(
      (s) => s.submissionId === "sub-2",
    );
    expect(sub2Stats?.voteCount).toBe(1);
    expect(sub2Stats?.voteScore).toBe(3);
  });

  it("should fail with GetVotingProgressValidationError when challengeId is empty", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
      expect(either.left.message).toBe("challengeId is required");
    }
  });

  it("should fail with GetVotingProgressValidationError when challengeId is whitespace", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "   ",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetVotingProgressValidationError);
    }
  });

  it("should sort submissions by voteScore descending then voteCount descending", async () => {
    const votes = [
      // sub-1: score=4, count=2
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 3,
        normalizedWeight: 1.0,
      }),
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 1,
        normalizedWeight: 1.0,
      }),
      // sub-2: score=4, count=1 (should come after sub-1 due to lower count)
      createMockVoteDTO({
        submissionId: "sub-2",
        votePoints: 4,
        normalizedWeight: 1.0,
      }),
      // sub-3: score=5, count=1 (should come first)
      createMockVoteDTO({
        submissionId: "sub-3",
        votePoints: 5,
        normalizedWeight: 1.0,
      }),
    ];
    const mockGateway = createMockVoteGateway(votes);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "challenge-123",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    // Should be sorted: sub-3 (score 5), sub-1 (score 4, count 2), sub-2 (score 4, count 1)
    expect(result.submissionStats[0].submissionId).toBe("sub-3");
    expect(result.submissionStats[1].submissionId).toBe("sub-1");
    expect(result.submissionStats[2].submissionId).toBe("sub-2");
  });

  it("should calculate weighted scores correctly", async () => {
    const votes = [
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 3,
        normalizedWeight: 2.0, // weighted score = 6
      }),
      createMockVoteDTO({
        submissionId: "sub-1",
        votePoints: 2,
        normalizedWeight: 1.5, // weighted score = 3
      }),
    ];
    const mockGateway = createMockVoteGateway(votes);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVotingProgressInput = {
      challengeId: "challenge-123",
    };

    const program = getChallengeVotingProgressUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.submissionStats[0].voteScore).toBe(9); // 6 + 3
    expect(result.submissionStats[0].voteCount).toBe(2);
  });
});
