import { describe, it, expect, beforeEach } from "bun:test";
import {
  getActivityFeedUseCase,
  type GetActivityFeedInput,
  ActivityFeedQueryError,
} from "./GetActivityFeed";
import {
  ActivityFeed,
  ActivityReaction,
  type ActivityId,
} from "@mirai-app/domain";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";
import { Effect, Either } from "effect";

// Mock ActivityFeed domain object
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    tripId: "trip-123",
    activityType: "custom",
    title: "Test Activity",
    description: "Test description",
    imageUrl: "image.jpg",
    isPinned: false,
    isHidden: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    admin: {
      id: "admin-123",
      firstName: "John",
      lastName: "Doe",
    },
    ...overrides,
  }) as ActivityFeed;

// Helper to create an in-memory repository for testing
const createInMemoryRepository = (initialActivities: ActivityFeed[] = []) => {
  const activities = [...initialActivities];

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
        let filtered = activities.filter((a) => a.tripId === tripId);

        // Filter hidden if needed
        if (!options?.includeHidden) {
          filtered = filtered.filter((a) => !a.isHidden);
        }

        // Apply limit
        const limit = options?.limit ?? 30;
        const hasMore = filtered.length > limit;
        filtered = filtered.slice(0, limit);

        return {
          activities: filtered,
          nextCursor:
            filtered.length > 0
              ? {
                  id: filtered[filtered.length - 1].id,
                  createdAt: filtered[filtered.length - 1].createdAt,
                  isPinned: filtered[filtered.length - 1].isPinned,
                }
              : null,
          hasMore,
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
      Effect.promise(async () => []),
    findUserReactions: (activityId: string, userId: string) =>
      Effect.promise(async () => []),
    addReaction: (reaction: ActivityReaction) => Effect.succeed(reaction),
    removeReaction: (
      activityId: string,
      userId: string,
      reactionType: string,
    ) => Effect.promise(async () => {}),
    getReactionCounts: (activityId: string) =>
      Effect.promise(async () => ({
        total: 0,
        counts: { heart: 0, fire: 0, clap: 0, star: 0 },
      })),
  };
};

describe("[UNIT] getActivityFeedUseCase (Effect)", () => {
  // Helper to run use case with repository
  const runUseCase = async (
    input: GetActivityFeedInput,
    activities: ActivityFeed[] = [],
  ) => {
    const repo = createInMemoryRepository(activities);
    const program = getActivityFeedUseCase(input).pipe(
      Effect.provideService(ActivityFeedRepositoryTag, repo),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return empty feed when no activities", async () => {
      const input: GetActivityFeedInput = { tripId: "trip-123" };

      const result = await runUseCase(input);

      expect(result.activities).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.pageSize).toBe(30); // default
    });

    it("should return activities for trip", async () => {
      const mockActivities = [
        createMockActivity({ id: "activity-1" as ActivityId }),
        createMockActivity({
          id: "activity-2" as ActivityId,
          title: "Another Activity",
          isPinned: true,
        }),
      ];

      const input: GetActivityFeedInput = { tripId: "trip-123" };
      const result = await runUseCase(input, mockActivities);

      expect(result.activities).toHaveLength(2);
      expect(result.activities[0].id).toBe("activity-1");
      expect(result.activities[1].id).toBe("activity-2");
    });

    it("should use custom page size when provided", async () => {
      const input: GetActivityFeedInput = { tripId: "trip-123", pageSize: 50 };

      const result = await runUseCase(input);

      expect(result.pagination.pageSize).toBe(50);
    });

    it("should pass cursor for pagination", async () => {
      const mockActivities = Array.from({ length: 5 }, (_, i) =>
        createMockActivity({
          id: `activity-${i + 1}` as ActivityId,
          tripId: "trip-123",
          createdAt: new Date(Date.now() - i * 1000),
        }),
      );

      const cursor = {
        id: "cursor-id",
        createdAt: new Date("2024-01-01"),
        isPinned: false,
      };
      const input: GetActivityFeedInput = {
        tripId: "trip-123",
        cursor,
        pageSize: 20,
      };

      const result = await runUseCase(input, mockActivities);

      expect(result.pagination.hasMore).toBe(false);
    });

    it("should handle null cursor", async () => {
      const mockActivities = [createMockActivity()];

      const input: GetActivityFeedInput = {
        tripId: "trip-123",
        cursor: null,
      };
      const result = await runUseCase(input, mockActivities);

      expect(result.nextCursor).toBeDefined();
    });

    it("should map activity fields correctly", async () => {
      const mockActivity = createMockActivity({
        id: "activity-123" as ActivityId,
        tripId: "trip-456",
        activityType: "challenge_event",
        title: "Challenge Started!",
        description: "A new challenge has begun",
        imageUrl: "challenge.jpg",
        isPinned: true,
        isHidden: false,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-16"),
        admin: {
          id: "admin-789",
          firstName: "Jane",
          lastName: "Smith",
        },
      });

      const input: GetActivityFeedInput = { tripId: "trip-456" };
      const result = await runUseCase(input, [mockActivity]);

      expect(result.activities).toHaveLength(1);
      const activity = result.activities[0];
      expect(activity.tripId).toBe("trip-456");
      expect(activity.activityType).toBe("challenge_event");
      expect(activity.title).toBe("Challenge Started!");
      expect(activity.description).toBe("A new challenge has begun");
      expect(activity.imageUrl).toBe("challenge.jpg");
      expect(activity.isPinned).toBe(true);
      expect(activity.isHidden).toBe(false);
      expect(activity.admin).toEqual({
        id: "admin-789",
        firstName: "Jane",
        lastName: "Smith",
      });
    });

    it("should handle activities with null admin", async () => {
      const mockActivity = createMockActivity({
        admin: null,
      });

      const input: GetActivityFeedInput = { tripId: "trip-123" };
      const result = await runUseCase(input, [mockActivity]);

      expect(result.activities[0].admin).toBeNull();
    });
  });
});
