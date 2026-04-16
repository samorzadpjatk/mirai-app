import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  submitVoteUseCase,
  type SubmitVoteInput,
  SubmitVoteValidationError,
  VotePositionTakenError,
  AlreadyVotedError,
  VoteRepositoryError,
} from "./submit";
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
    hasVotedForPosition?: boolean;
    hasVoted?: boolean;
    shouldFailHasVotedForPosition?: boolean;
    shouldFailHasVoted?: boolean;
    shouldFailCreate?: boolean;
  } = {},
): ChallengeVoteGateway {
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
      return Effect.succeed(vote);
    },

    createMany: (votes: ChallengeVoteDTO[]) => Effect.succeed(votes),

    findById: () => Effect.succeed(null),

    findByChallengeId: () => Effect.succeed([]),

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

    hasVotedForPosition: () => {
      if (options.shouldFailHasVotedForPosition) {
        return Effect.fail(
          new DatabaseError({
            operation: "hasVotedForPosition",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(options.hasVotedForPosition ?? false);
    },

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] submitVoteUseCase", () => {
  it("should submit a vote successfully", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.challengeId).toBe("challenge-123");
    expect(result.submissionId).toBe("submission-456");
    expect(result.voterId).toBe("voter-789");
    expect(result.votePosition).toBe(1);
  });

  it("should fail with SubmitVoteValidationError when challengeId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
      expect(either.left.message).toBe("challengeId is required");
    }
  });

  it("should fail with SubmitVoteValidationError when submissionId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "",
      voterId: "voter-789",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
      expect(either.left.message).toBe("submissionId is required");
    }
  });

  it("should fail with SubmitVoteValidationError when voterId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
      expect(either.left.message).toBe("voterId is required");
    }
  });

  it("should fail with SubmitVoteValidationError when position is less than 1", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 0,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
      expect(either.left.message).toBe("position must be between 1 and 3");
    }
  });

  it("should fail with SubmitVoteValidationError when position is greater than 3", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 4,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SubmitVoteValidationError);
      expect(either.left.message).toBe("position must be between 1 and 3");
    }
  });

  it("should fail with VotePositionTakenError when position is already taken", async () => {
    const mockGateway = createMockVoteGateway({
      hasVotedForPosition: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(VotePositionTakenError);
    }
  });

  it("should fail with AlreadyVotedError when voter already voted and partial voting not allowed", async () => {
    const mockGateway = createMockVoteGateway({
      hasVoted: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
      allowPartial: false,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(AlreadyVotedError);
    }
  });

  it("should allow voting when allowPartial is true even if already voted", async () => {
    const mockGateway = createMockVoteGateway({
      hasVoted: true,
      hasVotedForPosition: false,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 2,
      allowPartial: true,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.votePosition).toBe(2);
  });

  it("should fail with VoteRepositoryError when database error occurs during create", async () => {
    const mockGateway = createMockVoteGateway({
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(VoteRepositoryError);
      expect(either.left.message).toBe("Failed to save vote");
    }
  });

  it("should include optional points and weight in output", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: SubmitVoteInput = {
      challengeId: "challenge-123",
      submissionId: "submission-456",
      voterId: "voter-789",
      position: 1,
      points: 5,
      normalizedWeight: 2.0,
    };

    const program = submitVoteUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.votePoints).toBe(5);
    expect(result.normalizedWeight).toBe(2.0);
  });
});
