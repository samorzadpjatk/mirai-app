import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useTrips } from "../../trips/useTrips";

// Mock the storage functions
const mockGetCachedTrips = jest.fn<() => Promise<unknown[]>>();
const mockSetCachedTrips = jest.fn<(trips: unknown[]) => Promise<void>>();

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getCachedTrips: (...args: []) => mockGetCachedTrips(...args),
  setCachedTrips: (...args: [unknown[]]) => mockSetCachedTrips(...args),
}));

// Mock tRPC
const mockTripGetAllQuery = jest.fn(() => ({
  queryKey: ["trip", "getAll"],
}));

const mockTripGetAllQueryClient = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    trip: {
      getAll: {
        queryOptions: mockTripGetAllQuery,
      },
    },
  })),
  useTRPCClient: jest.fn(() => ({
    trip: {
      getAll: {
        query: mockTripGetAllQueryClient,
      },
    },
  })),
}));

// Mock React Query
interface MockInfiniteQueryResult {
  data: {
    pages: {
      trips: { id: string; name: string; startDate: string; endDate: string }[];
      pagination: { hasMore: boolean; offset: number; limit: number };
    }[];
  } | null;
  isLoading: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: jest.Mock;
  isError: boolean;
  error: Error | null;
  refetch: jest.Mock;
}

const mockUseInfiniteQuery = jest.fn<() => MockInfiniteQueryResult>();

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: []) => mockUseInfiniteQuery(...args),
}));

describe("useTrips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedTrips.mockResolvedValue([]);
  });

  it("should return initial loading state when no cache", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.trips).toEqual([]);
  });

  it("should return cached trips while loading", async () => {
    const cachedTrips = [
      {
        id: "trip-1",
        name: "Cached Trip 1",
        startDate: "2024-01-01",
        endDate: "2024-01-10",
      },
    ];
    mockGetCachedTrips.mockResolvedValue(cachedTrips);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.trips).toHaveLength(1);
    });

    expect(result.current.trips[0]!.id).toBe("trip-1");
    expect(result.current.trips[0]!.name).toBe("Cached Trip 1");
  });

  it("should return trips from API after loading", async () => {
    mockGetCachedTrips.mockResolvedValue([]);

    const apiTrips = [
      {
        id: "trip-2",
        name: "API Trip 2",
        startDate: "2024-02-01",
        endDate: "2024-02-10",
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            trips: apiTrips,
            pagination: { hasMore: false, offset: 0, limit: 20 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trips).toHaveLength(1);
    expect(result.current.trips[0]!.id).toBe("trip-2");
  });

  it("should handle error state", () => {
    const error = new Error("Failed to fetch trips");
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: true,
      error,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });

  it("should indicate hasNextPage when more pages available", () => {
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            trips: [{ id: "trip-1", name: "Trip 1", startDate: "2024-01-01", endDate: "2024-01-10" }],
            pagination: { hasMore: true, offset: 0, limit: 20 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    expect(result.current.hasNextPage).toBe(true);
  });

  it("should call fetchNextPage when requested", async () => {
    const fetchNextPage = jest.fn();
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    await result.current.fetchNextPage();

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("should indicate isFetchingNextPage during pagination", () => {
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    expect(result.current.isFetchingNextPage).toBe(true);
  });

  it("should indicate isRefetching during refresh", () => {
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    expect(result.current.isRefetching).toBe(true);
  });

  it("should flatten multiple pages of trips", async () => {
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            trips: [
              { id: "trip-1", name: "Trip 1", startDate: "2024-01-01", endDate: "2024-01-10" },
            ],
            pagination: { hasMore: true, offset: 0, limit: 20 },
          },
          {
            trips: [
              { id: "trip-2", name: "Trip 2", startDate: "2024-02-01", endDate: "2024-02-10" },
            ],
            pagination: { hasMore: false, offset: 20, limit: 20 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.trips).toHaveLength(2);
    });

    expect(result.current.trips[0]!.id).toBe("trip-1");
    expect(result.current.trips[1]!.id).toBe("trip-2");
  });

  it("should prioritize API data over cached data", async () => {
    const cachedTrips = [
      { id: "trip-cached", name: "Cached Trip", startDate: "2024-01-01", endDate: "2024-01-10" },
    ];
    mockGetCachedTrips.mockResolvedValue(cachedTrips);

    const apiTrips = [
      { id: "trip-api", name: "API Trip", startDate: "2024-02-01", endDate: "2024-02-10" },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            trips: apiTrips,
            pagination: { hasMore: false, offset: 0, limit: 20 },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => useTrips());

    await waitFor(() => {
      expect(result.current.trips).toHaveLength(1);
    });

    // API data should take precedence
    expect(result.current.trips[0]!.id).toBe("trip-api");
  });

  it("should call refetch when requested", async () => {
    const refetch = jest.fn();
    mockGetCachedTrips.mockResolvedValue([]);

    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      isError: false,
      error: null,
      refetch,
    });

    const { result } = renderHook(() => useTrips());

    await result.current.refetch();

    expect(refetch).toHaveBeenCalled();
  });
});
