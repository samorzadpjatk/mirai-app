import { describe, it, expect, beforeEach } from "bun:test";
import {
  createActivityUseCase,
  type CreateActivityInput,
  ActivityCreationError,
  ActivityRepositoryError,
} from "./CreateActivity";
import { ActivityFeed, ActivityReaction } from "@mirai-app/domain";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";
import { Effect, Either } from "effect";

// Helper to create an in-memory repository for testing
const createInMemoryRepository = () => {
  const activities: ActivityFeed[] = [];

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

describe("[UNIT] createActivityUseCase (Effect)", () => {
  // Helper to create a valid activity input
  const createValidInput = (): CreateActivityInput => ({
    tripId: "trip-123",
    activityType: "custom",
    title: "Test Activity",
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateActivityInput) => {
    const repo = createInMemoryRepository();
    const program = createActivityUseCase(input).pipe(
      Effect.provideService(ActivityFeedRepositoryTag, repo),
    );
    return await Effect.runPromise(program);
  };

  // Helper to run use case and get Either for error testing
  const runUseCaseEither = async (input: CreateActivityInput) => {
    const repo = createInMemoryRepository();
    const program = createActivityUseCase(input).pipe(
      Effect.provideService(ActivityFeedRepositoryTag, repo),
    );
    return await Effect.runPromise(Effect.either(program));
  };

  describe("[UNIT] execute", () => {
    it("should create activity with minimal input", async () => {
      const input = createValidInput();

      const result = await runUseCase(input);

      expect(result.tripId).toBe("trip-123");
      expect(result.activityType).toBe("custom");
      expect(result.title).toBe("Test Activity");
      expect(result.isPinned).toBe(false);
      expect(result.isHidden).toBe(false);
    });

    it("should create activity with full custom input", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "custom",
        title: "Full Activity",
        description: "Full description",
        imageUrl: "image.jpg",
        isPinned: true,
        createdByAdmin: "admin-123",
      };

      const result = await runUseCase(input);

      expect(result.title).toBe("Full Activity");
      expect(result.description).toBe("Full description");
      expect(result.imageUrl).toBe("image.jpg");
      expect(result.isPinned).toBe(true);
    });

    it("should create user_post activity", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "user_post",
        title: "User Post",
        userPost: {
          authorId: "author-123",
          authorUserId: "user-123",
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: "group-123",
          groupName: "Test Group",
          additionalImages: ["img1.jpg", "img2.jpg"],
        },
      };

      const result = await runUseCase(input);

      expect(result.activityType).toBe("user_post");
      expect(result.title).toBe("User Post");
    });

    it("should create submission activity", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "submission",
        title: "New Submission",
        submissionActivity: {
          submissionId: "sub-123",
          challengeId: "challenge-123",
          groupId: "group-123",
          hasVideo: true,
          isWinner: false,
          ranking: 3,
          pointsAwarded: 100,
          currentGroupRank: 2,
        },
      };

      const result = await runUseCase(input);

      expect(result.activityType).toBe("submission");
      expect(result.title).toBe("New Submission");
    });

    it("should create challenge_event activity", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "challenge_event",
        title: "Challenge Started",
        challengeActivity: {
          challengeId: "challenge-123",
          eventType: "challenge_started",
          endTime: new Date("2024-12-31"),
          submissionType: "photo",
          basePoints: 50,
          submissionCount: 10,
        },
      };

      const result = await runUseCase(input);

      expect(result.activityType).toBe("challenge_event");
      expect(result.title).toBe("Challenge Started");
    });

    it("should create rank_change activity", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "rank_change",
        title: "Rank Up!",
        rankChangeActivity: {
          groupId: "group-123",
          newRank: 1,
          totalCoins: 1000,
          coinsGained: 100,
        },
      };

      const result = await runUseCase(input);

      expect(result.activityType).toBe("rank_change");
      expect(result.title).toBe("Rank Up!");
    });

    it("should fail when title is empty", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "custom",
        title: "",
      };

      const either = await runUseCaseEither(input);
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ActivityCreationError);
        expect(either.left.message).toContain("title");
      }
    });

    it("should handle null description and imageUrl", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "custom",
        title: "Test Activity",
        description: null,
        imageUrl: null,
      };

      const result = await runUseCase(input);

      expect(result.title).toBe("Test Activity");
      expect(result.description).toBeNull();
      expect(result.imageUrl).toBeNull();
    });
  });
});
