import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getChallengeUseCase,
  type GetChallengeInput,
  ChallengeNotFoundError,
  ChallengeLoadError,
} from "./get";
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
    status: overrides.status ?? ChallengeStatus.ACTIVE,
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

describe("[UNIT] getChallengeUseCase", () => {
  it("should return challenge when found by ID", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-456",
      title: "Photo Hunt",
      description: "Find and photograph landmarks",
      points: 200,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "challenge-456" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("challenge-456");
    expect(result.name).toBe("Photo Hunt");
    expect(result.basePoints).toBe(200);
    expect(result.isActive).toBe(true);
  });

  it("should fail with ChallengeNotFoundError when challenge not found", async () => {
    const mockGateway = createMockChallengeGateway([]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "non-existent" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeNotFoundError);
    }
  });

  it("should fail with ChallengeLoadError when database error occurs", async () => {
    const mockGateway = createMockChallengeGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "challenge-123" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeLoadError);
      expect(either.left.message).toBe("Failed to load challenge");
    }
  });

  it("should return correct computed properties for active challenge", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-active",
      status: ChallengeStatus.ACTIVE,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "challenge-active" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(true);
  });

  it("should return challenge with null description", async () => {
    const mockChallenge = createMockChallengeDTO({
      id: "challenge-no-desc",
      description: null,
    });
    const mockGateway = createMockChallengeGateway([mockChallenge]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "challenge-no-desc" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.description).toBeNull();
  });

  it("should include challengeId in error when challenge not found", async () => {
    const mockGateway = createMockChallengeGateway([]);
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: GetChallengeInput = { challengeId: "missing-challenge" };
    const program = getChallengeUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (
      either._tag === "Left" &&
      either.left instanceof ChallengeNotFoundError
    ) {
      expect(either.left.challengeId).toBe("missing-challenge");
    }
  });
});
