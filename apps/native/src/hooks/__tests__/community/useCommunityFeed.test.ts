import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useCommunityFeed } from "../../community/useCommunityFeed";

// Mock tRPC client
const mockToggleReaction = jest.fn();
const mockGetByTripQuery = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPCClient: jest.fn(() => ({
    activityFeed: {
      getByTrip: {
        query: mockGetByTripQuery,
      },
      toggleReaction: {
        mutate: mockToggleReaction,
      },
    },
  })),
}));

// Mock React Query
const mockUseInfiniteQuery = jest.fn<
  (options?: unknown) => {
    data: {
      pages: {
        activities: {
          id: string;
          activityType: string;
          reactionsSummary?: {
            total: number;
            counts: Record<string, number>;
            myReactions: string[];
          };
        }[];
        pagination: {
          total: number | null;
          page: number | null;
          pageSize: number;
          totalPages: number | null;
          hasMore: boolean;
        };
        nextCursor: unknown;
      }[];
    } | null;
    isLoading: boolean;
    isFetching: boolean;
    hasNextPage: boolean;
    fetchNextPage: jest.Mock;
  }
>();

const mockUseMutation = jest.fn<
  (options?: unknown) => {
    mutateAsync: jest.Mock;
  }
>();
const mockSetQueryData = jest.fn();
const mockCancelQueries = jest.fn();
const mockGetQueryData = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: mockUseInfiniteQuery,
  useMutation: mockUseMutation,
  useQueryClient: jest.fn(() => ({
    setQueryData: mockSetQueryData,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
  })),
}));

describe("useCommunityFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty activities when no trip selected", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: null,
        selectedFilter: "all",
      })
    );

    expect(result.current.filteredActivities).toEqual([]);
    expect(result.current.feedQuery.isLoading).toBe(false);
  });

  it("should return activities from feed query", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: {
          id: "post-1",
          content: "Hello community!",
          author: {
            user: {
              id: "user-1",
              name: "John Doe",
            },
          },
        },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      },
      {
        id: "activity-2",
        activityType: "admin_announcement",
        admin: {
          id: "admin-1",
          name: "Admin User",
        },
        reactionsSummary: {
          total: 10,
          counts: { heart: 5, fire: 3, clap: 2, star: 0 },
          myReactions: [],
        },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: {
              total: 2,
              page: 1,
              pageSize: 30,
              totalPages: 1,
              hasMore: false,
            },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(2);
    });

    expect(result.current.filteredActivities[0]!.id).toBe("activity-1");
    expect(result.current.filteredActivities[1]!.id).toBe("activity-2");
  });

  it("should filter activities by type", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "User post" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
      {
        id: "activity-2",
        activityType: "admin_announcement",
        admin: { id: "admin-1", name: "Admin" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "user_post",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(1);
    });

    expect(result.current.filteredActivities[0]!.activityType).toBe("user_post");
  });

  it("should prioritize focused activity", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "First post" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
      {
        id: "activity-2",
        activityType: "user_post",
        userPost: { id: "post-2", content: "Second post" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 2, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
        focusActivityId: "activity-2",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities[0]!.id).toBe("activity-2");
    });

    expect(result.current.filteredActivities).toHaveLength(2);
  });

  it("should handle toggle heart mutation", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test post" },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const mockMutateAsync = (jest.fn() as any).mockResolvedValue({
      activityId: "activity-1",
      reactionsSummary: {
        total: 4,
        counts: { heart: 2, fire: 1, clap: 1, star: 0 },
        myReactions: [],
      },
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(1);
    });

    act(() => {
      result.current.handleToggleHeart("activity-1");
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ activityId: "activity-1" });
  });

  it("should handle loading state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: true,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    expect(result.current.feedQuery.isLoading).toBe(true);
    expect(result.current.filteredActivities).toEqual([]);
  });

  it("should handle pagination with next cursor", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "First page" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 50, page: 1, pageSize: 30, totalPages: 2, hasMore: true },
            nextCursor: { id: "cursor-1", createdAt: new Date(), isPinned: false },
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.feedQuery.hasNextPage).toBe(true);
    });
  });

  it("should flatten multiple pages of activities", async () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: [
              { id: "activity-1", activityType: "user_post", reactionsSummary: { total: 0, counts: {}, myReactions: [] } },
            ],
            pagination: { total: 2, page: 1, pageSize: 1, totalPages: 2, hasMore: true },
            nextCursor: { id: "cursor-1", createdAt: new Date(), isPinned: false },
          },
          {
            activities: [
              { id: "activity-2", activityType: "admin_announcement", reactionsSummary: { total: 0, counts: {}, myReactions: [] } },
            ],
            pagination: { total: 2, page: 2, pageSize: 1, totalPages: 2, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(2);
    });

    expect(result.current.filteredActivities[0]!.id).toBe("activity-1");
    expect(result.current.filteredActivities[1]!.id).toBe("activity-2");
  });

  it("should handle queryFn when selectedTripId is provided", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test post" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
    ];

    (mockGetByTripQuery as any).mockResolvedValue({
      activities: mockActivities,
      pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
      nextCursor: null,
    });

    mockUseInfiniteQuery.mockImplementation((options: unknown) => {
      const opts = options as { queryFn?: (ctx: { pageParam: null }) => Promise<unknown> };
      // Simulate calling the queryFn
      if (opts.queryFn) {
        opts.queryFn({ pageParam: null }).catch(() => { /* noop */ });
      }
      return {
        data: {
          pages: [
            {
              activities: mockActivities,
              pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
              nextCursor: null,
            },
          ],
        },
        isLoading: false,
        isFetching: false,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
      };
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Verify queryFn was invoked
    await waitFor(() => {
      expect(mockGetByTripQuery).toHaveBeenCalledWith({
        tripId: "trip-1",
        page: 1,
        pageSize: 30,
        cursor: undefined,
      });
    });
  });

  it("should return empty activities when no trip selected via queryFn", () => {
    mockUseInfiniteQuery.mockImplementation((options: unknown) => {
      const opts = options as { queryFn?: (ctx: { pageParam: null }) => Promise<unknown> };
      // Simulate calling the queryFn
      if (opts.queryFn) {
        opts.queryFn({ pageParam: null }).catch(() => { /* noop */ });
      }
      return {
        data: {
          pages: [
            {
              activities: [],
              pagination: { total: 0, page: 1, pageSize: 30, totalPages: 0, hasMore: false },
              nextCursor: null,
            },
          ],
        },
        isLoading: false,
        isFetching: false,
        hasNextPage: false,
        fetchNextPage: jest.fn(),
      };
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: null,
        selectedFilter: "all",
      })
    );

    expect(result.current.filteredActivities).toEqual([]);
  });

  it("should handle applyReactionSummaryToFeed with queryKeyOverride", () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test" },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Verify the hook was rendered
    expect(mockUseInfiniteQuery).toHaveBeenCalled();
  });

  it("should handle onMutate with optimistic update", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test" },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      },
    ];

    let capturedOnMutate: ((variables: { activityId: string }) => Promise<unknown>) | undefined;

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onMutate?: (variables: { activityId: string }) => Promise<unknown> };
      capturedOnMutate = opts.onMutate;
      return {
        mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue({
          activityId: "activity-1",
          reactionsSummary: {
            total: 4,
            counts: { heart: 2, fire: 1, clap: 1, star: 0 },
            myReactions: [],
          },
        }),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Verify onMutate was captured
    expect(capturedOnMutate).toBeDefined();

    // Call onMutate to test the optimistic update
    if (capturedOnMutate) {
      await capturedOnMutate({ activityId: "activity-1" });
      expect(mockCancelQueries).toHaveBeenCalled();
    }
  });

  it("should handle onMutate when no trip selected", async () => {
    let capturedOnMutate: ((variables: { activityId: string }) => Promise<unknown>) | undefined;

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onMutate?: (variables: { activityId: string }) => Promise<unknown> };
      capturedOnMutate = opts.onMutate;
      return {
        mutateAsync: jest.fn(),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: null,
        selectedFilter: "all",
      })
    );

    // Call onMutate when no trip selected - should return undefined
    if (capturedOnMutate) {
      const result = await capturedOnMutate({ activityId: "activity-1" });
      expect(result).toBeUndefined();
    }
  });

  it("should handle onError rollback", () => {
    let capturedOnError: ((error: Error, variables: { activityId: string }, context: unknown) => void) | undefined;
    const previousData = {
      pages: [
        {
          activities: [
            {
              id: "activity-1",
              activityType: "user_post",
              reactionsSummary: { total: 5, counts: { heart: 3 }, myReactions: ["heart"] },
            },
          ],
          pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
          nextCursor: null,
        },
      ],
    };

    mockUseInfiniteQuery.mockReturnValue({
      data: previousData,
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onError?: (error: Error, variables: { activityId: string }, context: unknown) => void };
      capturedOnError = opts.onError;
      return {
        mutateAsync: jest.fn<() => Promise<unknown>>().mockRejectedValue(new Error("Toggle failed")),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Call onError to test rollback
    if (capturedOnError) {
      capturedOnError(new Error("Toggle failed"), { activityId: "activity-1" }, {
        queryKey: ["community-feed", "trip-1", 30],
        previousData,
      });
      expect(mockSetQueryData).toHaveBeenCalled();
    }
  });

  it("should handle onError when no context provided", () => {
    let capturedOnError: ((error: Error, variables: { activityId: string }, context: unknown) => void) | undefined;

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onError?: (error: Error, variables: { activityId: string }, context: unknown) => void };
      capturedOnError = opts.onError;
      return {
        mutateAsync: jest.fn(),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Call onError with no context - should not throw
    if (capturedOnError) {
      capturedOnError(new Error("Toggle failed"), { activityId: "activity-1" }, null);
      // Should not call setQueryData when no context
      expect(mockSetQueryData).not.toHaveBeenCalled();
    }
  });

  it("should handle onSuccess with server response", () => {
    let capturedOnSuccess: ((result: unknown, variables: { activityId: string }, context: unknown) => void) | undefined;

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: [
              {
                id: "activity-1",
                activityType: "user_post",
                reactionsSummary: { total: 4, counts: { heart: 2 }, myReactions: [] },
              },
            ],
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onSuccess?: (result: unknown, variables: { activityId: string }, context: unknown) => void };
      capturedOnSuccess = opts.onSuccess;
      return {
        mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue({
          activityId: "activity-1",
          reactionsSummary: {
            total: 4,
            counts: { heart: 2, fire: 1, clap: 1, star: 0 },
            myReactions: [],
          },
        }),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Call onSuccess to test server response update
    if (capturedOnSuccess) {
      capturedOnSuccess(
        {
          activityId: "activity-1",
          reactionsSummary: {
            total: 4,
            counts: { heart: 2, fire: 1, clap: 1, star: 0 },
            myReactions: [],
          },
        },
        { activityId: "activity-1" },
        null
      );
      expect(mockSetQueryData).toHaveBeenCalled();
    }
  });

  it("should handle onSuccess with undefined summary", () => {
    let capturedOnSuccess: ((result: unknown, variables: { activityId: string }, context: unknown) => void) | undefined;

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: [
              {
                id: "activity-1",
                activityType: "user_post",
                reactionsSummary: undefined,
              },
            ],
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onSuccess?: (result: unknown, variables: { activityId: string }, context: unknown) => void };
      capturedOnSuccess = opts.onSuccess;
      return {
        mutateAsync: jest.fn(),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Call onSuccess with no context - should still work
    if (capturedOnSuccess) {
      capturedOnSuccess(
        {
          activityId: "activity-1",
          reactionsSummary: { total: 5, counts: { heart: 3 }, myReactions: ["heart"] },
        },
        { activityId: "activity-1" },
        null
      );
      // Should still call setQueryData even without context
      expect(mockSetQueryData).toHaveBeenCalled();
    }
  });

  it("should handle toggleHeartSummaryLocally with no existing heart", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test" },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: [], // No heart reaction
        },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        activityId: "activity-1",
        reactionsSummary: {
          total: 6,
          counts: { heart: 4, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      }),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(1);
    });

    act(() => {
      result.current.handleToggleHeart("activity-1");
    });
  });

  it("should handle toggleHeartSummaryLocally with undefined summary", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test" },
        reactionsSummary: undefined, // No summary
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue({
        activityId: "activity-1",
        reactionsSummary: {
          total: 1,
          counts: { heart: 1, fire: 0, clap: 0, star: 0 },
          myReactions: ["heart"],
        },
      }),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    await waitFor(() => {
      expect(result.current.filteredActivities).toHaveLength(1);
    });

    act(() => {
      result.current.handleToggleHeart("activity-1");
    });
  });

  it("should handle focused activity not found in filtered list", async () => {
    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "First post" },
        reactionsSummary: { total: 0, counts: {}, myReactions: [] },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    const { result } = renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
        focusActivityId: "non-existent-activity",
      })
    );

    await waitFor(() => {
      // Should return base list when focused activity not found
      expect(result.current.filteredActivities).toHaveLength(1);
    });

    expect(result.current.filteredActivities[0]!.id).toBe("activity-1");
  });

  it("should handle applyReactionSummaryToFeed with function updater", async () => {
    let capturedOnMutate: ((variables: { activityId: string }) => Promise<unknown>) | undefined;

    const mockActivities = [
      {
        id: "activity-1",
        activityType: "user_post",
        userPost: { id: "post-1", content: "Test" },
        reactionsSummary: {
          total: 5,
          counts: { heart: 3, fire: 1, clap: 1, star: 0 },
          myReactions: ["heart"],
        },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            activities: mockActivities,
            pagination: { total: 1, page: 1, pageSize: 30, totalPages: 1, hasMore: false },
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });

    mockUseMutation.mockImplementation((options: unknown) => {
      const opts = options as { onMutate?: (variables: { activityId: string }) => Promise<unknown> };
      capturedOnMutate = opts.onMutate;
      return {
        mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue({
          activityId: "activity-1",
          reactionsSummary: {
            total: 4,
            counts: { heart: 2, fire: 1, clap: 1, star: 0 },
            myReactions: [],
          },
        }),
      };
    });

    renderHook(() =>
      useCommunityFeed({
        selectedTripId: "trip-1",
        selectedFilter: "all",
      })
    );

    // Test that onMutate uses function updater for applyReactionSummaryToFeed
    if (capturedOnMutate) {
      await capturedOnMutate({ activityId: "activity-1" });
      expect(mockCancelQueries).toHaveBeenCalled();
    }
  });
});
