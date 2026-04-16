import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateChallengeUseCase,
  type UpdateChallengeInput,
  ChallengeNotFoundError,
  ChallengeUpdateValidationError,
  ChallengeTerminalStateError,
  ChallengeUpdateRepositoryError,
} from "./update";
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
    shouldFailUpdate?: boolean;
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

    update: (challenge: ChallengeDTO) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
    },

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

    delete: () => Effect.succeed(void 0),

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

describe("[UNIT] updateChallengeUseCase", () => {
  it("should update a challenge successfully", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-456",
      title: "Original Title",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-456",
      name: "Updated Title",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Updated Title");
    expect(result.id).toBe("challenge-456");
  });

  it("should fail with ChallengeNotFoundError when challenge not found", async () => {
    const mockGateway = createMockChallengeGateway([]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "non-existent",
      name: "New Title",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
    }
  });

  it("should fail with ChallengeTerminalStateError when challenge is completed", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-completed",
      status: ChallengeStatus.COMPLETED,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-completed",
      name: "New Title",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
      expect(either.left.message).toBe(
        "Cannot update a completed or cancelled challenge",
      );
    }
  });

  it("should fail with ChallengeTerminalStateError when challenge is cancelled", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-cancelled",
      status: ChallengeStatus.CANCELLED,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-cancelled",
      name: "New Title",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeTerminalStateError);
    }
  });

  it("should fail with ChallengeUpdateRepositoryError when database error occurs", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-123",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-123",
      name: "New Title",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeUpdateRepositoryError);
      expect(either.left.message).toBe("Failed to load challenge");
    }
  });

  it("should update challenge with multiple fields", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-multi",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-multi",
      name: "New Name",
      description: "New Description",
      basePoints: 200,
      startTime: new Date("2024-06-01"),
      endTime: new Date("2024-06-30"),
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("New Name");
    expect(result.basePoints).toBe(200);
  });

  it("should allow partial updates", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-partial",
      title: "Original Title",
      description: "Original Description",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeInput = {
      challengeId: "challenge-partial",
      name: "Only Name Updated",
    };

    const program = updateChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Only Name Updated");
  });
});
