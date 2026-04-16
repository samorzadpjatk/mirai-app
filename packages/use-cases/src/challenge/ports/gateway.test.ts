import { describe, it, expect } from "bun:test";
import { Effect, Context } from "effect";
import type { ChallengeGateway } from "./gateway";
import { ChallengeGatewayTag } from "./gateway";
import type { ChallengeDTO } from "../dto";
import {
  DatabaseError,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

describe("[UNIT] ChallengeGatewayTag", () => {
  it("should be a valid Context.Tag", () => {
    expect(ChallengeGatewayTag).toBeDefined();
    expect(ChallengeGatewayTag.key).toBe("ChallengeGateway");
  });

  it("should have correct key", () => {
    expect(ChallengeGatewayTag.key).toBe("ChallengeGateway");
  });
});

describe("[UNIT] ChallengeGateway Interface Contract", () => {
  const mockChallengeDTO: ChallengeDTO = {
    id: "challenge-123",
    tripId: "trip-123",
    title: "Photo Challenge",
    description: "Take a creative photo",
    status: ChallengeStatus.ACTIVE,
    scoringCategory: ScoringCategory.EXPLORATION,
    points: 100,
    maxPoints: null,
    startDate: new Date(),
    endDate: null,
    createdById: "user-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("create method should return Effect<ChallengeDTO, DatabaseError>", async () => {
    const mockGateway: ChallengeGateway = {
      create: () => Effect.succeed(mockChallengeDTO),
      findById: () => Effect.succeed(null),
      update: () => Effect.succeed(mockChallengeDTO),
      updateStatus: () => Effect.succeed(mockChallengeDTO),
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

    const result = await Effect.runPromise(
      mockGateway.create(mockChallengeDTO),
    );
    expect(result.id).toBe("challenge-123");
    expect(result.title).toBe("Photo Challenge");
  });

  it("findById should return null when challenge not found", async () => {
    const mockGateway: ChallengeGateway = {
      create: () => Effect.succeed(mockChallengeDTO),
      findById: () => Effect.succeed(null),
      update: () => Effect.succeed(mockChallengeDTO),
      updateStatus: () => Effect.succeed(mockChallengeDTO),
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

    const result = await Effect.runPromise(
      mockGateway.findById("non-existent"),
    );
    expect(result).toBeNull();
  });

  it("should handle DatabaseError from create", async () => {
    const failingGateway: ChallengeGateway = {
      create: () =>
        Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database connection failed",
          }),
        ),
      findById: () => Effect.succeed(null),
      update: () => Effect.succeed(mockChallengeDTO),
      updateStatus: () => Effect.succeed(mockChallengeDTO),
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

    const effect = failingGateway.create(mockChallengeDTO);
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
  });

  it("countByTripId should return number", async () => {
    const mockGateway: ChallengeGateway = {
      create: () => Effect.succeed(mockChallengeDTO),
      findById: () => Effect.succeed(null),
      update: () => Effect.succeed(mockChallengeDTO),
      updateStatus: () => Effect.succeed(mockChallengeDTO),
      delete: () => Effect.succeed(void 0),
      exists: () => Effect.succeed(false),
      countByTripId: () => Effect.succeed(10),
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

    const result = await Effect.runPromise(
      mockGateway.countByTripId("trip-123"),
    );
    expect(result).toBe(10);
  });
});
