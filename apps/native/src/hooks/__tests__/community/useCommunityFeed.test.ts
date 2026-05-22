import { describe, it, expect } from "@jest/globals";
import {
  buildEmptyFeedPageData,
  getNextCommunityFeedPageParam,
  updateActivityReactionsInPages,
  applyReactionSummaryToFeed,
} from "../../community/useCommunityFeed";
import type { FeedPageData, FeedCursor } from "../../community/useCommunityFeed";

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
      createdAt: "2024-01-01",
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

describe("updateActivityReactionsInPages", () => {
  it("should update the target activity's reactions summary", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
          { id: "a2", title: "Activity 2", reactionsSummary: { heart: 3 } },
        ],
        pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a1", { heart: 6 });

    expect(result[0].activities[0].reactionsSummary).toEqual({ heart: 6 });
    expect(result[0].activities[1].reactionsSummary).toEqual({ heart: 3 });
  });

  it("should not modify other activities", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
          { id: "a2", title: "Activity 2", reactionsSummary: { heart: 3 } },
          { id: "a3", title: "Activity 3", reactionsSummary: { heart: 1 } },
        ],
        pagination: { total: 3, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a2", { heart: 10 });

    expect(result[0].activities[0]).toEqual(pages[0].activities[0]);
    expect(result[0].activities[2]).toEqual(pages[0].activities[2]);
    expect(result[0].activities[1].reactionsSummary).toEqual({ heart: 10 });
  });

  it("should handle activity not found in any page", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "nonexistent", { heart: 99 });

    expect(result[0].activities[0]).toEqual(pages[0].activities[0]);
  });

  it("should handle multiple pages and update only the target activity", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
        ],
        pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1 },
      },
      {
        activities: [
          { id: "a2", title: "Activity 2", reactionsSummary: { heart: 3 } },
        ],
        pagination: { total: 2, page: 2, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a2", { heart: 7 });

    expect(result[0].activities[0]).toEqual(pages[0].activities[0]);
    expect(result[1].activities[0].reactionsSummary).toEqual({ heart: 7 });
  });

  it("should accept a function updater and apply it to the activity's current summary", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const updater = (current: Record<string, number> | undefined) => ({
      ...current,
      heart: (current?.heart ?? 0) + 1,
    });

    const result = updateActivityReactionsInPages(pages, "a1", updater);

    expect(result[0].activities[0].reactionsSummary).toEqual({ heart: 6 });
  });

  it("should handle empty pages array", () => {
    const result = updateActivityReactionsInPages([], "a1", { heart: 1 });
    expect(result).toEqual([]);
  });

  it("should not mutate the original pages array", () => {
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
        ],
        pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1 },
      },
    ];

    const result = updateActivityReactionsInPages(pages, "a1", { heart: 6 });

    expect(pages[0].activities[0].reactionsSummary).toEqual({ heart: 5 });
    expect(result[0].activities[0].reactionsSummary).toEqual({ heart: 6 });
  });
});

describe("applyReactionSummaryToFeed", () => {
  it("should call setQueryData with updated pages", () => {
    const mockSetQueryData = jest.fn();
    const queryClient = { setQueryData: mockSetQueryData } as unknown as ReturnType<
      typeof import("@tanstack/react-query").useQueryClient
    >;
    const queryKey = ["feed", "trip1"];
    const pages: FeedPageData[] = [
      {
        activities: [
          { id: "a1", title: "Activity 1", reactionsSummary: { heart: 5 } },
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

    applyReactionSummaryToFeed(queryClient, queryKey, "a1", { heart: 6 });

    expect(mockSetQueryData).toHaveBeenCalledWith(queryKey, expect.any(Function));
  });

  it("should handle missing pages in old data", () => {
    const mockSetQueryData = jest.fn();
    const queryClient = { setQueryData: mockSetQueryData } as unknown as ReturnType<
      typeof import("@tanstack/react-query").useQueryClient
    >;
    const queryKey = ["feed", "trip1"];

    mockSetQueryData.mockImplementation((key: unknown, updater: unknown) => {
      if (typeof updater === "function") {
        return updater(undefined);
      }
      return updater;
    });

    applyReactionSummaryToFeed(queryClient, queryKey, "a1", { heart: 6 });

    expect(mockSetQueryData).toHaveBeenCalledWith(queryKey, expect.any(Function));
  });
});
