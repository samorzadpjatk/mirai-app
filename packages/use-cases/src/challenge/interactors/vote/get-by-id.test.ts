import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getChallengeVoteByIdUseCase,
  type GetChallengeVoteByIdInput,
  ChallengeVoteNotFoundError,
  ChallengeVoteGetRepositoryError,
} from "./get-by-id";
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
  votes: ChallengeVoteDTO[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): ChallengeVoteGateway {
  const voteMap = new Map(votes.map((v) => [v.id, v]));

  return {
    create: (vote: ChallengeVoteDTO) => {
      voteMap.set(vote.id, vote);
      return Effect.succeed(vote);
    },

    createMany: (votes: ChallengeVoteDTO[]) => {
      for (const vote of votes) {
        voteMap.set(vote.id, vote);
      }
      return Effect.succeed(votes);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
      const vote = voteMap.get(id);
      return Effect.succeed(vote ?? null);
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
    id: overrides.id ?? "vote-123",
    challengeId: overrides.challengeId ?? "challenge-123",
    submissionId: overrides.submissionId ?? "submission-456",
    voterId: overrides.voterId ?? "voter-789",
    votePosition: overrides.votePosition ?? 1,
    votePoints: overrides.votePoints ?? 3,
    normalizedWeight: overrides.normalizedWeight ?? 1.0,
    votedAt: overrides.votedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] getChallengeVoteByIdUseCase", () => {
  it("should return vote when found by ID", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      challengeId: "challenge-789",
      submissionId: "submission-101",
      voterId: "voter-202",
      votePosition: 2,
      votePoints: 2,
      normalizedWeight: 1.5,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVoteByIdInput = {
      voteId: "vote-456",
    };

    const program = getChallengeVoteByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("vote-456");
    expect(result.challengeId).toBe("challenge-789");
    expect(result.submissionId).toBe("submission-101");
    expect(result.voterId).toBe("voter-202");
    expect(result.position).toBe(2);
    expect(result.points).toBe(2);
    expect(result.weight).toBe(1.5);
    expect(result.votedAt).toBeInstanceOf(Date);
  });

  it("should fail with ChallengeVoteNotFoundError when vote not found", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVoteByIdInput = {
      voteId: "non-existent",
    };

    const program = getChallengeVoteByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteNotFoundError);
      expect(either.left.message).toBe("Vote not found");
    }
  });

  it("should fail with ChallengeVoteGetRepositoryError when database error occurs", async () => {
    const mockGateway = createMockVoteGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVoteByIdInput = {
      voteId: "vote-123",
    };

    const program = getChallengeVoteByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteGetRepositoryError);
      expect(either.left.message).toBe("Failed to retrieve vote");
    }
  });

  it("should return correct position value from domain entity", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-position",
      votePosition: 3,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetChallengeVoteByIdInput = {
      voteId: "vote-position",
    };

    const program = getChallengeVoteByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.position).toBe(3);
  });
});
