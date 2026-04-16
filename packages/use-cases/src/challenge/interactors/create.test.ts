import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createChallengeUseCase,
  type CreateChallengeInput,
  ChallengeCreationError,
  ChallengeRepositoryError,
} from "./create";
import { ChallengeGatewayTag, type ChallengeGateway } from "../ports/gateway";
import type { ChallengeDTO } from "../dto";
import {
  DatabaseError,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

// Use correct enum values
const MOCK_SUBMISSION_TYPE = SubmissionType.IMAGE;
const MOCK_SCORING_CATEGORY = ScoringCategory.SPEED;

/**
 * Mock ChallengeGateway for testing
 */
function createMockChallengeGateway(
  options: {
    shouldFailCreate?: boolean;
  } = {},
): ChallengeGateway {
  return {
    create: (challenge: ChallengeDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(challenge);
    },

    findById: () => Effect.succeed(null),

    update: (challenge: ChallengeDTO) => Effect.succeed(challenge),

    updateStatus: (id: string, status: string) =>
      Effect.succeed({
        id,
        tripId: "trip-123",
        title: "Test Challenge",
        description: null,
        status: status as ChallengeStatus,
        submissionType: SubmissionType.IMAGE,
        scoringCategory: ScoringCategory.SPEED,
        points: 100,
        maxPoints: null,
        startDate: new Date(),
        endDate: new Date(),
        createdById: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),

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

describe("[UNIT] createChallengeUseCase", () => {
  it("should create a challenge successfully", async () => {
    const mockGateway = createMockChallengeGateway();
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: CreateChallengeInput = {
      tripId: "trip-123",
      name: "Photo Hunt Challenge",
      description: "Find and photograph landmarks",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.SPEED,
      basePoints: 100,
      status: ChallengeStatus.ACTIVE,
    };

    const program = createChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBeDefined();
    expect(result.tripId).toBe("trip-123");
    expect(result.name).toBe("Photo Hunt Challenge");
    expect(result.basePoints).toBe(100);
    expect(result.status).toBe("ACTIVE");
  });

  it("should fail with ChallengeCreationError when validation fails", async () => {
    const mockGateway = createMockChallengeGateway();
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: CreateChallengeInput = {
      tripId: "trip-123",
      name: "", // Empty name should fail validation
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.SPEED,
    };

    const program = createChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeCreationError);
    }
  });

  it("should fail with ChallengeRepositoryError when database error occurs", async () => {
    const mockGateway = createMockChallengeGateway({
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: CreateChallengeInput = {
      tripId: "trip-123",
      name: "Valid Challenge Name",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.SPEED,
    };

    const program = createChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ChallengeRepositoryError);
      expect(either.left.message).toBe("Failed to create challenge");
    }
  });

  it("should create challenge with default values", async () => {
    const mockGateway = createMockChallengeGateway();
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: CreateChallengeInput = {
      tripId: "trip-123",
      name: "Minimal Challenge",
      submissionType: SubmissionType.TEXT,
      scoringCategory: ScoringCategory.UNLIMITED,
    };

    const program = createChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.basePoints).toBe(0);
    expect(result.status).toBe("HIDDEN");
    expect(result.description).toBeNull();
  });

  it("should create challenge with all optional fields", async () => {
    const mockGateway = createMockChallengeGateway();
    const mockLayer = Layer.succeed(ChallengeGatewayTag, mockGateway);

    const input: CreateChallengeInput = {
      tripId: "trip-123",
      name: "Full Challenge",
      description: "Full description",
      image: "https://example.com/image.jpg",
      submissionType: SubmissionType.IMAGE,
      scoringCategory: ScoringCategory.JUDGED_STAFF,
      isRecurring: true,
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      basePoints: 50,
      firstPlacePoints: 100,
      secondPlacePoints: 75,
      thirdPlacePoints: 50,
      status: ChallengeStatus.ACTIVE,
      startTime: new Date("2024-01-01"),
      endTime: new Date("2024-12-31"),
      targetLatitude: 40.7128,
      targetLongitude: -74.006,
      expectedValue: "completed",
      autoApprove: true,
    };

    const program = createChallengeUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Full Challenge");
    expect(result.basePoints).toBe(50);
  });
});
