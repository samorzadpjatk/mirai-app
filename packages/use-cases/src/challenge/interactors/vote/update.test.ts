import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateChallengeVoteUseCase,
  type UpdateChallengeVoteInput,
  ChallengeVoteNotFoundError,
  ChallengeVoteValidationError,
  ChallengeVoteUpdateRepositoryError,
} from "./update";
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
    shouldFailCreate?: boolean;
  } = {},
): ChallengeVoteGateway {
  const voteMap = new Map(votes.map((v) => [v.id, v]));

  return {
    create: (vote: ChallengeVoteDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
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

describe("[UNIT] updateChallengeVoteUseCase", () => {
  it("should update vote position successfully", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      votePosition: 1,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      position: 2,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.position).toBe(2);
    expect(result.id).toBe("vote-456");
  });

  it("should update vote points successfully", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      votePoints: 3,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      points: 5,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.points).toBe(5);
  });

  it("should update vote weight successfully", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      normalizedWeight: 1.0,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      weight: 2.0,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.weight).toBe(2.0);
  });

  it("should fail with ChallengeVoteNotFoundError when vote not found", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "non-existent",
      position: 2,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteNotFoundError);
      expect(either.left.message).toBe("Vote not found");
    }
  });

  it("should fail with ChallengeVoteValidationError for invalid position", async () => {
    const mockVote = createMockVoteDTO({ id: "vote-456" });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      position: 0,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteValidationError);
    }
  });

  it("should fail with ChallengeVoteUpdateRepositoryError when database error occurs during find", async () => {
    const mockGateway = createMockVoteGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-123",
      position: 2,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteUpdateRepositoryError);
      expect(either.left.message).toBe("Failed to load existing vote");
    }
  });

  it("should fail with ChallengeVoteUpdateRepositoryError when database error occurs during update", async () => {
    const mockVote = createMockVoteDTO({ id: "vote-456" });
    const mockGateway = createMockVoteGateway([mockVote], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      position: 2,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteUpdateRepositoryError);
      expect(either.left.message).toBe("Failed to update vote");
    }
  });

  it("should preserve existing values when not provided", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      votePosition: 1,
      votePoints: 3,
      normalizedWeight: 1.0,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      points: 5,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.points).toBe(5);
    expect(result.position).toBe(1);
    expect(result.weight).toBe(1.0);
  });

  it("should update multiple fields at once", async () => {
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      votePosition: 1,
      votePoints: 3,
      normalizedWeight: 1.0,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      position: 2,
      points: 4,
      weight: 1.5,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.position).toBe(2);
    expect(result.points).toBe(4);
    expect(result.weight).toBe(1.5);
  });

  it("should preserve votedAt timestamp from original vote", async () => {
    const originalVotedAt = new Date("2024-01-15");
    const mockVote = createMockVoteDTO({
      id: "vote-456",
      votedAt: originalVotedAt,
    });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: UpdateChallengeVoteInput = {
      voteId: "vote-456",
      position: 2,
    };

    const program = updateChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.votedAt).toEqual(originalVotedAt);
  });
});
