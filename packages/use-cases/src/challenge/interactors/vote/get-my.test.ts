import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getMyVotesUseCase,
  type GetMyVotesInput,
  GetMyVotesValidationError,
  GetMyVotesRepositoryError,
} from "./get-my";
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
  return {
    create: (vote: ChallengeVoteDTO) => Effect.succeed(vote),

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

    getVotedPositions: () => Effect.succeed([]),

    delete: () => Effect.succeed(void 0),

    deleteByChallengeId: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] getMyVotesUseCase", () => {
  it("should fail with GetMyVotesValidationError when challengeId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetMyVotesInput = {
      challengeId: "",
      voterId: "voter-123",
    };

    const program = getMyVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetMyVotesValidationError);
      expect(either.left.message).toBe("challengeId is required");
    }
  });

  it("should fail with GetMyVotesValidationError when voterId is empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetMyVotesInput = {
      challengeId: "challenge-123",
      voterId: "",
    };

    const program = getMyVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetMyVotesValidationError);
      expect(either.left.message).toBe("voterId is required");
    }
  });

  it("should fail with GetMyVotesValidationError when both inputs are empty", async () => {
    const mockGateway = createMockVoteGateway();
    const mockLayer = Layer.succeed(ChallengeVoteGatewayTag, mockGateway);

    const input: GetMyVotesInput = {
      challengeId: "",
      voterId: "",
    };

    const program = getMyVotesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetMyVotesValidationError);
    }
  });
});
