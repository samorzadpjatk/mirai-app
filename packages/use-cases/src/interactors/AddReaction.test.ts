import { describe, it, expect, beforeEach } from "bun:test";
import {
  addReactionUseCase,
  type AddReactionInput,
  ActivityNotFoundError,
  ActivityHiddenError,
  ReactionCreationError,
  ReactionRepositoryError,
} from "./AddReaction";
import {
  ActivityFeed,
  ActivityReaction,
  type ActivityId,
  type ReactionType,
} from "@mirai-app/domain";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";
import { Effect, Either } from "effect";

// Mock domain objects
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    isHidden: false,
    tripId: "trip-123",
    activityType: "custom",
    title: "Test Activity",
    description: null,
    imageUrl: null,
    isPinned: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    admin: null,
    ...overrides,
  }) as ActivityFeed;

const createMockReaction = (
  overrides?: Partial<ActivityReaction>,
): ActivityReaction =>
  ({
    id: "reaction-123",
    activityId: "activity-123" as ActivityId,
    userId: "user-123",
    reactionType: "heart" as ReactionType,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as ActivityReaction;

// Helper to create an in-memory repository for testing
const createInMemoryRepository = (options?: {
  initialActivities?: ActivityFeed[];
  initialReactions?: ActivityReaction[];
}) => {
  const activities = [...(options?.initialActivities ?? [])];
  const reactions = [...(options?.initialReactions ?? [])];

  return {
    create: (activity: ActivityFeed) =>
      Effect.promise(async () => {
        activities.push(activity);
        return activity;
      }),
    findById: (id: string) =>
      Effect.promise(async () => {
        return activities.find((a) => a.id === id) ?? null;
      }),
    findByTripId: (
      tripId: string,
      options?: {
        limit?: number;
        cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
        includeHidden?: boolean;
      },
    ) =>
      Effect.promise(async () => {
        const filtered = activities.filter((a) => a.tripId === tripId);
        return {
          activities: filtered,
          nextCursor: null,
          hasMore: false,
        };
      }),
    findByTripIdPaged: (
      tripId: string,
      options: {
        page: number;
        pageSize: number;
        includeHidden?: boolean;
      },
    ) =>
      Effect.promise(async () => {
        const filtered = activities.filter((a) => a.tripId === tripId);
        return {
          activities: filtered,
          total: filtered.length,
          page: options.page,
          pageSize: options.pageSize,
          totalPages: Math.ceil(filtered.length / options.pageSize),
          hasMore: false,
        };
      }),
    update: (activity: ActivityFeed) =>
      Effect.promise(async () => {
        const index = activities.findIndex((a) => a.id === activity.id);
        if (index >= 0) {
          activities[index] = activity;
        }
        return activity;
      }),
    delete: (id: string) =>
      Effect.promise(async () => {
        const index = activities.findIndex((a) => a.id === id);
        if (index >= 0) {
          activities.splice(index, 1);
        }
      }),
    exists: (id: string) =>
      Effect.promise(async () => {
        return activities.some((a) => a.id === id);
      }),
    findReactionsByActivityId: (activityId: string) =>
      Effect.promise(async () => {
        return reactions.filter((r) => r.activityId === activityId);
      }),
    findUserReactions: (activityId: string, userId: string) =>
      Effect.promise(async () => {
        return reactions.filter(
          (r) => r.activityId === activityId && r.userId === userId,
        );
      }),
    addReaction: (reaction: ActivityReaction) =>
      Effect.promise(async () => {
        reactions.push(reaction);
        return reaction;
      }),
    removeReaction: (
      activityId: string,
      userId: string,
      reactionType: string,
    ) =>
      Effect.promise(async () => {
        const index = reactions.findIndex(
          (r) =>
            r.activityId === activityId &&
            r.userId === userId &&
            r.reactionType === reactionType,
        );
        if (index >= 0) {
          reactions.splice(index, 1);
        }
      }),
    getReactionCounts: (activityId: string) =>
      Effect.promise(async () => {
        const activityReactions = reactions.filter(
          (r) => r.activityId === activityId,
        );
        return {
          total: activityReactions.length,
          counts: {
            heart: activityReactions.filter((r) => r.reactionType === "heart")
              .length,
            fire: activityReactions.filter((r) => r.reactionType === "fire")
              .length,
            clap: activityReactions.filter((r) => r.reactionType === "clap")
              .length,
            star: activityReactions.filter((r) => r.reactionType === "star")
              .length,
          },
        };
      }),
  };
};

describe("[UNIT] addReactionUseCase (Effect)", () => {
  // Helper to run use case with repository
  const runUseCase = async (
    input: AddReactionInput,
    options?: {
      initialActivities?: ActivityFeed[];
      initialReactions?: ActivityReaction[];
    },
  ) => {
    const repo = createInMemoryRepository(options);
    const program = addReactionUseCase(input).pipe(
      Effect.provideService(ActivityFeedRepositoryTag, repo),
    );
    return await Effect.runPromise(program);
  };

  // Helper to run use case and get Either for error testing
  const runUseCaseEither = async (
    input: AddReactionInput,
    options?: {
      initialActivities?: ActivityFeed[];
      initialReactions?: ActivityReaction[];
    },
  ) => {
    const repo = createInMemoryRepository(options);
    const program = addReactionUseCase(input).pipe(
      Effect.provideService(ActivityFeedRepositoryTag, repo),
    );
    return await Effect.runPromise(Effect.either(program));
  };

  describe("execute", () => {
    it("should add new reaction when user has no existing reaction of same type", async () => {
      const activity = createMockActivity();
      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await runUseCase(input, { initialActivities: [activity] });

      expect(result.activityId).toBe("activity-123");
      expect(result.reactionType).toBe("heart");
      expect(result.isActive).toBe(true);
      expect(result.reactionsSummary.total).toBe(1);
    });

    it("should remove reaction when user already has same reaction type", async () => {
      const activity = createMockActivity();
      const existingReaction = createMockReaction({
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      });

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await runUseCase(input, {
        initialActivities: [activity],
        initialReactions: [existingReaction],
      });

      expect(result.isActive).toBe(false);
      expect(result.reactionsSummary.total).toBe(0);
    });

    it("should return error when activity not found", async () => {
      const input: AddReactionInput = {
        activityId: "nonexistent" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const either = await runUseCaseEither(input);

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ActivityNotFoundError);
      }
    });

    it("should return error when activity is hidden", async () => {
      const hiddenActivity = createMockActivity({ isHidden: true });

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const either = await runUseCaseEither(input, {
        initialActivities: [hiddenActivity],
      });

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ActivityHiddenError);
      }
    });

    it("should add different reaction type even if user has other reaction", async () => {
      const activity = createMockActivity();
      const existingReaction = createMockReaction({
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "fire" as ReactionType,
      });

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await runUseCase(input, {
        initialActivities: [activity],
        initialReactions: [existingReaction],
      });

      expect(result.isActive).toBe(true);
      expect(result.reactionType).toBe("heart");
    });

    it("should return updated reaction counts", async () => {
      const activity = createMockActivity();
      const reactions = [
        createMockReaction({
          activityId: "activity-123" as ActivityId,
          userId: "user-1",
          reactionType: "heart" as ReactionType,
        }),
        createMockReaction({
          activityId: "activity-123" as ActivityId,
          userId: "user-2",
          reactionType: "heart" as ReactionType,
        }),
        createMockReaction({
          activityId: "activity-123" as ActivityId,
          userId: "user-3",
          reactionType: "fire" as ReactionType,
        }),
        createMockReaction({
          activityId: "activity-123" as ActivityId,
          userId: "user-123",
          reactionType: "fire" as ReactionType,
        }),
      ];

      const input: AddReactionInput = {
        activityId: "activity-123" as ActivityId,
        userId: "user-123",
        reactionType: "heart" as ReactionType,
      };

      const result = await runUseCase(input, {
        initialActivities: [activity],
        initialReactions: reactions,
      });

      expect(result.reactionsSummary.total).toBe(5); // 4 existing + 1 new
      expect(result.reactionsSummary.counts).toEqual({
        heart: 3,
        fire: 2,
        clap: 0,
        star: 0,
      });
      expect(result.reactionsSummary.myReactions).toContain("heart");
      expect(result.reactionsSummary.myReactions).toContain("fire");
      expect(result.reactionsSummary.myReactions).toHaveLength(2);
    });

    it("should handle different reaction types", async () => {
      const activity = createMockActivity();
      const reactionTypes: ReactionType[] = ["heart", "fire", "clap", "star"];

      for (const reactionType of reactionTypes) {
        // Create fresh repo for each iteration
        const repo = createInMemoryRepository({
          initialActivities: [activity],
          initialReactions: [],
        });

        const input: AddReactionInput = {
          activityId: "activity-123" as ActivityId,
          userId: `user-${reactionType}`,
          reactionType,
        };

        const program = addReactionUseCase(input).pipe(
          Effect.provideService(ActivityFeedRepositoryTag, repo),
        );
        const result = await Effect.runPromise(program);

        expect(result.reactionType).toBe(reactionType);
        expect(result.isActive).toBe(true);
      }
    });
  });
});
