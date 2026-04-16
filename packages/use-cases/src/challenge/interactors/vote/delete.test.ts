import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteChallengeVoteUseCase,
  type DeleteChallengeVoteInput,
  ChallengeVoteNotFoundError,
  ChallengeVoteDeleteRepositoryError,
} from "./delete";
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
    shouldFailDelete?: boolean;
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

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      voteMap.delete(id);
      return Effect.succeed(void 0);
    },

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
    submissionId: overrides.submissionId ?? "submission-456",
    voterId: overrides.voterId ?? "voter-789",
    votePosition: overrides.votePosition ?? 1,
    votePoints: overrides.votePoints ?? 3,
    normalizedWeight: overrides.normalizedWeight ?? 1.0,
    votedAt: overrides.votedAt ?? new Date(),
  };
}

describe("[UNIT] deleteChallengeVoteUseCase", () => {
  it("should delete a vote successfully", async () => {
    const mockVote = createMockVoteDTO({ id: "vote-123" });
    const mockGateway = createMockVoteGateway([mockVote]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: DeleteChallengeVoteInput = {
      voteId: "vote-123",
    };

    const program = deleteChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Vote deleted successfully");
  });

  it("should fail with ChallengeVoteNotFoundError when vote not found", async () => {
    const mockGateway = createMockVoteGateway([]);
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: DeleteChallengeVoteInput = {
      voteId: "non-existent",
    };

    const program = deleteChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteNotFoundError);
      expect(either.left.message).toBe("Vote not found");
    }
  });

  it("should fail with ChallengeVoteDeleteRepositoryError when database error occurs during find", async () => {
    const mockGateway = createMockVoteGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: DeleteChallengeVoteInput = {
      voteId: "vote-123",
    };

    const program = deleteChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteDeleteRepositoryError);
      expect(either.left.message).toBe("Failed to load existing vote");
    }
  });

  it("should fail with ChallengeVoteDeleteRepositoryError when database error occurs during delete", async () => {
    const mockVote = createMockVoteDTO({ id: "vote-456" });
    const mockGateway = createMockVoteGateway([mockVote], {
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: DeleteChallengeVoteInput = {
      voteId: "vote-456",
    };

    const program = deleteChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteDeleteRepositoryError);
      expect(either.left.message).toBe("Failed to delete vote");
    }
  });
});
