import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RankingActivityService } from "../ranking-activity";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import type { ActivityFeed, ActivityId } from "@mirai-app/domain";

// Mock ActivityFeed
const createMockActivity = (overrides?: Partial<ActivityFeed>): ActivityFeed =>
  ({
    id: "activity-123" as ActivityId,
    tripId: "trip-123",
    activityType: "rank_change",
    title: "Rank Up!",
    isHidden: false,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as ActivityFeed;

describe("[UNIT] RankingActivityService", () => {
  let service: RankingActivityService;
  let mockActivityFeedRepository: ActivityFeedRepository;

  beforeEach(() => {
    mockActivityFeedRepository = {
      create: mock((activity: ActivityFeed) => Promise.resolve(activity)),
    } as unknown as ActivityFeedRepository;

    service = new RankingActivityService(mockActivityFeedRepository);
  });

  describe("createRankChangeActivity", () => {
    it("should create rank change activity", async () => {
      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        newRank: 1,
        totalCoins: 1000,
        coinsGained: 100,
      };

      const result = await service.createRankChangeActivity(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toContain("Rank");
      }
      expect(mockActivityFeedRepository.create).toHaveBeenCalled();
    });
  });

  describe("createChallengeWinnerActivity", () => {
    it("should create winner activity", async () => {
      const input = {
        tripId: "trip-123",
        groupId: "group-123",
        challengeId: "challenge-123",
        challengeName: "Test Challenge",
        ranking: 1,
        pointsAwarded: 200,
      };

      const result = await service.createChallengeWinnerActivity(input);

      expect(result.success).toBe(true);
      expect(mockActivityFeedRepository.create).toHaveBeenCalled();
    });
  });
});
