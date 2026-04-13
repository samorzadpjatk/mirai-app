import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { ActivityFeedController } from "../activity-feed";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import { ActivityId, ReactionType } from "@mirai-app/domain";
import { ActivityFeedRepositoryTag } from "@mirai-app/use-cases";

// Valid UUIDs for testing
const ACTIVITY_ID = "550e8400-e29b-41d4-a716-446655440000" as ActivityId;
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440001";
const USER_ID = "550e8400-e29b-41d4-a716-446655440002";

// Mock ActivityFeed domain object
const createMockActivity = (overrides?: Record<string, unknown>) => ({
  id: ACTIVITY_ID,
  tripId: TRIP_ID,
  activityType: "custom",
  title: "Test Activity",
  description: "Test description",
  imageUrl: null,
  isPinned: false,
  isHidden: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  admin: null,
  hiddenAt: null,
  hiddenReason: null,
  hiddenBy: null,
  updateContent: function (props: {
    title?: string;
    description?: string | null;
  }) {
    return Effect.succeed({
      ...this,
      title: props.title ?? this.title,
      description: props.description ?? this.description,
      updatedAt: new Date(),
    });
  },
  pin: function () {
    return { ...this, isPinned: true, updatedAt: new Date() };
  },
  unpin: function () {
    return { ...this, isPinned: false, updatedAt: new Date() };
  },
  hide: function (adminId: string, reason: string | null) {
    return {
      ...this,
      isHidden: true,
      hiddenAt: new Date(),
      hiddenReason: reason,
      hiddenBy: adminId,
      updatedAt: new Date(),
    };
  },
  unhide: function () {
    return {
      ...this,
      isHidden: false,
      hiddenAt: null,
      hiddenReason: null,
      hiddenBy: null,
      updatedAt: new Date(),
    };
  },
  ...overrides,
});

describe("[UNIT] ActivityFeedController", () => {
  let controller: ActivityFeedController;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      findById: mock(() => Effect.succeed(createMockActivity())),
      findByTripId: mock(() =>
        Effect.succeed({
          activities: [createMockActivity()],
          nextCursor: null,
          hasMore: false,
        }),
      ),
      create: mock((activity: ReturnType<typeof createMockActivity>) =>
        Effect.succeed(activity),
      ),
      update: mock((activity: ReturnType<typeof createMockActivity>) =>
        Effect.succeed(activity),
      ),
      delete: mock(() => Effect.succeed(undefined)),
      exists: mock(() => Effect.succeed(true)),
      findUserReactions: mock(() => Effect.succeed([])),
      getReactionCounts: mock(() =>
        Effect.succeed({
          total: 0,
          counts: { heart: 0, fire: 0, clap: 0, star: 0 },
        }),
      ),
      addReaction: mock(() => Effect.succeed({ id: "reaction-1" } as any)),
      removeReaction: mock(() => Effect.succeed(undefined)),
      findReactionsByActivityId: mock(() => Effect.succeed([])),
      findByTripIdPaged: mock(() =>
        Effect.succeed({
          activities: [createMockActivity()],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
          hasMore: false,
        }),
      ),
    } as unknown as ActivityFeedRepository;

    controller = new ActivityFeedController(mockActivityFeedRepository);
  });

  describe("getById", () => {
    it("should return activity by ID", async () => {
      const result = await controller.getById({ id: ACTIVITY_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(ACTIVITY_ID);
        expect(result.data.title).toBe("Test Activity");
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: ACTIVITY_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });

    it("should return error for empty activity ID", async () => {
      const result = await controller.getById({ id: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTrip", () => {
    it("should return activities for trip", async () => {
      const result = await controller.getByTrip({ tripId: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(1);
        expect(result.data.pagination.hasMore).toBe(false);
      }
    });

    it("should return error for empty trip ID", async () => {
      const result = await controller.getByTrip({ tripId: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("createCustom", () => {
    it("should create activity with valid input", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "New Activity",
      };

      const result = await controller.createCustom(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New Activity");
      }
    });

    it("should return error for empty title", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "",
      };

      const result = await controller.createCustom(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update activity", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        title: "Updated Title",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Title");
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.update({
        activityId: ACTIVITY_ID,
        title: "Updated",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });

    it("should allow updating hidden activity", async () => {
      mockActivityFeedRepository.findById = mock(() =>
        Effect.succeed(createMockActivity({ isHidden: true })),
      );

      const result = await controller.update({
        activityId: ACTIVITY_ID,
        title: "Updated",
      });

      // The controller allows updating hidden activities
      expect(result.success).toBe(true);
    });
  });

  describe("setPinned", () => {
    it("should pin an activity", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        isPinned: true,
      };

      const result = await controller.setPinned(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPinned).toBe(true);
      }
    });

    it("should unpin an activity", async () => {
      mockActivityFeedRepository.findById = mock(() =>
        Effect.succeed(createMockActivity({ isPinned: true })),
      );

      const input = {
        activityId: ACTIVITY_ID,
        isPinned: false,
      };

      const result = await controller.setPinned(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPinned).toBe(false);
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.setPinned({
        activityId: ACTIVITY_ID,
        isPinned: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });
  });

  describe("hide", () => {
    it("should hide an activity", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        hiddenByAdmin: "admin-123",
        reason: "Inappropriate content",
      };

      const result = await controller.hide(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(true);
        expect(result.data.hiddenReason).toBe("Inappropriate content");
        expect(result.data.hiddenAt).toBeInstanceOf(Date);
      }
    });

    it("should hide without reason", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        hiddenByAdmin: "admin-123",
      };

      const result = await controller.hide(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(true);
        expect(result.data.hiddenReason).toBeNull();
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.hide({
        activityId: ACTIVITY_ID,
        hiddenByAdmin: "admin-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });

    it("should return error for missing admin ID", async () => {
      const result = await controller.hide({
        activityId: ACTIVITY_ID,
        hiddenByAdmin: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("unhide", () => {
    it("should unhide a hidden activity", async () => {
      mockActivityFeedRepository.findById = mock(() =>
        Effect.succeed(
          createMockActivity({
            isHidden: true,
            hiddenAt: new Date(),
            hiddenReason: "Some reason",
            hiddenBy: "admin-123",
          }),
        ),
      );

      const result = await controller.unhide({
        activityId: ACTIVITY_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isHidden).toBe(false);
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.unhide({
        activityId: ACTIVITY_ID,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });
  });

  describe("delete", () => {
    it("should delete activity", async () => {
      const result = await controller.delete({ activityId: ACTIVITY_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.exists = mock(() => Effect.succeed(false));

      const result = await controller.delete({ activityId: ACTIVITY_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Activity not found");
      }
    });

    it("should return error for empty activity ID", async () => {
      const result = await controller.delete({ activityId: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("toggleReaction", () => {
    it("should add reaction to activity", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        userId: USER_ID,
        reactionType: "heart" as ReactionType,
      };

      const result = await controller.toggleReaction(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid reaction type", async () => {
      const input = {
        activityId: ACTIVITY_ID,
        userId: USER_ID,
        reactionType: "invalid" as ReactionType,
      };

      const result = await controller.toggleReaction(input);

      expect(result.success).toBe(false);
    });
  });

  describe("createUserPost", () => {
    it("should create user post activity", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "User Post",
        userPost: {
          authorId: "author-123",
          authorUserId: USER_ID,
          authorFirstName: "John",
          authorLastName: "Doe",
          authorHasAvatar: true,
          groupId: "group-123",
          groupName: "Test Group",
          additionalImages: [],
        },
      };

      const result = await controller.createUserPost(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("User Post");
      }
    });
  });

  describe("createSubmission", () => {
    it("should create submission activity", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "Submission Activity",
        submissionActivity: {
          submissionId: "sub-123",
          challengeId: "challenge-123",
          groupId: "group-123",
        },
      };

      const result = await controller.createSubmission(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Submission Activity");
      }
    });
  });

  describe("createChallengeEvent", () => {
    it("should create challenge event activity", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "Challenge Started",
        challengeActivity: {
          challengeId: "challenge-123",
          eventType: "challenge_started" as const,
        },
      };

      const result = await controller.createChallengeEvent(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Challenge Started");
      }
    });
  });

  describe("createRankChange", () => {
    it("should create rank change activity", async () => {
      const input = {
        tripId: TRIP_ID,
        title: "Rank Changed",
        rankChangeActivity: {
          groupId: "group-123",
          newRank: 1,
          totalCoins: 1000,
          coinsGained: 100,
        },
      };

      const result = await controller.createRankChange(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Rank Changed");
      }
    });
  });
});
