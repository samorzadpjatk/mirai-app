import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateChallengeStatusUseCase,
  type UpdateChallengeStatusInput,
  ChallengeNotFoundError,
  InvalidStatusTransitionError,
  ChallengeUpdateError,
} from "./update-status";
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
): ChallengeGateway {
  const challengeMap = new Map(challenges.map((c) => [c.id, c]));

  return {
    create: (challenge: ChallengeDTO) => {
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
    },

    findById: (id: string) => {
      const challenge = challengeMap.get(id);
      return Effect.succeed(challenge ?? null);
    },

    update: (challenge: ChallengeDTO) => {
      challengeMap.set(challenge.id, challenge);
      return Effect.succeed(challenge);
    },

    updateStatus: (id: string, status: string) => {
      const challenge = challengeMap.get(id);
      if (challenge) {
        const updated = {
          ...challenge,
          status: status as ChallengeStatus,
        };
        challengeMap.set(id, updated);
        return Effect.succeed(updated);
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
    status: overrides.status ?? ChallengeStatus.HIDDEN,
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

describe("[UNIT] updateChallengeStatusUseCase", () => {
  it("should update challenge status successfully", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-456",
      status: ChallengeStatus.HIDDEN,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-456",
      newStatus: ChallengeStatus.VISIBLE,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("challenge-456");
    expect(result.previousStatus).toBe("HIDDEN");
    expect(result.newStatus).toBe("VISIBLE");
  });

  it("should fail with ChallengeNotFoundError when challenge not found", async () => {
    const mockGateway = createMockChallengeGateway([]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "non-existent",
      newStatus: ChallengeStatus.ACTIVE,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
    }
  });

  it("should fail with InvalidStatusTransitionError for invalid transition", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-hidden",
      status: ChallengeStatus.HIDDEN,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-hidden",
      newStatus: ChallengeStatus.COMPLETED,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(InvalidStatusTransitionError);
      expect(either.left.fromStatus).toBe("HIDDEN");
      expect(either.left.toStatus).toBe("COMPLETED");
    }
  });

  it("should allow valid status transition from HIDDEN to VISIBLE", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-1",
      status: ChallengeStatus.HIDDEN,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-1",
      newStatus: ChallengeStatus.VISIBLE,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.newStatus).toBe("VISIBLE");
  });

  it("should allow valid status transition from VISIBLE to ACTIVE", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-2",
      status: ChallengeStatus.VISIBLE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-2",
      newStatus: ChallengeStatus.ACTIVE,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.newStatus).toBe("ACTIVE");
  });

  it("should allow transition to CANCELLED from any non-terminal state", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-3",
      status: ChallengeStatus.ACTIVE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-3",
      newStatus: ChallengeStatus.CANCELLED,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.newStatus).toBe("CANCELLED");
  });

  it("should include updatedAt timestamp in output", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-ts",
      status: ChallengeStatus.HIDDEN,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: UpdateChallengeStatusInput = {
      challengeId: "challenge-ts",
      newStatus: ChallengeStatus.VISIBLE,
    };

    const program = updateChallengeStatusUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
