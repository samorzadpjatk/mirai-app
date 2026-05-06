import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminChallengesByTrip } from "../../admin/useAdminChallengesByTrip";

// Mock tRPC
const mockGetAllByTripQuery = jest.fn(() => ({
  queryKey: ["challenge", "getAllByTrip"],
}));

const mockGetAllByTripQueryClient = jest.fn();

const mockDeleteMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    challenge: {
      getAllByTrip: {
        queryOptions: mockGetAllByTripQuery,
      },
      delete: {
        mutationOptions: mockDeleteMutation,
      },
    },
  })),
  useTRPCClient: jest.fn(() => ({
    challenge: {
      getAllByTrip: {
        query: mockGetAllByTripQueryClient,
      },
    },
  })),
}));

// Mock React Query
interface InfiniteQueryOptions {
  enabled?: boolean;
}

interface InfiniteQueryResult {
  data: unknown;
  isLoading: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: jest.Mock;
  refetch: jest.Mock;
  enabled?: boolean;
}

const mockUseInfiniteQuery = jest.fn<(options: InfiniteQueryOptions) => InfiniteQueryResult>();
const mockUseMutation = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockGetQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockGetQueryClient(),
}));

describe("useAdminChallengesByTrip", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.challenges).toEqual([]);
  });

  it("should return challenges from API", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Photo Challenge",
        description: "Take a great photo",
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
      {
        id: "challenge-2",
        name: "Video Challenge",
        description: "Record a video",
        basePoints: 200,
        status: "HIDDEN",
        tripId: "trip-123",
      },
    ];

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
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.challenges[0].id).toBe("challenge-1");
    expect(result.current.challenges[0].title).toBe("Photo Challenge");
    expect(result.current.challenges[1].basePoints).toBe(200);
    expect(result.current.challenges[1].status).toBe("HIDDEN");
  });

  it("should handle challenges with null description", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Challenge",
        description: null,
        basePoints: 100,
        status: "ACTIVE",
        tripId: "trip-123",
      },
    ];

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
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0].description).toBeNull();
  });

  it("should use default status when not provided", async () => {
    const mockChallenges = [
      {
        id: "challenge-1",
        name: "Challenge",
        description: "Description",
        basePoints: null,
        status: null,
        tripId: "trip-123",
      },
    ];

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
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges[0].status).toBe("HIDDEN");
    expect(result.current.challenges[0].basePoints).toBe(0);
  });

  it("should calculate stats correctly", async () => {
    const mockChallenges = [
      { id: "1", name: "C1", description: "D1", basePoints: 100, status: "ACTIVE", tripId: "trip-123" },
      { id: "2", name: "C2", description: "D2", basePoints: 200, status: "HIDDEN", tripId: "trip-123" },
      { id: "3", name: "C3", description: "D3", basePoints: 300, status: "ACTIVE", tripId: "trip-123" },
    ];

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
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats.totalChallenges).toBe(3);
  });

  it("should delete challenge", async () => {
    const mockDelete = jest.fn().mockResolvedValue(undefined);

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await act(async () => {
      await result.current.deleteChallenge("challenge-1");
    });

    expect(mockDelete).toHaveBeenCalledWith({
      id: "challenge-1",
      tripId: "trip-123",
    });
  });

  it("should indicate deleting state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    expect(result.current.isDeleting).toBe(true);
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [{ id: "1", name: "C1", description: "D1", basePoints: 100, status: "ACTIVE", tripId: "trip-123" }],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should handle refetch", async () => {
    const mockRefetch = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should handle refetching state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    expect(result.current.isRefetching).toBe(true);
  });

  it("should handle fetching next page state", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    expect(result.current.isFetchingNextPage).toBe(true);
  });

  it("should flatten multiple pages", async () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            challenges: [
              { id: "1", name: "C1", description: "D1", basePoints: 100, status: "ACTIVE", tripId: "trip-123" },
            ],
            pagination: { hasMore: true, offset: 0, limit: 30 },
          },
          {
            challenges: [
              { id: "2", name: "C2", description: "D2", basePoints: 200, status: "HIDDEN", tripId: "trip-123" },
            ],
            pagination: { hasMore: false, offset: 30, limit: 30 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.challenges).toHaveLength(2);
    });

    expect(result.current.challenges[0].id).toBe("1");
    expect(result.current.challenges[1].id).toBe("2");
  });

  it("should handle empty challenges", async () => {
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
      refetch: jest.fn(),
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminChallengesByTrip(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challenges).toEqual([]);
    expect(result.current.stats.totalChallenges).toBe(0);
  });

  it("should be disabled when tripId is empty", () => {
    mockUseInfiniteQuery.mockImplementation((options) => {
      return {
        data: null,
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
        enabled: options.enabled,
      };
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    renderHook(() => useAdminChallengesByTrip(""));

    const lastCall = mockUseInfiniteQuery.mock.calls[mockUseInfiniteQuery.mock.calls.length - 1];
    expect(lastCall[0].enabled).toBe(false);
  });
});
