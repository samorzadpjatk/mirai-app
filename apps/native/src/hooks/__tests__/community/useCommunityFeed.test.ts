import { describe, expect, it } from "@jest/globals";
import { createMockActivity } from "../../../test-utils/activityMocks";
import type { FeedCursor, FeedPageData } from "../../community/useCommunityFeed";
import {
  applyReactionSummaryToFeed,
  buildEmptyFeedPageData,
  getNextCommunityFeedPageParam,
  updateActivityReactionsInPages,
} from "../../community/useCommunityFeed";

describe("buildEmptyFeedPageData", () => {
  it("should return an empty feed page with default pagination", () => {
    const result = buildEmptyFeedPageData();

    expect(result.activities).toEqual([]);
    expect(result.pagination).toEqual({
      total: null,
      page: null,
      pageSize: 30,
      totalPages: null,
      hasMore: false,
    });
    expect(result.nextCursor).toBeNull();
  });

  it("should satisfy FeedPageData interface", () => {
    const result: FeedPageData = buildEmptyFeedPageData();
    expect(result).toBeDefined();
  });
});

describe("getNextCommunityFeedPageParam", () => {
  it("should return undefined when no next cursor exists", () => {
    const page: FeedPageData = {
      activities: [],
      pagination: { total: 0, page: 1, pageSize: 30, totalPages: 0 },
    };

    expect(getNextCommunityFeedPageParam(page)).toBeUndefined();
  });

  it("should return the next cursor when it exists", () => {
    const nextCursor: FeedCursor = {
      id: "cursor-1",
      createdAt: new Date("2024-01-01"),
      isPinned: false,
    };
    const page: FeedPageData = {
      activities: [],
      pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      nextCursor,
    };

    expect(getNextCommunityFeedPageParam(page)).toEqual(nextCursor);
  });

  it("should return null cursor when nextCursor is null", () => {
    const page: FeedPageData = {
      activities: [],
      pagination: { total: 0, page: 1, pageSize: 30, totalPages: 0 },
      nextCursor: null,
    };

    expect(getNextCommunityFeedPageParam(page)).toBeUndefined();
  });
});

const baseActivity = createMockActivity({
  tripId: "trip-1",
  activityType: "custom",
  description: "",
  imageUrl: "",
  createdAt: new Date("2024-01-01"),
});

describe("updateActivityReactionsInPages", () => {
  it("should update the target activity's reactions summary", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
          {
            ...baseActivity,
            id: "a2",
            title: "Activity 2",
            reactionsSummary: {
              total: 3,
              counts: { heart: 3, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a1", {
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(result[0]!.activities[0]!.reactionsSummary).toEqual({
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
    expect(result[0]!.activities[1]!.reactionsSummary).toEqual({
      total: 3,
      counts: { heart: 3, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });

  it("should not modify other activities", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
          {
            ...baseActivity,
            id: "a2",
            title: "Activity 2",
            reactionsSummary: {
              total: 3,
              counts: { heart: 3, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
          {
            ...baseActivity,
            id: "a3",
            title: "Activity 3",
            reactionsSummary: {
              total: 1,
              counts: { heart: 1, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 3, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a2", {
      total: 10,
      counts: { heart: 10, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(result[0]!.activities[0]).toEqual(pages[0]!.activities[0]);
    expect(result[0]!.activities[2]).toEqual(pages[0]!.activities[2]);
    expect(result[0]!.activities[1]!.reactionsSummary).toEqual({
      total: 10,
      counts: { heart: 10, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });

  it("should handle activity not found in any page", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "nonexistent", {
      total: 99,
      counts: { heart: 99, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(result[0]!.activities[0]).toEqual(pages[0]!.activities[0]);
  });

  it("should handle multiple pages and update only the target activity", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1 },
      },
      {
        activities: [
          {
            ...baseActivity,
            id: "a2",
            title: "Activity 2",
            reactionsSummary: {
              total: 3,
              counts: { heart: 3, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 2, page: 2, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a2", {
      total: 7,
      counts: { heart: 7, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(result[0]!.activities[0]).toEqual(pages[0]!.activities[0]);
    expect(result[1]!.activities[0]!.reactionsSummary).toEqual({
      total: 7,
      counts: { heart: 7, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });

  it("should accept a function updater and apply it to the activity's current summary", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const updater = (
      current:
        | {
            total: number;
            counts: { heart: number; fire: number; clap: number; star: number };
            myReactions: string[];
          }
        | undefined,
    ) => ({
      total: (current?.total ?? 0) + 1,
      counts: current?.counts ?? { heart: 0, fire: 0, clap: 0, star: 0 },
      myReactions: current?.myReactions ?? [],
    });

    const result = updateActivityReactionsInPages(pages, "a1", updater);

    expect(result[0]!.activities[0]!.reactionsSummary).toEqual({
      total: 6,
      counts: { heart: 5, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });

  it("should handle empty pages array", () => {
    const result = updateActivityReactionsInPages([], "a1", {
      total: 1,
      counts: { heart: 1, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
    expect(result).toEqual([]);
  });

  it("should not mutate the original pages array", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a1", {
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(pages[0]!.activities[0]!.reactionsSummary).toEqual({
      total: 5,
      counts: { heart: 5, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
    expect(result[0]!.activities[0]!.reactionsSummary).toEqual({
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });
});

describe("applyReactionSummaryToFeed", () => {
  it("should call setQueryData with updated pages", () => {
    const mockSetQueryData = jest.fn();
    const queryClient = { setQueryData: mockSetQueryData };
    const queryKey = ["feed", "trip1"];
    const pages: FeedPageData[] = [
      {
        activities: [
          {
            ...baseActivity,
            id: "a1",
            title: "Activity 1",
            reactionsSummary: {
              total: 5,
              counts: { heart: 5, fire: 0, clap: 0, star: 0 },
              myReactions: [],
            },
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    mockSetQueryData.mockImplementation((key: unknown, updater: unknown) => {
      if (typeof updater === "function") {
        return updater({ pages });
      }
      return updater;
    });

    applyReactionSummaryToFeed(queryClient, queryKey, "a1", {
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(queryKey, expect.any(Function));
  });

  it("should handle missing pages in old data", () => {
    const mockSetQueryData = jest.fn();
    const queryClient = { setQueryData: mockSetQueryData };
    const queryKey = ["feed", "trip1"];

    mockSetQueryData.mockImplementation((key: unknown, updater: unknown) => {
      if (typeof updater === "function") {
        return updater(undefined);
      }
      return updater;
    });

    applyReactionSummaryToFeed(queryClient, queryKey, "a1", {
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(queryKey, expect.any(Function));
  });
});
