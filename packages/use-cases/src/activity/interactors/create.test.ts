import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createActivityUseCase,
  type CreateActivityInput,
  ActivityCreationError,
  ActivityRepositoryError,
} from "./create";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
} from "../ports/gateway";
import type { ActivityFeedDTO } from "../dto";

/**
 * Mock ActivityFeedGateway for testing
 */
function createMockActivityGateway(
  options: {
    shouldFailCreate?: boolean;
  } = {},
): ActivityFeedGateway {
  const activityMap = new Map<string, ActivityFeedDTO>();

  return {
    findById: (id: string) => {
      const activity = activityMap.get(id);
      return Effect.succeed(activity ?? null);
    },

    findByTripId: () =>
      Effect.succeed({
        items: Array.from(activityMap.values()),
        total: activityMap.size,
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
      if (options.shouldFailCreate) {
        return Effect.fail(new Error("Database error") as never);
      }
      activityMap.set(activity.id, activity);
      return Effect.succeed(activity);
    },

    update: (activity: ActivityFeedDTO) => Effect.succeed(activity),

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    findReactionsByActivityId: () => Effect.succeed([]),

    findUserReactions: () => Effect.succeed([]),

    addReaction: (reaction) => Effect.succeed(reaction),

    removeReaction: () => Effect.succeed(void 0),

    getReactionCounts: () =>
      Effect.succeed({
        total: 0,
        counts: { heart: 0, fire: 0, clap: 0, star: 0 },
      }),
  };
}

describe("[UNIT] createActivityUseCase", () => {
  it("should create an activity successfully", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-123",
      activityType: "custom",
      title: "Test Activity",
      description: "Test description",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.tripId).toBe("trip-123");
    expect(result.activityType).toBe("custom");
    expect(result.title).toBe("Test Activity");
    expect(result.description).toBe("Test description");
    expect(result.isPinned).toBe(false);
    expect(result.isHidden).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should create activity with default values", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-456",
      activityType: "custom",
      title: "Minimal Activity",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.description).toBeNull();
    expect(result.imageUrl).toBeNull();
    expect(result.isPinned).toBe(false);
  });

  it("should fail with ActivityCreationError for empty title", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-789",
      activityType: "custom",
      title: "",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityCreationError);
    }
  });

  it("should fail with ActivityCreationError for whitespace-only title", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-abc",
      activityType: "custom",
      title: "   ",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityCreationError);
    }
  });

  it("should create submission activity with metadata", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-def",
      activityType: "submission",
      title: "Submission Activity",
      submissionActivity: {
        submissionId: "sub-123",
        challengeId: "chal-456",
        groupId: "group-789",
        hasVideo: true,
        isWinner: true,
        ranking: 1,
        pointsAwarded: 100,
        currentGroupRank: 2,
      },
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activityType).toBe("submission");
    expect(result.title).toBe("Submission Activity");
  });

  it("should create challenge event activity with metadata", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-ghi",
      activityType: "challenge_event",
      title: "Challenge Started",
      challengeActivity: {
        challengeId: "chal-789",
        eventType: "challenge_started",
        endTime: new Date("2024-12-31"),
        submissionType: "photo",
        basePoints: 50,
        submissionCount: 10,
      },
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activityType).toBe("challenge_event");
  });

  it("should create rank change activity with metadata", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-jkl",
      activityType: "rank_change",
      title: "Rank Up!",
      rankChangeActivity: {
        groupId: "group-123",
        newRank: 3,
        totalCoins: 500,
        coinsGained: 50,
      },
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.activityType).toBe("rank_change");
  });

  it("should fail with ActivityCreationError for submission type without metadata", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-mno",
      activityType: "submission",
      title: "Invalid Submission Activity",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityCreationError);
    }
  });

  it("should fail with ActivityCreationError for challenge_event type without metadata", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-pqr",
      activityType: "challenge_event",
      title: "Invalid Challenge Activity",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityCreationError);
    }
  });

  it("should handle repository errors gracefully", async () => {
    const mockGateway = createMockActivityGateway({ shouldFailCreate: true });
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-stu",
      activityType: "custom",
      title: "Test Activity",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ActivityRepositoryError);
    }
  });

  it("should create activity with imageUrl", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-vwx",
      activityType: "custom",
      title: "Activity with Image",
      imageUrl: "https://example.com/image.jpg",
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.imageUrl).toBe("https://example.com/image.jpg");
  });

  it("should create pinned activity", async () => {
    const mockGateway = createMockActivityGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);

    const input: CreateActivityInput = {
      tripId: "trip-yz",
      activityType: "custom",
      title: "Pinned Activity",
      isPinned: true,
    };

    const program = createActivityUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isPinned).toBe(true);
  });
});
