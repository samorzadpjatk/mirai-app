import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateActivityUseCase,
  type UpdateActivityInput,
  UpdateActivityNotFoundError,
  UpdateActivityValidationError,
  UpdateActivityRepositoryError,
} from "./update";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
} from "../ports/gateway";
import type { ActivityFeedDTO, ActivityReactionDTO } from "../dto";

/**
 * Mock ActivityFeedGateway for testing
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

    update: (activity: ActivityFeedDTO) => {
      activityMap.set(activity.id, activity);
      return Effect.succeed(activity);
    },

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

describe("[UNIT] updateActivityUseCase", () => {
  it("should successfully update activity title", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      content: "Old Title",
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      title: "New Title",
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.title).toBe("New Title");
  });

  it("should successfully update activity description", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      content: "Title",
      metadata: {},
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      description: "New Description",
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.description).toBe("New Description");
  });

  it("should successfully update activity pinned status", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      isPinned: false,
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      isPinned: true,
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.isPinned).toBe(true);
  });

  it("should successfully update multiple fields at once", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      content: "Old Title",
      isPinned: false,
      metadata: {},
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      title: "New Title",
      description: "New Description",
      isPinned: true,
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("activity-456");
    expect(result.title).toBe("New Title");
    expect(result.description).toBe("New Description");
    expect(result.isPinned).toBe(true);
  });

  it("should fail with UpdateActivityNotFoundError when activity does not exist", async () => {
    const mockGateway = createMockActivityFeedGateway([]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "non-existent" as import("@mirai-app/domain").ActivityId,
      title: "New Title",
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateActivityNotFoundError);
    }
  });

  it("should fail with UpdateActivityValidationError when title is empty", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      content: "Old Title",
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      title: "   ",
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateActivityValidationError);
    }
  });

  it("should handle repository errors when fetching activity", async () => {
    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      findById: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: UpdateActivityInput = {
      activityId: "activity-123" as import("@mirai-app/domain").ActivityId,
      title: "New Title",
    };

    const program = updateActivityUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateActivityRepositoryError);
    }
  });
});
