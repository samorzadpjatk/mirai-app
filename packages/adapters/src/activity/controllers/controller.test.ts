import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { ActivityFeedController } from "./controller";
import {
  ActivityFeedGatewayTag,
  type ActivityFeedGateway,
  type ActivityFeedDTO,
  type ActivityReactionDTO,
} from "@mirai-app/use-cases";
import type { ActivityId, ReactionType } from "@mirai-app/domain";

/**
 * Mock ActivityFeedGateway for testing
 */
function createMockActivityFeedGateway(
  activities: ActivityFeedDTO[] = [],
): ActivityFeedGateway {
  const storage = new Map(activities.map((a) => [a.id, a]));
  const reactionsStorage = new Map<string, ActivityReactionDTO[]>();

  return {
    findById: (id: ActivityId) => {
      const activity = storage.get(id);
      return Effect.succeed(activity ?? null);
    },

    findByTripId: (tripId: string, options?: { limit?: number }) => {
      const items = Array.from(storage.values()).filter(
        (a) => a.tripId === tripId && !a.isHidden,
      );
      const limit = options?.limit ?? 30;
      const hasMore = items.length > limit;
      const paginatedItems = items.slice(0, limit);

      // Return in the format expected by the use case
      return Effect.succeed({
        activities: paginatedItems,
        nextCursor:
          hasMore && paginatedItems.length > 0
            ? {
                id: paginatedItems[paginatedItems.length - 1]!.id,
                createdAt: paginatedItems[paginatedItems.length - 1]!.createdAt,
                isPinned: paginatedItems[paginatedItems.length - 1]!.isPinned,
              }
            : null,
        hasMore,
        total: items.length,
      });
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
      storage.set(activity.id, activity);
      return Effect.succeed(activity);
    },

    update: (activity: ActivityFeedDTO) => {
      storage.set(activity.id, activity);
      return Effect.succeed(activity);
    },

    delete: (id: ActivityId) => {
      storage.delete(id);
      reactionsStorage.delete(id);
      return Effect.succeed(undefined);
    },

    exists: (id: ActivityId) => {
      return Effect.succeed(storage.has(id));
    },

    findReactionsByActivityId: (activityId: ActivityId) => {
      return Effect.succeed(reactionsStorage.get(activityId) ?? []);
    },

    findUserReactions: (activityId: ActivityId, userId: string) => {
      const reactions = reactionsStorage.get(activityId) ?? [];
      return Effect.succeed(reactions.filter((r) => r.userId === userId));
    },

    addReaction: (reaction: ActivityReactionDTO) => {
      const existing = reactionsStorage.get(reaction.activityId) ?? [];
      const filtered = existing.filter(
        (r) =>
          !(
            r.userId === reaction.userId &&
            r.reactionType === reaction.reactionType
          ),
      );
      filtered.push(reaction);
      reactionsStorage.set(reaction.activityId, filtered);
      return Effect.succeed(reaction);
    },

    removeReaction: (
      activityId: ActivityId,
      userId: string,
      reactionType: string,
    ) => {
      const reactions = reactionsStorage.get(activityId) ?? [];
      const filtered = reactions.filter(
        (r) => !(r.userId === userId && r.reactionType === reactionType),
      );
      reactionsStorage.set(activityId, filtered);
      return Effect.succeed(undefined);
    },

    getReactionCounts: (activityId: ActivityId) => {
      const reactions = reactionsStorage.get(activityId) ?? [];
      const counts = { heart: 0, fire: 0, clap: 0, star: 0 };
      for (const r of reactions) {
        if (r.reactionType in counts) {
          counts[r.reactionType as keyof typeof counts]++;
        }
      }
      return Effect.succeed({ total: reactions.length, counts });
    },
  };
}

const createMockActivityDTO = (
  id: string,
  overrides: Partial<ActivityFeedDTO> = {},
): ActivityFeedDTO => ({
  id: id as ActivityId,
  tripId: "trip-1",
  userId: "user-1",
  activityType: "custom",
  content: `Activity ${id}`,
  isPinned: false,
  isHidden: false,
  createdAt: new Date(`2024-01-${id.padStart(2, "0")}T10:00:00Z`),
  updatedAt: new Date(`2024-01-${id.padStart(2, "0")}T10:00:00Z`),
  ...overrides,
});

describe("[UNIT] ActivityFeedController", () => {
  let controller: ActivityFeedController;

  beforeEach(() => {
    const mockGateway = createMockActivityFeedGateway();
    const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
    controller = new ActivityFeedController(mockLayer);
  });

  describe("getByTrip", () => {
    it("returns activities for trip on success", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.getByTrip({
        tripId: "trip-1",
        pageSize: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(1);
        expect(result.data.pagination.pageSize).toBe(10);
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.getByTrip({
        tripId: "",
        pageSize: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when use case fails", async () => {
      const failingGateway: ActivityFeedGateway = {
        ...createMockActivityFeedGateway(),
        findByTripId: () =>
          Effect.fail(new Error("Database connection failed")),
      };
      const failingLayer = Layer.succeed(
        ActivityFeedGatewayTag,
        failingGateway,
      );
      const failingController = new ActivityFeedController(failingLayer);

      const result = await failingController.getByTrip({
        tripId: "trip-1",
        pageSize: 10,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getById", () => {
    it("returns activity on success", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.getById({ id: "1" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("1");
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.getById({ id: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when activity not found", async () => {
      const result = await controller.getById({ id: "nonexistent" });

      expect(result.success).toBe(false);
    });
  });

  describe("createCustom", () => {
    it("creates custom activity on success", async () => {
      const result = await controller.createCustom({
        tripId: "trip-1",
        title: "Test Activity",
        description: "Test description",
        isPinned: true,
        createdByAdmin: "admin-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Activity");
        expect(result.data.activityType).toBe("custom");
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.createCustom({
        tripId: "",
        title: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("creates activity with minimal fields", async () => {
      const result = await controller.createCustom({
        tripId: "trip-1",
        title: "Minimal Activity",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPinned).toBe(false);
      }
    });
  });

  describe("createUserPost", () => {
    it("creates user post activity on success", async () => {
      const result = await controller.createUserPost({
        tripId: "trip-1",
        title: "User Post",
        description: "Post content",
        userPost: {
          authorId: "author-1",
          authorUserId: "user-1",
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: null,
          groupName: null,
          additionalImages: [],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityType).toBe("user_post");
      }
    });

    it("returns error for missing required fields", async () => {
      const result = await controller.createUserPost({
        tripId: "trip-1",
        title: "Post",
        // Missing userPost field
      });

      expect(result.success).toBe(false);
    });

    it("returns error when userPost is missing", async () => {
      const result = await controller.createUserPost({
        tripId: "trip-1",
        title: "Post without userPost",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createSubmission", () => {
    it("creates submission activity on success", async () => {
      const result = await controller.createSubmission({
        tripId: "trip-1",
        title: "Submission Activity",
        description: "Submission details",
        isPinned: false,
        createdByAdmin: "admin-1",
        submissionActivity: {
          submissionId: "sub-1",
          challengeId: "challenge-1",
          groupId: "group-1",
          hasVideo: true,
          isWinner: true,
          ranking: 1,
          pointsAwarded: 100,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityType).toBe("submission");
      }
    });

    it("creates submission with minimal fields", async () => {
      const result = await controller.createSubmission({
        tripId: "trip-1",
        title: "Basic Submission",
        submissionActivity: {
          submissionId: "sub-1",
          challengeId: "challenge-1",
          groupId: "group-1",
        },
      });

      expect(result.success).toBe(true);
    });

    it("returns error for missing required submissionActivity", async () => {
      const result = await controller.createSubmission({
        tripId: "trip-1",
        title: "Invalid Submission",
        // Missing submissionActivity field
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createChallengeEvent", () => {
    it("creates challenge event activity on success", async () => {
      const result = await controller.createChallengeEvent({
        tripId: "trip-1",
        title: "Challenge Started",
        description: "Challenge has begun",
        isPinned: true,
        createdByAdmin: "admin-1",
        challengeActivity: {
          challengeId: "challenge-1",
          eventType: "challenge_started",
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityType).toBe("challenge_event");
      }
    });

    it("returns error for invalid event type", async () => {
      const result = await controller.createChallengeEvent({
        tripId: "trip-1",
        title: "Invalid Event",
        challengeActivity: {
          challengeId: "challenge-1",
          eventType: "invalid_type" as "challenge_started",
        },
      });

      expect(result.success).toBe(false);
    });

    it("returns error for missing challengeActivity", async () => {
      const result = await controller.createChallengeEvent({
        tripId: "trip-1",
        title: "Missing Activity",
        // Missing challengeActivity field
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createRankChange", () => {
    it("creates rank change activity on success", async () => {
      const result = await controller.createRankChange({
        tripId: "trip-1",
        title: "Rank Up!",
        description: "You moved up in the rankings",
        rankChangeActivity: {
          groupId: "group-1",
          newRank: 1,
          totalCoins: 500,
          coinsGained: 100,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityType).toBe("rank_change");
      }
    });

    it("returns error for invalid rank", async () => {
      const result = await controller.createRankChange({
        tripId: "trip-1",
        title: "Invalid Rank",
        rankChangeActivity: {
          groupId: "group-1",
          newRank: 0,
          totalCoins: 100,
          coinsGained: 10,
        },
      });

      expect(result.success).toBe(false);
    });

    it("returns error for missing rankChangeActivity", async () => {
      const result = await controller.createRankChange({
        tripId: "trip-1",
        title: "Missing Activity",
        // Missing rankChangeActivity field
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("updates activity on success", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.update({
        activityId: "1",
        title: "Updated Title",
        description: "Updated description",
      });

      expect(result.success).toBe(true);
    });

    it("returns error for invalid input", async () => {
      const result = await controller.update({
        activityId: "",
        title: "Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns specific error when activity not found", async () => {
      const result = await controller.update({
        activityId: "nonexistent",
        title: "New Title",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
    });

    it("updates only title when provided", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.update({
        activityId: "1",
        title: "Only Title Updated",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("setPinned", () => {
    it("pins activity on success", async () => {
      const activity = createMockActivityDTO("1", { isPinned: false });
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.setPinned({
        activityId: "1",
        isPinned: true,
      });

      expect(result.success).toBe(true);
    });

    it("unpins activity on success", async () => {
      const activity = createMockActivityDTO("1", { isPinned: true });
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.setPinned({
        activityId: "1",
        isPinned: false,
      });

      expect(result.success).toBe(true);
    });

    it("returns error for invalid input", async () => {
      const result = await controller.setPinned({
        activityId: "",
        isPinned: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns specific error when activity not found", async () => {
      const result = await controller.setPinned({
        activityId: "nonexistent",
        isPinned: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
    });
  });

  describe("hide", () => {
    it("returns error for invalid input", async () => {
      const result = await controller.hide({
        activityId: "",
        hiddenByAdmin: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns specific error when activity not found", async () => {
      const result = await controller.hide({
        activityId: "nonexistent",
        hiddenByAdmin: "admin-1",
        reason: "Test reason",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
    });
  });

  describe("unhide", () => {
    it("returns error for invalid input", async () => {
      const result = await controller.unhide({
        activityId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns specific error when activity not found", async () => {
      const result = await controller.unhide({
        activityId: "nonexistent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
    });
  });

  describe("toggleReaction", () => {
    it("adds reaction on success", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.toggleReaction({
        activityId: "1",
        userId: "user-1",
        reactionType: "heart",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.reactionsSummary.total).toBe(1);
      }
    });

    it("toggles reaction off when already exists", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);

      // Pre-seed a reaction
      await Effect.runPromise(
        mockGateway.addReaction({
          id: "r1" as ActivityId,
          activityId: "1" as ActivityId,
          userId: "user-1",
          reactionType: "heart",
          createdAt: new Date(),
        }),
      );

      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.toggleReaction({
        activityId: "1",
        userId: "user-1",
        reactionType: "heart",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });

    it("returns error for invalid input", async () => {
      const result = await controller.toggleReaction({
        activityId: "",
        userId: "",
        reactionType: "invalid_reaction" as ReactionType,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error for invalid reaction type", async () => {
      const result = await controller.toggleReaction({
        activityId: "1",
        userId: "user-1",
        reactionType: "invalid" as ReactionType,
      });

      expect(result.success).toBe(false);
    });

    it("returns error for missing activity", async () => {
      const result = await controller.toggleReaction({
        activityId: "nonexistent",
        userId: "user-1",
        reactionType: "heart",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes activity on success", async () => {
      const activity = createMockActivityDTO("1");
      const mockGateway = createMockActivityFeedGateway([activity]);
      const mockLayer = Layer.succeed(ActivityFeedGatewayTag, mockGateway);
      controller = new ActivityFeedController(mockLayer);

      const result = await controller.delete({
        activityId: "1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
      }

      // Verify activity is deleted
      const found = await Effect.runPromise(
        mockGateway.findById("1" as ActivityId),
      );
      expect(found).toBeNull();
    });

    it("returns error for invalid input", async () => {
      const result = await controller.delete({
        activityId: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns specific error when activity not found", async () => {
      const result = await controller.delete({
        activityId: "nonexistent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Activity not found");
    });
  });

  describe("input validators", () => {
    it("exports all validator functions", async () => {
      const {
        validateGetByTripInput,
        validateGetByIdInput,
        validateCreateCustomInput,
        validateCreateUserPostInput,
        validateCreateSubmissionInput,
        validateCreateChallengeEventInput,
        validateCreateRankChangeInput,
        validateUpdateInput,
        validateSetPinnedInput,
        validateHideInput,
        validateUnhideInput,
        validateAddReactionInput,
        validateDeleteInput,
      } = await import("./controller");

      expect(validateGetByTripInput).toBeDefined();
      expect(validateGetByIdInput).toBeDefined();
      expect(validateCreateCustomInput).toBeDefined();
      expect(validateCreateUserPostInput).toBeDefined();
      expect(validateCreateSubmissionInput).toBeDefined();
      expect(validateCreateChallengeEventInput).toBeDefined();
      expect(validateCreateRankChangeInput).toBeDefined();
      expect(validateUpdateInput).toBeDefined();
      expect(validateSetPinnedInput).toBeDefined();
      expect(validateHideInput).toBeDefined();
      expect(validateUnhideInput).toBeDefined();
      expect(validateAddReactionInput).toBeDefined();
      expect(validateDeleteInput).toBeDefined();
    });
  });

  describe("runWithLayer helper", () => {
    it("handles unknown errors gracefully", async () => {
      const throwingGateway: ActivityFeedGateway = {
        ...createMockActivityFeedGateway(),
        findByTripId: () => Effect.fail("String error"),
      };
      const throwingLayer = Layer.succeed(
        ActivityFeedGatewayTag,
        throwingGateway,
      );
      const throwingController = new ActivityFeedController(throwingLayer);

      const result = await throwingController.getByTrip({
        tripId: "trip-1",
        pageSize: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
