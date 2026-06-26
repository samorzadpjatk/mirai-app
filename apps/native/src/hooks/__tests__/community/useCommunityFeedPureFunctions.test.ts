import { describe, expect, it, jest } from "@jest/globals";
import { createMockActivity } from "../../../test-utils/activityMocks";
import type { FeedPageData } from "../../community/useCommunityFeed";
import {
  buildCommunityFeedActivities,
  buildCommunityFeedQueryKey,
  buildHandleToggleHeart,
} from "../../community/useCommunityFeed";

const baseActivity = createMockActivity({
  tripId: "trip-1",
  activityType: "custom",
  description: "",
  imageUrl: "",
  createdAt: new Date("2024-01-01"),
});

const baseReactionsSummary = {
  total: 0,
  counts: { heart: 0, fire: 0, clap: 0, star: 0 },
  myReactions: [] as string[],
};

describe("buildCommunityFeedQueryKey", () => {
  it("should return null when no selectedTripId", () => {
    expect(buildCommunityFeedQueryKey(null)).toBeNull();
  });

  it("should return query key with tripId", () => {
    expect(buildCommunityFeedQueryKey("trip-1")).toEqual(["community-feed", "trip-1", 30]);
  });
});

describe("buildCommunityFeedActivities", () => {
  it("should return empty array when no pages", () => {
    expect(buildCommunityFeedActivities(undefined)).toEqual([]);
  });

  it("should return empty array when pages is empty", () => {
    expect(buildCommunityFeedActivities([])).toEqual([]);
  });

  it("should flatten activities from all pages", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              ...baseReactionsSummary,
              total: 1,
              counts: { ...baseReactionsSummary.counts, heart: 1 },
            },
          },
          {
            ...baseActivity,
            id: "a2",
            title: "Activity 2",
            reactionsSummary: {
              ...baseReactionsSummary,
              total: 2,
              counts: { ...baseReactionsSummary.counts, heart: 2 },
            },
          },
        ],
        pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1 },
      },
      {
        activities: [
          {
            ...baseActivity,
            id: "a3",
            title: "Activity 3",
            reactionsSummary: {
              ...baseReactionsSummary,
              total: 3,
              counts: { ...baseReactionsSummary.counts, heart: 3 },
            },
          },
        ],
        pagination: { total: 3, page: 2, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = buildCommunityFeedActivities(pages);

    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe("a1");
    expect(result[2]!.id).toBe("a3");
  });

  it("should skip pages with no activities", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              ...baseReactionsSummary,
              total: 1,
              counts: { ...baseReactionsSummary.counts, heart: 1 },
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
      {
        activities: [],
        pagination: { total: 1, page: 2, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = buildCommunityFeedActivities(pages);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("a1");
  });
});

describe("buildHandleToggleHeart", () => {
  it("should return function that calls toggleHeart", () => {
    const toggleHeart = jest
      .fn<(args: { activityId: string }) => Promise<unknown>>()
      .mockResolvedValue(undefined);
    const handler = buildHandleToggleHeart(toggleHeart);

    handler("activity-1");

    expect(toggleHeart).toHaveBeenCalledWith({ activityId: "activity-1" });
  });
});
