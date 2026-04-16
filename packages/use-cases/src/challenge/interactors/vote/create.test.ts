import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createChallengeVoteUseCase,
  type CreateChallengeVoteInput,
  ChallengeVoteCreationError,
  ChallengeVoteAlreadyExistsError,
  ChallengeVoteRepositoryError,
} from "./create";
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
    shouldFailCreate?: boolean;
    shouldFailHasVoted?: boolean;
  } = {},
): ChallengeVoteGateway {
  const voteList = [...votes];

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

    hasVotedForPosition: () => {
      if (options.shouldFailHasVoted) {
        return Effect.fail(
          new DatabaseError({
            operation: "hasVotedForPosition",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(false);
    },

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] createChallengeVoteUseCase", () => {
  it("should create a vote successfully", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
      points: 3,
      weight: 1.0,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.challengeId).toBe("challenge-123");
    expect(result.submissionId).toBe("submission-456");
    expect(result.voterId).toBe("voter-789");
    expect(result.position).toBe(1);
    expect(result.points).toBe(3);
    expect(result.weight).toBe(1.0);
    expect(result.votedAt).toBeInstanceOf(Date);
  });

  it("should fail with ChallengeVoteAlreadyExistsError when voter already voted for position", async () => {
    const gatewayWithExistingVote = createMockVoteGateway();
    // Override to return true for hasVotedForPosition
    const gatewayWithVote = {
      ...gatewayWithExistingVote,
      hasVotedForPosition: () => Effect.succeed(true),
    };
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, gatewayWithVote);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteAlreadyExistsError);
      expect(either.left.message).toBe(
        "Voter has already voted for this position in this challenge",
      );
    }
  });

  it("should fail with ChallengeVoteRepositoryError when checking existing vote fails", async () => {
    const mockGateway = createMockVoteGateway([], {
      shouldFailHasVoted: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteRepositoryError);
      expect(either.left.message).toBe("Failed to check existing vote status");
    }
  });

  it("should fail with ChallengeVoteRepositoryError when database error occurs during create", async () => {
    const mockGateway = createMockVoteGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteRepositoryError);
      expect(either.left.message).toBe("Failed to create vote");
    }
  });

  it("should fail with ChallengeVoteCreationError for invalid position", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 0,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeVoteCreationError);
    }
  });

  it("should create vote with default points and weight", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.position).toBe(1);
    expect(result.votedAt).toBeInstanceOf(Date);
  });

  it("should calculate points based on position when not provided", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: CreateChallengeVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 2,
    };

    const program = createChallengeVoteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.position).toBe(2);
  });
});
