import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getActivityFeedUseCase,
  type GetActivityFeedInput,
  ActivityFeedQueryError,
} from "./get-feed";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
} from "../ports/gateway";
import type { ActivityFeedDTO, ActivityReactionDTO } from "../dto";

/**
 * Mock ActivityFeedGateway for testing
 * Note: The use case expects { activities, nextCursor, hasMore } not { items, total, ... }
 */
function createMockActivityFeedGateway(
  activities: ActivityFeedDTO[] = [],
): ActivityFeedGateway {
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  return {
    findById: (id: string) => {
      const activity = activityMap.get(id);
      return Effect.succeed(activity ?? null);
    },

    findByTripId: (
      tripId: string,
      options?: {
        limit?: number;
        cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
        includeHidden?: boolean;
      },
    ) => {
      const filtered = activities.filter((a) => a.tripId === tripId);
      const limit = options?.limit ?? 30;
      const result = filtered.slice(0, limit);
      const hasMore = filtered.length > limit;
      const lastActivity = result[result.length - 1];

      // Return structure matches what use case expects: { activities, nextCursor, hasMore }
      return Effect.succeed({
        activities: result,
        nextCursor:
          hasMore && lastActivity
            ? {
                id: lastActivity.id,
                createdAt: lastActivity.createdAt,
                isPinned: lastActivity.isPinned,
              }
            : null,
        hasMore,
      } as unknown as import("../dto").ActivityCursorResult);
    },

    findByTripIdPaged: () =>
      Effect.succeed({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
        hasMore: false,
      }),

    create: (activity: ActivityFeedDTO) => {
      activityMap.set(activity.id, activity);
      return Effect.succeed(activity);
    },

    update: (activity: ActivityFeedDTO) => Effect.succeed(activity),

    delete: () => Effect.succeed(void 0),

    exists: (id: string) => Effect.succeed(activityMap.has(id)),

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

function createMockActivityFeedDTO(
  overrides: Partial<ActivityFeedDTO> = {},
): ActivityFeedDTO {
  return {
    id: overrides.id ?? "activity-123",
    tripId: overrides.tripId ?? "trip-123",
    userId: overrides.userId ?? "user-123",
    activityType: overrides.activityType ?? "CHECK_IN",
    content: overrides.content ?? "Test Activity",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    isPinned: overrides.isPinned ?? false,
    isHidden: overrides.isHidden ?? false,
    metadata: overrides.metadata ?? {},
  };
}

describe("[UNIT] getActivityFeedUseCase", () => {
  it("should return paginated activities for a trip", async () => {
    const mockActivities = [
      createMockActivityFeedDTO({ id: "activity-1", tripId: "trip-456" }),
      createMockActivityFeedDTO({ id: "activity-2", tripId: "trip-456" }),
      createMockActivityFeedDTO({ id: "activity-3", tripId: "trip-456" }),
    ];
    const mockGateway = createMockActivityFeedGateway(mockActivities);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: GetActivityFeedInput = {
      tripId: "trip-456",
      pageSize: 10,
    };

    const program = getActivityFeedUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activities).toHaveLength(3);
    expect(result.activities[0].id).toBe("activity-1");
    expect(result.activities[1].id).toBe("activity-2");
    expect(result.activities[2].id).toBe("activity-3");
    expect(result.pagination.pageSize).toBe(10);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("should handle cursor-based pagination", async () => {
    const mockActivities = Array.from({ length: 35 }, (_, i) =>
      createMockActivityFeedDTO({
        id: `activity-${i + 1}`,
        tripId: "trip-456",
        createdAt: new Date(2024, 0, i + 1),
      }),
    );
    const mockGateway = createMockActivityFeedGateway(mockActivities);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: GetActivityFeedInput = {
      tripId: "trip-456",
      pageSize: 30,
    };

    const program = getActivityFeedUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activities).toHaveLength(30);
    expect(result.pagination.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
  });

  it("should return empty array when trip has no activities", async () => {
    const mockGateway = createMockActivityFeedGateway([]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: GetActivityFeedInput = {
      tripId: "empty-trip",
      pageSize: 10,
    };

    const program = getActivityFeedUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activities).toHaveLength(0);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("should handle repository errors", async () => {
    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      findByTripId: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: GetActivityFeedInput = {
      tripId: "trip-123",
      pageSize: 10,
    };

    const program = getActivityFeedUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityFeedQueryError);
    }
  });
});
