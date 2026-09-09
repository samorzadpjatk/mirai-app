import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createCommunityFullHandler } from "../../../test-utils/msw/handlers";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  COMMUNITY_FEED_MIN_REFRESH_INTERVAL_MS,
  buildCommunityFeedQueryKey,
  useCommunityFeed,
} from "../../community/useCommunityFeed";

const baseActivity = {
  tripId: "trip-1",
  activityType: "custom" as const,
  description: null,
  imageUrl: null,
  createdAt: "2024-01-01",
};

const mockFeedPage = {
  feed: {
    activities: [
      {
        id: "activity-1",
        title: "Activity One",
        ...baseActivity,
        reactionsSummary: {
          total: 5,
          counts: { heart: 5, fire: 0, clap: 0, star: 0 },
          myReactions: [],
        },
      },
      {
        id: "activity-2",
        title: "Activity Two",
        ...baseActivity,
        activityType: "user_post" as const,
        reactionsSummary: {
          total: 3,
          counts: { heart: 3, fire: 0, clap: 0, star: 0 },
          myReactions: ["heart"],
        },
      },
      {
        id: "activity-3",
        title: "Activity Three",
        ...baseActivity,
        activityType: "rank_change" as const,
        reactionsSummary: {
          total: 1,
          counts: { heart: 1, fire: 0, clap: 0, star: 0 },
          myReactions: [],
        },
      },
    ],
    pagination: {
      total: 3,
      page: 1,
      pageSize: 30,
      totalPages: 1,
      hasMore: false,
    },
    nextCursor: null,
  },
  ranking: {
    data: [],
    currentDate: "2024-01-01T00:00:00.000Z",
  },
  activeChallenges: [],
  avatarUrls: {},
};

describe("useCommunityFeed (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return feedQuery, filteredActivities, rankingData, avatarUrls and handleToggleHeart", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.feedQuery).toBeDefined();
    expect(result.current.filteredActivities).toBeDefined();
    expect(result.current.rankingData).toBeDefined();
    expect(result.current.avatarUrls).toBeDefined();
    expect(typeof result.current.handleToggleHeart).toBe("function");
  });

  it("should fetch feed data when selectedTripId is provided", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    expect(result.current.feedQuery.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.filteredActivities).toHaveLength(3);
    expect(result.current.filteredActivities[0]!.id).toBe("activity-1");
    expect(result.current.filteredActivities[1]!.id).toBe("activity-2");
    expect(result.current.filteredActivities[2]!.id).toBe("activity-3");
  });

  it("should be disabled when selectedTripId is null", async () => {
    server.use(
      createCommunityFullHandler(() => {
        throw new Error("Should not be called");
      }),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: null, selectedFilter: "all" }),
    );

    expect(result.current.feedQuery.isLoading).toBe(false);
    expect(result.current.feedQuery.isFetching).toBe(false);
    expect(result.current.filteredActivities).toEqual([]);
  });

  it("should apply optimistic update when handleToggleHeart is called", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = buildCommunityFeedQueryKey("trip-1")!;

    // Verify initial state
    const initialData = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
    expect(initialData?.pages[0]!.activities[0]!.reactionsSummary!.total).toBe(5);
    expect(initialData?.pages[0]!.activities[0]!.reactionsSummary!.myReactions).toEqual([]);

    // Mock toggleReaction to delay so we can inspect optimistic state
    let resolveMutation: (value: unknown) => void;
    server.use(
      createORPCHandler(
        ["activityFeed", "toggleReaction"],
        () =>
          new Promise((resolve) => {
            resolveMutation = resolve;
          }),
      ),
    );

    // Trigger mutation (fire-and-forget)
    act(() => {
      result.current.handleToggleHeart("activity-1");
    });

    // Wait for optimistic update to be applied
    await waitFor(() => {
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 6;
    });

    const optimisticData = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(
      queryKey,
    );
    const optimisticActivity = optimisticData?.pages[0]!.activities.find(
      (a) => a.id === "activity-1",
    );
    expect(optimisticActivity?.reactionsSummary).toEqual({
      total: 6,
      counts: { heart: 6, fire: 0, clap: 0, star: 0 },
      myReactions: ["heart"],
    });

    // Resolve mutation to clean up
    resolveMutation!({
      activityId: "activity-1",
      reactionsSummary: optimisticActivity?.reactionsSummary,
    });

    await waitFor(() => {
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 6;
    });
  });

  it("should rollback optimistic update on mutation error", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = buildCommunityFeedQueryKey("trip-1")!;

    // Verify initial state
    const initialData = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
    expect(initialData?.pages[0]!.activities[0]!.reactionsSummary!.total).toBe(5);

    // Mock toggleReaction to throw
    server.use(
      createORPCHandler(["activityFeed", "toggleReaction"], () => {
        throw new Error("Failed to toggle reaction");
      }),
    );

    await expect(
      act(async () => {
        await result.current.handleToggleHeart("activity-1");
      }),
    ).rejects.toThrow("Failed to toggle reaction");

    const rolledBackData = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(
      queryKey,
    );
    const rolledBackActivity = rolledBackData?.pages[0]!.activities.find(
      (a) => a.id === "activity-1",
    );
    expect(rolledBackActivity?.reactionsSummary).toEqual({
      total: 5,
      counts: { heart: 5, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });

  it("should apply server reactionsSummary on mutation success", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = buildCommunityFeedQueryKey("trip-1")!;

    const serverReactionSummary = {
      total: 10,
      counts: { heart: 10, fire: 0, clap: 0, star: 0 },
      myReactions: ["heart"],
    };

    server.use(
      createORPCHandler(["activityFeed", "toggleReaction"], () => ({
        activityId: "activity-1",
        reactionsSummary: serverReactionSummary,
      })),
    );

    // Trigger mutation
    act(() => {
      result.current.handleToggleHeart("activity-1");
    });

    // Wait for success to be applied
    await waitFor(() => {
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 10;
    });

    const successData = queryClient.getQueryData<{ pages: (typeof mockFeedPage.feed)[] }>(queryKey);
    const successActivity = successData?.pages[0]!.activities.find((a) => a.id === "activity-1");
    expect(successActivity?.reactionsSummary).toEqual(serverReactionSummary);
  });

  it("should filter activities by selectedFilter", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "user_post" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.filteredActivities).toHaveLength(1);
    expect(result.current.filteredActivities[0]!.id).toBe("activity-2");
    expect(result.current.filteredActivities[0]!.activityType).toBe("user_post");
  });

  it("should move focusActivityId to the front of filtered activities", async () => {
    server.use(createCommunityFullHandler(() => mockFeedPage));

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
        focusActivityId: "activity-2",
      }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.filteredActivities).toHaveLength(3);
    expect(result.current.filteredActivities[0]!.id).toBe("activity-2");
    expect(result.current.filteredActivities[1]!.id).toBe("activity-1");
    expect(result.current.filteredActivities[2]!.id).toBe("activity-3");
  });

  it("should handle empty feed", async () => {
    server.use(
      createCommunityFullHandler(() => ({
        feed: {
          activities: [],
          pagination: {
            total: 0,
            page: 1,
            pageSize: 30,
            totalPages: 0,
            hasMore: false,
          },
          nextCursor: null,
        },
        ranking: { data: [], currentDate: "2024-01-01T00:00:00.000Z" },
        activeChallenges: [],
        avatarUrls: {},
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.filteredActivities).toEqual([]);
  });

  it("should handle feed with hasMore for pagination", async () => {
    server.use(
      createCommunityFullHandler(() => ({
        ...mockFeedPage,
        feed: {
          ...mockFeedPage.feed,
          pagination: { ...mockFeedPage.feed.pagination, hasMore: true },
          nextCursor: { id: "cursor-1", createdAt: "2024-01-01", isPinned: false },
        },
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.feedQuery.hasNextPage).toBe(true);
    expect(result.current.feedQuery.isFetchingNextPage).toBe(false);
  });

  describe("refreshFeed", () => {
    it("should be a no-op when no trip is selected", () => {
      const { result } = renderHookWithMSW(() =>
        useCommunityFeed({ selectedTripId: null, selectedFilter: "all" }),
      );

      expect(result.current.refreshFeed()).toBe(false);
    });

    it("should not cancel the first load while it is still in flight", async () => {
      let requestCount = 0;
      let resolveFirstPage: (value: unknown) => void;

      server.use(
        createCommunityFullHandler(() => {
          requestCount += 1;
          return new Promise((resolve) => {
            resolveFirstPage = resolve;
          });
        }),
      );

      const { result } = renderHookWithMSW(() =>
        useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
      );

      // Wait until the request is actually in flight, but never resolved.
      await waitFor(() => {
        expect(requestCount).toBe(1);
      });
      expect(result.current.feedQuery.isLoading).toBe(true);

      let refreshed = true;
      act(() => {
        refreshed = result.current.refreshFeed();
      });

      // invalidateQueries defaults to cancelRefetch: true, so refreshing here
      // would abort the initial load and leave the screen empty.
      expect(refreshed).toBe(false);

      await act(async () => {
        resolveFirstPage!(mockFeedPage);
      });

      await waitFor(() => {
        expect(result.current.feedQuery.isLoading).toBe(false);
      });

      expect(requestCount).toBe(1);
      expect(result.current.filteredActivities).toHaveLength(3);
    });

    it("should not refetch when the feed was loaded within the throttle window", async () => {
      let requestCount = 0;
      server.use(
        createCommunityFullHandler(() => {
          requestCount += 1;
          return mockFeedPage;
        }),
      );

      const { result } = renderHookWithMSW(() =>
        useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
      );

      await waitFor(() => {
        expect(result.current.feedQuery.isLoading).toBe(false);
      });
      expect(requestCount).toBe(1);

      let refreshed = true;
      act(() => {
        refreshed = result.current.refreshFeed();
      });

      expect(refreshed).toBe(false);
      expect(requestCount).toBe(1);
    });

    it("should refetch when the cached feed is older than the throttle window", async () => {
      let requestCount = 0;
      server.use(
        createCommunityFullHandler(() => {
          requestCount += 1;
          return mockFeedPage;
        }),
      );

      const { result, queryClient } = renderHookWithMSW(() =>
        useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
      );

      await waitFor(() => {
        expect(result.current.feedQuery.isLoading).toBe(false);
      });
      expect(requestCount).toBe(1);

      const queryKey = buildCommunityFeedQueryKey("trip-1")!;
      // Backdate the cache entry instead of waiting 30 real seconds.
      act(() => {
        queryClient.setQueryData(queryKey, (old: unknown) => old, {
          updatedAt: Date.now() - (COMMUNITY_FEED_MIN_REFRESH_INTERVAL_MS + 1000),
        });
      });

      let refreshed = false;
      act(() => {
        refreshed = result.current.refreshFeed();
      });

      expect(refreshed).toBe(true);
      await waitFor(() => {
        expect(requestCount).toBe(2);
      });
    });

    it("should keep a stable identity across renders", async () => {
      server.use(createCommunityFullHandler(() => mockFeedPage));

      const { result, rerender } = renderHookWithMSW(() =>
        useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
      );

      const initialRefreshFeed = result.current.refreshFeed;

      await waitFor(() => {
        expect(result.current.feedQuery.isLoading).toBe(false);
      });

      rerender(undefined);

      expect(result.current.refreshFeed).toBe(initialRefreshFeed);
    });
  });

  it("should not apply optimistic update when selectedTripId is null", async () => {
    server.use(
      createORPCHandler(["activityFeed", "toggleReaction"], () => ({
        activityId: "activity-1",
        reactionsSummary: {
          total: 6,
          counts: { heart: 6, fire: 0, clap: 0, star: 0 },
          myReactions: ["heart"],
        },
      })),
    );

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: null, selectedFilter: "all" }),
    );

    expect(() => {
      result.current.handleToggleHeart("activity-1");
    }).not.toThrow();

    expect(result.current.filteredActivities).toEqual([]);
  });
});
