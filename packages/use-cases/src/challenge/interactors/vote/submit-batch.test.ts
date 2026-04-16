import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  submitVotesUseCase,
  type SubmitVotesInput,
  type VoteInput,
  SubmitVotesValidationError,
  BatchAlreadyVotedError,
  InvalidVoteSetError,
  BatchVoteRepositoryError,
} from "./submit-batch";
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
    hasVoted?: boolean;
    shouldFailHasVoted?: boolean;
    shouldFailCreateMany?: boolean;
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

    createMany: (votes: ChallengeVoteDTO[]) => {
      if (options.shouldFailCreateMany) {
        return Effect.fail(
          new DatabaseError({
            operation: "createMany",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(votes);
    },

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

    hasVoted: () => {
      if (options.shouldFailHasVoted) {
        return Effect.fail(
          new DatabaseError({
            operation: "hasVoted",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(options.hasVoted ?? false);
    },

    hasVotedForPosition: () => Effect.succeed(false),

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] submitVotesUseCase", () => {
  it("should submit multiple votes successfully", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const votes: VoteInput[] = [
      { submissionId: "sub-1", position: 1, points: 3 },
      { submissionId: "sub-2", position: 2, points: 2 },
      { submissionId: "sub-3", position: 3, points: 1 },
    ];

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes,
      requiredPositions: 3,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.votes).toHaveLength(3);
    expect(result.totalVotesCast).toBe(3);
  });

  it("should fail with SubmitVotesValidationError when challengeId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVotesInput = {
      challengeId: "",
      voterId: "voter-789",
      votes: [{ submissionId: "sub-1", position: 1 }],
      requiredPositions: 1,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVotesValidationError);
      expect(either.left.message).toBe("Challenge ID is required");
    }
  });

  it("should fail with SubmitVotesValidationError when voterId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "",
      votes: [{ submissionId: "sub-1", position: 1 }],
      requiredPositions: 1,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVotesValidationError);
      expect(either.left.message).toBe("Voter ID is required");
    }
  });

  it("should fail with SubmitVotesValidationError when votes array is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes: [],
      requiredPositions: 3,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVotesValidationError);
      expect(either.left.message).toBe("At least one vote is required");
    }
  });

  it("should fail with BatchAlreadyVotedError when voter has already voted", async () => {
    const mockGateway = createMockVoteGateway({
      hasVoted: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes: [{ submissionId: "sub-1", position: 1 }],
      requiredPositions: 1,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(BatchAlreadyVotedError);
      expect(either.left.message).toBe(
        "You have already voted in this challenge",
      );
    }
  });

  it("should fail with InvalidVoteSetError for duplicate positions", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const votes: VoteInput[] = [
      { submissionId: "sub-1", position: 1 },
      { submissionId: "sub-2", position: 1 },
    ];

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes,
      requiredPositions: 3,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidVoteSetError);
    }
  });

  it("should fail with InvalidVoteSetError for duplicate submissions", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const votes: VoteInput[] = [
      { submissionId: "sub-1", position: 1 },
      { submissionId: "sub-1", position: 2 },
    ];

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes,
      requiredPositions: 3,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidVoteSetError);
    }
  });

  it("should fail with BatchVoteRepositoryError when database error occurs", async () => {
    const mockGateway = createMockVoteGateway({
      shouldFailCreateMany: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const votes: VoteInput[] = [{ submissionId: "sub-1", position: 1 }];

    const input: SubmitVotesInput = {
      challengeId: "challenge-123",
      voterId: "voter-789",
      votes,
      requiredPositions: 1,
    };

    const program = submitVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(BatchVoteRepositoryError);
      expect(either.left.message).toBe("Failed to save votes");
    }
  });
});
