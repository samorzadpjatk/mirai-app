import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  hideActivityUseCase,
  type HideActivityInput,
  HideActivityNotFoundError,
  HideActivityRepositoryError,
} from "./hide";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
} from "../ports/gateway";
import type { ActivityFeedDTO, ActivityReactionDTO } from "../dto";
import { ActivityFeed } from "@mirai-app/domain";

// Store ActivityFeed entities in the mock
const mockActivityStore: Map<string, ActivityFeed> = new Map();

/**
 * Mock ActivityFeedGateway for testing
 * Returns ActivityFeed entities that have hide() and unhide() methods
 */
function createMockActivityFeedGateway(): ActivityFeedGateway {
  return {
    findById: (id: string) => {
      const activity = mockActivityStore.get(id);
      if (!activity) return Effect.succeed(null);
      // Return the entity directly, not a DTO
      return Effect.succeed(activity as unknown as ActivityFeedDTO);
    },

    findByTripId: () =>
      Effect.succeed({
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),

    findByTripIdPaged: () =>
      Effect.succeed({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasMore: false,
      }),

    create: () => Effect.succeed({} as ActivityFeedDTO),

    update: (dto: ActivityFeedDTO) => {
      // Convert DTO back to entity and store
      const existing = mockActivityStore.get(dto.id);
      if (existing) {
        mockActivityStore.set(dto.id, existing);
      }
      return Effect.succeed(dto);
    },

    delete: () => Effect.succeed(void 0),

    exists: (id: string) => Effect.succeed(mockActivityStore.has(id)),

    findReactionsByActivityId: () => Effect.succeed([]),

    findUserReactions: () => Effect.succeed([]),

    addReaction: (reaction: ActivityReactionDTO) => Effect.succeed(reaction),

    removeReaction: () => Effect.succeed(void 0),

    getReactionCounts: () =>
      Effect.succeed({
        total: 0,
        counts: { heart: 0, fire: 0, clap: 0, star: 0 },
      }),
  };
}

describe("[UNIT] hideActivityUseCase", () => {
  it("should successfully hide an existing activity", async () => {
    // Create a visible activity and store it
    const mockActivity = await Effect.runPromise(
      ActivityFeed.create({
        id: "activity-456" as import("@mirai-app/domain").ActivityId,
        tripId: "trip-123",
        activityType: "user_post",
        title: "Test Activity",
        isHidden: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        postMetadata: {
          authorId: "user-123",
          additionalImages: [],
        },
      }),
    );

    mockActivityStore.clear();
    mockActivityStore.set("activity-456", mockActivity);

    const mockGateway = createMockActivityFeedGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: HideActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      hiddenByAdmin: "admin-123",
      reason: "Inappropriate content",
    };

    const program = hideActivityUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.isHidden).toBe(true);
    expect(result.hiddenReason).toBe("Inappropriate content");
  });

  it("should fail with HideActivityNotFoundError when activity does not exist", async () => {
    mockActivityStore.clear();

    const mockGateway = createMockActivityFeedGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: HideActivityInput = {
      activityId: "non-existent" as import("@mirai-app/domain").ActivityId,
      hiddenByAdmin: "admin-123",
    };

    const program = hideActivityUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(HideActivityNotFoundError);
    }
  });

  it("should handle repository errors when fetching activity", async () => {
    mockActivityStore.clear();

    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      findById: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: HideActivityInput = {
      activityId: "activity-123" as import("@mirai-app/domain").ActivityId,
      hiddenByAdmin: "admin-123",
    };

    const program = hideActivityUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(HideActivityRepositoryError);
    }
  });
});
