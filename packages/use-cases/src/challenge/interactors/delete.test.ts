import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteChallengeUseCase,
  type DeleteChallengeInput,
  ChallengeNotFoundError,
  ChallengeAlreadyActiveError,
  ChallengeDeleteRepositoryError,
} from "./delete";
import { ChallengeGatewayTag, type ChallengeGateway } from "../ports/gateway";
import type { ChallengeDTO } from "../dto";
import {
  DatabaseError,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

/**
 * Mock ChallengeGateway for testing
 */
function createMockChallengeGateway(
  challenges: ChallengeDTO[] = [],
  options: {
    shouldFailFind?: boolean;
    shouldFailDelete?: boolean;
  } = {},
): ChallengeGateway {
  const challengeMap = new Map(challenges.map((c) => [c.id, c]));

  return {
    create: (challenge: ChallengeDTO) => {
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
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
      const challenge = challengeMap.get(id);
      return Effect.succeed(challenge ?? null);
    },

    update: (challenge: ChallengeDTO) => Effect.succeed(challenge),

    updateStatus: (id: string, status: string) => {
      const challenge = challengeMap.get(id);
      if (challenge) {
        return Effect.succeed({
          ...challenge,
          status: status as ChallengeStatus,
        });
      }
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: "Challenge not found",
        }),
      );
    },

    delete: () => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(void 0);
    },

    exists: () => Effect.succeed(false),

    countByTripId: () => Effect.succeed(0),

    findByTripIdConnection: () =>
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

    findByStatusConnection: () =>
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

    findByTripIdAndStatusConnection: () =>
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

    findBySubmissionTypeConnection: () =>
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

    findByScoringCategoryConnection: () =>
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

    findActiveConnection: () =>
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

    findOpenForSubmissionConnection: () =>
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

    findRecurringConnection: () =>
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

    findAllConnection: () =>
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
  };
}

function createMockChallengeDTO(
  overrides: Partial<ChallengeDTO> = {},
): ChallengeDTO {
  return {
    id: overrides.id ?? "challenge-123",
    tripId: overrides.tripId ?? "trip-123",
    title: overrides.title ?? "Test Challenge",
    description: overrides.description ?? null,
    status: overrides.status ?? ChallengeStatus.VISIBLE,
    submissionType: overrides.submissionType ?? SubmissionType.IMAGE,
    scoringCategory: overrides.scoringCategory ?? ScoringCategory.SPEED,
    points: overrides.points ?? 100,
    maxPoints: overrides.maxPoints ?? null,
    startDate: overrides.startDate ?? new Date("2024-01-01"),
    endDate: overrides.endDate ?? null,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] deleteChallengeUseCase", () => {
  it("should delete a challenge successfully when not active", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-456",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "challenge-456" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Challenge deleted successfully");
  });

  it("should fail with ChallengeNotFoundError when challenge not found", async () => {
    const mockGateway = createMockChallengeGateway([]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "non-existent" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
      expect(either.left.message).toBe("Challenge not found");
    }
  });

  it("should fail with ChallengeAlreadyActiveError when challenge is active", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-active",
      status: ChallengeStatus.ACTIVE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "challenge-active" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeAlreadyActiveError);
      expect(either.left.message).toBe("Cannot delete an active challenge");
    }
  });

  it("should fail with ChallengeDeleteRepositoryError when database error occurs", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-123",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "challenge-123" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeDeleteRepositoryError);
      expect(either.left.message).toBe("Failed to load challenge");
    }
  });

  it("should allow deletion of hidden challenges", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-hidden",
      status: ChallengeStatus.HIDDEN,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "challenge-hidden" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should allow deletion of completed challenges", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-completed",
      status: ChallengeStatus.COMPLETED,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: DeleteChallengeInput = { challengeId: "challenge-completed" };
    const program = deleteChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });
});
