import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  CreateActivityUseCase,
  type CreateActivityInput,
} from "./CreateActivity";
import type { ActivityFeedRepository } from "../ports/ActivityFeedRepository";
import { ActivityFeed, type Result } from "@mirai-app/domain";

// Mock the domain module
const mockActivityFeed = {
  id: "activity-123",
  tripId: "trip-123",
  activityType: "custom",
  title: "Test Activity",
  description: null,
  imageUrl: null,
  isPinned: false,
  isHidden: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("[UNIT] CreateActivityUseCase", () => {
  let useCase: CreateActivityUseCase;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      create: mock((data: unknown) =>
        Promise.resolve({
          ...mockActivityFeed,
          ...(data as Record<string, unknown>),
          id: "activity-123",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        } as ActivityFeed),
      ),
    } as unknown as ActivityFeedRepository;

    useCase = new CreateActivityUseCase(mockActivityFeedRepository);
  });

  describe("execute", () => {
    it("should create activity with minimal input", async () => {
      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "custom",
        title: "Test Activity",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("activity-123");
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.activityType).toBe("custom");
        expect(result.value.title).toBe("Test Activity");
        expect(result.value.isPinned).toBe(false);
        expect(result.value.isHidden).toBe(false);
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.title).toBe("Full Activity");
      }
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
    });

    it("should return error when ActivityFeed.create fails", async () => {
      // Temporarily override the ActivityFeed.create mock
      const originalCreate = ActivityFeed.create;
      ActivityFeed.create = () =>
        ({
          kind: "err",
          error: new Error("Invalid activity data"),
        }) as Result<ActivityFeed, Error>;

      const input: CreateActivityInput = {
        tripId: "trip-123",
        activityType: "custom",
        title: "Test",
      };

      const result = await useCase.execute(input);

      // Restore the mock
      ActivityFeed.create = originalCreate;

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Invalid activity data");
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

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
    });
  });
});
