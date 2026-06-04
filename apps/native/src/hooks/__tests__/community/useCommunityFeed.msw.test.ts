import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useCommunityFeed } from "../../community/useCommunityFeed";

const baseActivity = {
  tripId: "trip-1",
  activityType: "custom" as const,
  description: null,
  imageUrl: null,
  createdAt: "2024-01-01",
};

const mockFeedPage = {
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
};

describe("useCommunityFeed (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return feedQuery, filteredActivities, and handleToggleHeart", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

    const { result } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    expect(result.current.feedQuery).toBeDefined();
    expect(result.current.filteredActivities).toBeDefined();
    expect(typeof result.current.handleToggleHeart).toBe("function");
  });

  it("should fetch feed data when selectedTripId is provided", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

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
      createORPCHandler(["activityFeed", "getByTrip"], () => {
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
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = ["community-feed", "trip-1", 30];

    // Verify initial state
    const initialData = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
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
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 6;
    });

    const optimisticData = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
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
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 6;
    });
  });

  it("should rollback optimistic update on mutation error", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = ["community-feed", "trip-1", 30];

    // Verify initial state
    const initialData = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
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

    const rolledBackData = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
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
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

    const { result, queryClient } = renderHookWithMSW(() =>
      useCommunityFeed({ selectedTripId: "trip-1", selectedFilter: "all" }),
    );

    await waitFor(() => {
      expect(result.current.feedQuery.isLoading).toBe(false);
    });

    const queryKey = ["community-feed", "trip-1", 30];

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
      const data = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
      const activity = data?.pages[0]!.activities.find((a) => a.id === "activity-1");
      return activity?.reactionsSummary!.total === 10;
    });

    const successData = queryClient.getQueryData<{ pages: (typeof mockFeedPage)[] }>(queryKey);
    const successActivity = successData?.pages[0]!.activities.find((a) => a.id === "activity-1");
    expect(successActivity?.reactionsSummary).toEqual(serverReactionSummary);
  });

  it("should filter activities by selectedFilter", async () => {
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

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
    server.use(createORPCHandler(["activityFeed", "getByTrip"], () => mockFeedPage));

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
      createORPCHandler(["activityFeed", "getByTrip"], () => ({
        activities: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 30,
          totalPages: 0,
          hasMore: false,
        },
        nextCursor: null,
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
      createORPCHandler(["activityFeed", "getByTrip"], () => ({
        ...mockFeedPage,
        pagination: { ...mockFeedPage.pagination, hasMore: true },
        nextCursor: { id: "cursor-1", createdAt: "2024-01-01", isPinned: false },
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
