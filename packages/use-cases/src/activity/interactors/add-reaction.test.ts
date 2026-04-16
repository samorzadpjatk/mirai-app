import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  addReactionUseCase,
  type AddReactionInput,
  ActivityNotFoundError,
  ActivityHiddenError,
  ReactionCreationError,
  ReactionRepositoryError,
} from "./add-reaction";
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
  initialReactions: ActivityReactionDTO[] = [],
): ActivityFeedGateway {
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  let reactions = [...initialReactions];

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

    findUserReactions: (_activityId: string, userId: string) => {
      const userReactions = reactions.filter((r) => r.userId === userId);
      return Effect.succeed(userReactions);
    },

    addReaction: (reaction: ActivityReactionDTO) => {
      reactions = [...reactions, reaction];
      return Effect.succeed(reaction);
    },

    removeReaction: (
      _activityId: string,
      userId: string,
      reactionType: string,
    ) => {
      reactions = reactions.filter(
        (r) => !(r.userId === userId && r.reactionType === reactionType),
      );
      return Effect.succeed(void 0);
    },

    getReactionCounts: () => {
      const total = reactions.length;
      const counts = {
        heart: reactions.filter((r) => r.reactionType === "heart").length,
        fire: reactions.filter((r) => r.reactionType === "fire").length,
        clap: reactions.filter((r) => r.reactionType === "clap").length,
        star: reactions.filter((r) => r.reactionType === "star").length,
      };
      return Effect.succeed({ total, counts });
    },
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

describe("[UNIT] addReactionUseCase", () => {
  it("should add a new reaction when user has no existing reaction of that type", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      isHidden: false,
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity], []);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: AddReactionInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      userId: "user-789",
      reactionType: "heart",
    };

    const program = addReactionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.activityId).toBe("activity-456");
    expect(result.reactionType).toBe("heart");
    expect(result.isActive).toBe(true);
    expect(result.reactionsSummary.total).toBe(1);
    expect(result.reactionsSummary.counts.heart).toBe(1);
    expect(result.reactionsSummary.myReactions).toContain("heart");
  });

  it("should toggle off reaction when user already has that reaction type", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      isHidden: false,
    });
    const existingReaction: ActivityReactionDTO = {
      id: "reaction-1",
      activityId: "activity-456",
      userId: "user-789",
      reactionType: "heart",
      createdAt: new Date("2024-01-01"),
    };
    const mockGateway = createMockActivityFeedGateway(
      [mockActivity],
      [existingReaction],
    );
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: AddReactionInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      userId: "user-789",
      reactionType: "heart",
    };

    const program = addReactionUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(false);
    expect(result.reactionsSummary.total).toBe(0);
  });

  it("should fail with ActivityNotFoundError when activity does not exist", async () => {
    const mockGateway = createMockActivityFeedGateway([], []);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: AddReactionInput = {
      activityId: "non-existent" as import("@mirai-app/domain").ActivityId,
      userId: "user-789",
      reactionType: "heart",
    };

    const program = addReactionUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityNotFoundError);
    }
  });

  it("should fail with ActivityHiddenError when activity is hidden", async () => {
    const mockActivity = createMockActivityFeedDTO({
      id: "activity-456",
      isHidden: true,
    });
    const mockGateway = createMockActivityFeedGateway([mockActivity], []);
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: AddReactionInput = {
      activityId: "activity-456" as import("@mirai-app/domain").ActivityId,
      userId: "user-789",
      reactionType: "heart",
    };

    const program = addReactionUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityHiddenError);
    }
  });

  it("should handle repository errors when fetching activity", async () => {
    const failingGateway: ActivityFeedGateway = {
      ...createMockActivityFeedGateway(),
      findById: () => Effect.fail(new Error("Database connection failed")),
    };
    const failingLayer = Layer.succeed(ActivityFeedGatewayTag, failingGateway);

    const input: AddReactionInput = {
      activityId: "activity-123" as import("@mirai-app/domain").ActivityId,
      userId: "user-789",
      reactionType: "heart",
    };

    const program = addReactionUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ReactionRepositoryError);
    }
  });
});
