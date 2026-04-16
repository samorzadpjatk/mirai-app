import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getActivityByIdUseCase,
  type GetActivityByIdInput,
  ActivityNotFoundError,
  ActivityRepositoryError,
} from "./get-by-id";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
} from "../ports/gateway";
import type { ActivityFeedDTO, ActivityReactionDTO } from "../dto";

/**
 * Mock ActivityFeedGateway for testing
 */
function createMockActivityFeedGateway(
  activities: (ActivityFeedDTO & {
    title: string;
    description: string | null;
    imageUrl: string | null;
    admin: { id: string; firstName: string; lastName: string } | null;
  })[] = [],
): ActivityFeedGateway {
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  return {
    findById: (id: string) => {
      const activity = activityMap.get(id);
      return Effect.succeed(activity ?? null);
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
  overrides: Partial<
    ActivityFeedDTO & {
      title: string;
      description: string | null;
      imageUrl: string | null;
      admin: { id: string; firstName: string; lastName: string } | null;
    }
  > = {},
): ActivityFeedDTO & {
  title: string;
  description: string | null;
  imageUrl: string | null;
  admin: { id: string; firstName: string; lastName: string } | null;
} {
  return {
    id: overrides.id ?? "activity-123",
    tripId: overrides.tripId ?? "trip-123",
    userId: overrides.userId ?? "user-123",
    activityType: overrides.activityType ?? "CHECK_IN",
    content: overrides.content ?? "Test Activity",
    title: overrides.title ?? "Test Title",
    description: overrides.description ?? null,
    imageUrl: overrides.imageUrl ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    isPinned: overrides.isPinned ?? false,
    isHidden: overrides.isHidden ?? false,
    metadata: overrides.metadata ?? {},
    admin: overrides.admin ?? null,
  };
}

describe("[UNIT] getActivityByIdUseCase", () => {
  it("should return activity when found by ID", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      tripId: "trip-789",
      title: "Test Title",
      description: "Test Description",
      activityType: "CHECK_IN",
      isPinned: true,
      isHidden: false,
      admin: { id: "admin-1", firstName: "John", lastName: "Doe" },
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: GetActivityByIdInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
    };

    const program = getActivityByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.tripId).toBe("trip-789");
    expect(result.title).toBe("Test Title");
    expect(result.description).toBe("Test Description");
    expect(result.activityType).toBe("CHECK_IN");
    expect(result.isPinned).toBe(true);
    expect(result.isHidden).toBe(false);
    expect(result.admin).toEqual({
      id: "admin-1",
      firstName: "John",
      lastName: "Doe",
    });
  });

  it("should fail with ActivityNotFoundError when activity does not exist", async () => {
    const mockGateway = createMockActivityFeedGateway([]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: GetActivityByIdInput = {
      activityId: "non-existent" as import("@mirai-app/domain").ActivityId,
    };

    const program = getActivityByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityNotFoundError);
    }
  });

  it("should handle repository errors when fetching activity", async () => {
    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      findById: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: GetActivityByIdInput = {
      activityId: "activity-123" as import("@mirai-app/domain").ActivityId,
    };

    const program = getActivityByIdUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityRepositoryError);
    }
  });
});
