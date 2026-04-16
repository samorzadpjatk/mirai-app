import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteActivityUseCase,
  type DeleteActivityInput,
  DeleteActivityNotFoundError,
  DeleteActivityRepositoryError,
} from "./delete";
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
        activities: [],
        nextCursor: null,
        hasMore: false,
      }),

    findByTripIdPaged: () =>
      Effect.succeed({
        nodes: [],
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    create: (activity: ActivityFeedDTO) => {
      activityMap.set(activity.id, activity);
      return Effect.succeed(activity);
    },

    update: (activity: ActivityFeedDTO) => Effect.succeed(activity),

    delete: (id: string) => {
      activityMap.delete(id);
      return Effect.succeed(void 0);
    },

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

describe("[UNIT] deleteActivityUseCase", () => {
  it("should successfully delete an existing activity", async () => {
    const mockActivity = createMockActivityFeedDTO({ id: "activity-456" });
    const mockGateway = createMockActivityFeedGateway([mockActivity]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: DeleteActivityInput = {
      activityId: "activity-456",
    };

    const program = deleteActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedActivityId).toBe("activity-456");
  });

  it("should fail with DeleteActivityNotFoundError when activity does not exist", async () => {
    const mockGateway = createMockActivityFeedGateway([]);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: DeleteActivityInput = {
      activityId: "non-existent",
    };

    const program = deleteActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteActivityNotFoundError);
    }
  });

  it("should handle repository errors when checking activity existence", async () => {
    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      exists: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: DeleteActivityInput = {
      activityId: "activity-123",
    };

    const program = deleteActivityUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteActivityRepositoryError);
    }
  });
});
