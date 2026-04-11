import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ActivityFeedController } from "../activity-feed";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import type { ActivityFeed, ActivityId } from "@mirai-app/domain";

// Mock ActivityFeed domain object
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    tripId: "trip-123",
    activityType: "custom",
    title: "Test Activity",
    description: "Test description",
    imageUrl: null,
    isPinned: false,
    isHidden: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    admin: null,
    ...overrides,
  }) as ActivityFeed;

describe("[UNIT] ActivityFeedController", () => {
  let controller: ActivityFeedController;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      findById: mock(() => Promise.resolve(createMockActivity())),
      findByTripId: mock(() =>
        Promise.resolve({
          activities: [createMockActivity()],
          nextCursor: null,
          hasMore: false,
        }),
      ),
      create: mock((activity: ActivityFeed) => Promise.resolve(activity)),
      update: mock((activity: ActivityFeed) => Promise.resolve(activity)),
      delete: mock(() => Promise.resolve()),
      findUserReactions: mock(() => Promise.resolve([])),
      getReactionCounts: mock(() =>
        Promise.resolve({
          total: 0,
          counts: { heart: 0, fire: 0, clap: 0, star: 0 },
        }),
      ),
    } as unknown as ActivityFeedRepository;

    controller = new ActivityFeedController(mockActivityFeedRepository);
  });

  describe("getById", () => {
    it("should return activity by ID", async () => {
      const result = await controller.getById({ id: "activity-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("activity-123");
        expect(result.data.title).toBe("Test Activity");
      }
    });

    it("should return error when activity not found", async () => {
      mockActivityFeedRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "activity-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTripId", () => {
    it("should return activities for trip", async () => {
      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(1);
        expect(result.data.pagination.hasMore).toBe(false);
      }
    });
  });

  describe("create", () => {
    it("should create activity with valid input", async () => {
      const input = {
        tripId: "trip-123",
        activityType: "custom",
        title: "New Activity",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New Activity");
      }
    });

    it("should return error for invalid activity type", async () => {
      const input = {
        tripId: "trip-123",
        activityType: "invalid",
        title: "Test",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update activity", async () => {
      const input = {
        activityId: "activity-123",
        title: "Updated Title",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error for hidden activity", async () => {
      mockActivityFeedRepository.findById = mock(() =>
        Promise.resolve(createMockActivity({ isHidden: true })),
      );

      const result = await controller.update({
        activityId: "activity-123",
        title: "Updated",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete activity", async () => {
      const result = await controller.delete({ id: "activity-123" });

      expect(result.success).toBe(true);
    });
  });

  describe("addReaction", () => {
    it("should add reaction to activity", async () => {
      const input = {
        activityId: "activity-123",
        userId: "user-123",
        reactionType: "heart",
      };

      const result = await controller.addReaction(input);

      expect(result.success).toBe(true);
    });

    it("should return error for invalid reaction type", async () => {
      const input = {
        activityId: "activity-123",
        userId: "user-123",
        reactionType: "invalid",
      };

      const result = await controller.addReaction(input);

      expect(result.success).toBe(false);
    });
  });
});
