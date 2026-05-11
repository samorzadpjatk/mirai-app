import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useChallenges } from "../../challenges/useChallenges";

// Mock oRPC
const mockTripGetByIdQueryOptions = jest.fn((params: { input: { id: string } }) => ({
  queryKey: ["trip", "getById", params.input.id],
}));

const mockChallengeGetAllByTripInfiniteOptions = jest.fn((params: {
  input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } };
  initialPageParam: number;
  getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined;
  enabled?: boolean;
}) => ({
  queryKey: ["challenge", "getAllByTrip"],
  initialPageParam: params.initialPageParam,
  getNextPageParam: params.getNextPageParam,
  enabled: params.enabled,
}));

const mockUserGetMyQueryOptions = jest.fn((params: { input: Record<string, never> }) => ({
  queryKey: ["user", "getMy"],
  input: params.input,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    trip: {
      getById: {
        queryOptions: (params: { input: { id: string } }) => mockTripGetByIdQueryOptions(params),
      },
    },
    challenge: {
      getAllByTrip: {
        infiniteOptions: (params: {
          input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } };
          initialPageParam: number;
          getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => number | undefined;
          enabled?: boolean;
        }) => mockChallengeGetAllByTripInfiniteOptions(params),
      },
    },
    user: {
      getMy: {
        queryOptions: (params: { input: Record<string, never> }) => mockUserGetMyQueryOptions(params),
      },
    },
  },
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseInfiniteQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

// Mock styles
jest.mock("~/styles", () => ({
  colors: {
    primary: "#3b82f6",
  },
}));

describe("useChallenges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state when tripId provided", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenges).toEqual([]);
    expect(result.current.completedChallengesCount).toBe(0);
  });

  it("should return challenges from API", async () => {
    const mockTrip = {
      id: "trip-123",
      name: "Test Trip",
      participants: [{ user: { id: "user-1" }, group: { id: "group-1", name: "Team A", coins: 100 } }],
      groups: [
        { id: "group-1", name: "Team A", coins: 100 },
        { id: "group-2", name: "Team B", coins: 150 },
      ],
    };

    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        submissionType: "IMAGE",
        basePoints: 10,
        firstPlacePoints: 20,
        scoringCategory: "SPEED",
        description: "Take a creative photo",
        image: "https://example.com/image.jpg",
        status: "VISIBLE",
        participantGroupsCount: 5,
        myGroupSubmissionStatus: null,
      },
      {
        id: "challenge-2",
        name: "Video Challenge",
        submissionType: "VIDEO",
        basePoints: 15,
        firstPlacePoints: 30,
        scoringCategory: "JUDGED_STAFF",
        description: "Create a short video",
        image: null,
        status: "ACTIVE",
        participantGroupsCount: 3,
        myGroupSubmissionStatus: "APPROVED",
      },
    ];

    mockUseQuery
      .mockReturnValueOnce({
        data: mockTrip,
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: mockChallenges,
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0]!.id).toBe("challenge-1");
    expect(result.current.challenges[1]!.title).toBe("Video Challenge");
    expect(result.current.completedChallengesCount).toBe(1);
  });

  it("should handle empty tripId", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges(null));

    expect(result.current.trip).toBeNull();
    expect(result.current.challenges).toEqual([]);
  });

  it("should calculate leaderboard info for first place", async () => {
    const mockTrip = {
      id: "trip-123",
      name: "Test Trip",
      participants: [{ user: { id: "user-1" }, group: { id: "group-1", name: "Team A", coins: 200 } }],
      groups: [
        { id: "group-1", name: "Team A", coins: 200 },
        { id: "group-2", name: "Team B", coins: 150 },
      ],
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockTrip,
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [],
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.leaderboardInfo).not.toBeNull();
    });

    expect(result.current.leaderboardInfo?.position).toBe(1);
    expect(result.current.leaderboardInfo?.pointsDifference).toBe(50);
    expect(result.current.leaderboardInfo?.targetPosition).toBe(2);
    expect(result.current.leaderboardInfo?.targetGroupName).toBe("Team B");
  });

  it("should calculate leaderboard info for non-first place", async () => {
    const mockTrip = {
      id: "trip-123",
      name: "Test Trip",
      participants: [{ user: { id: "user-1" }, group: { id: "group-2", name: "Team B", coins: 150 } }],
      groups: [
        { id: "group-1", name: "Team A", coins: 200 },
        { id: "group-2", name: "Team B", coins: 150 },
      ],
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockTrip,
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1", name: "John" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [],
            pagination: { hasMore: false, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.leaderboardInfo).not.toBeNull();
    });

    expect(result.current.leaderboardInfo?.position).toBe(2);
    expect(result.current.leaderboardInfo?.pointsDifference).toBe(50);
    expect(result.current.leaderboardInfo?.targetPosition).toBe(1);
    expect(result.current.leaderboardInfo?.targetGroupName).toBe("Team A");
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [{ id: "challenge-1", name: "Challenge 1", submissionType: "IMAGE", basePoints: 10, status: "VISIBLE" }],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should indicate fetching next page", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    expect(result.current.isFetchingNextPage).toBe(true);
  });

  it("should handle refresh", async () => {
    const mockRefetchTrip = jest.fn();
    const mockRefetchChallenges = jest.fn();

    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
        refetch: mockRefetchTrip,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetchChallenges,
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await result.current.refresh();

    expect(mockRefetchTrip).toHaveBeenCalled();
    expect(mockRefetchChallenges).toHaveBeenCalled();
  });

  it("should indicate refreshing state", () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: true,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    expect(result.current.isRefreshing).toBe(true);
  });

  it("should map challenge statuses correctly", async () => {
    const mockChallenges = [
      { id: "c1", name: "Hidden", status: "HIDDEN", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
      { id: "c2", name: "Cancelled", status: "CANCELLED", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
      { id: "c3", name: "Approved", status: "ACTIVE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: "APPROVED" },
      { id: "c4", name: "Pending", status: "ACTIVE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: "PENDING" },
      { id: "c5", name: "Rejected", status: "ACTIVE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: "REJECTED" },
      { id: "c6", name: "Voting", status: "VOTING_PHASE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
      { id: "c7", name: "Completed", status: "COMPLETED", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
      { id: "c8", name: "Visible", status: "VISIBLE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
      { id: "c9", name: "Active", status: "ACTIVE", submissionType: "IMAGE", basePoints: 10, myGroupSubmissionStatus: null },
    ];

    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ challenges: mockChallenges, pagination: { hasMore: false, offset: 0, limit: 30 } }],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.challenges).toHaveLength(9);
    });

    const statuses = result.current.challenges.map((c) => c.status);
    expect(statuses).toContain("locked");
    expect(statuses).toContain("solved");
    expect(statuses).toContain("submitted");
    expect(statuses).toContain("rejected");
    expect(statuses).toContain("completed");
    expect(statuses).toContain("visible");
    expect(statuses).toContain("to_solve");
  });

  it("should handle unlimited scoring category", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Unlimited Challenge",
        submissionType: "IMAGE",
        basePoints: 10,
        firstPlacePoints: 50,
        scoringCategory: "UNLIMITED",
        status: "VISIBLE",
        myGroupSubmissionStatus: null,
      },
    ];

    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ challenges: mockChallenges, pagination: { hasMore: false, offset: 0, limit: 30 } }],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.challenges[0]!.points).toBe(10);
    });
  });

  it("should handle non-unlimited scoring category", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Speed Challenge",
        submissionType: "IMAGE",
        basePoints: 10,
        firstPlacePoints: 50,
        scoringCategory: "SPEED",
        status: "VISIBLE",
        myGroupSubmissionStatus: null,
      },
    ];

    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ challenges: mockChallenges, pagination: { hasMore: false, offset: 0, limit: 30 } }],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.challenges[0]!.points).toBe(50);
    });
  });

  it("should flatten multiple pages", async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: { id: "trip-123", participants: [], groups: [] },
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [{ id: "c1", name: "Challenge 1", submissionType: "IMAGE", basePoints: 10, status: "VISIBLE" }],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
          {
            challenges: [{ id: "c2", name: "Challenge 2", submissionType: "IMAGE", basePoints: 10, status: "VISIBLE" }],
            pagination: { hasMore: false, offset: 30, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.challenges).toHaveLength(2);
    });

    expect(result.current.challenges[0]!.id).toBe("c1");
    expect(result.current.challenges[1]!.id).toBe("c2");
  });

  it("should return null leaderboard info when no user group", async () => {
    const mockTrip = {
      id: "trip-123",
      name: "Test Trip",
      participants: [],
      groups: [{ id: "group-1", name: "Team A", coins: 100 }],
    };

    mockUseQuery
      .mockReturnValueOnce({
        data: mockTrip,
        isLoading: false,
        isRefetching: false,
      })
      .mockReturnValueOnce({
        data: { id: "user-1" },
        isLoading: false,
        isRefetching: false,
      });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ challenges: [], pagination: { hasMore: false, offset: 0, limit: 30 } }] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    await waitFor(() => {
      expect(result.current.leaderboardInfo).toBeNull();
    });
  });
});
