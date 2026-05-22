import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { useTrips, buildTripQueryInput, getNextTripPageParam } from "../../trips/useTrips";

const mockUseInfiniteQuery = jest.fn();
const mockUseMemo = jest.fn((fn) => fn());
const mockUseState = jest.fn<(initial: unknown) => [unknown, jest.Mock]>();
const mockUseEffect = jest.fn((fn: () => void | (() => void)) => {
  const cleanup = fn();
  return cleanup;
});

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useMemo: (fn: () => unknown) => fn(),
  useState: (initial: unknown) => [initial, jest.fn()],
  useEffect: (fn: () => void | (() => void)) => {
    fn();
  },
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    trip: {
      getAll: {
        infiniteOptions: jest.fn((options: unknown) => options),
      },
    },
  },
}));

jest.mock("@mirai-app/shared", () => ({
  flattenTrips: (pages: unknown[]) => pages?.flatMap((page) => page?.trips ?? []) ?? [],
}));

jest.mock("~/services/storage/selectedTripStorage", () => ({
  getCachedTrips: jest.fn(() => Promise.resolve([])),
  setCachedTrips: jest.fn(() => Promise.resolve()),
}));

describe("useTrips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty trips when no data", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
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

    expect(result.current.trips).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("should flatten trips from pages", () => {
    const mockTrips = [
      { id: "1", name: "Trip 1" },
      { id: "2", name: "Trip 2" },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ trips: mockTrips, pagination: { hasMore: false } }],
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

    expect(result.current.trips).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should expose error state", () => {
    const error = new Error("Network error");

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
});

describe("buildTripQueryInput", () => {
  it("should build query input with valid pageParam", () => {
    const result = buildTripQueryInput(20);
    expect(result).toEqual({
      pagination: { limit: 20, offset: 20 },
    });
  });

  it("should default offset to 0 when pageParam is 0", () => {
    const result = buildTripQueryInput(0);
    expect(result).toEqual({
      pagination: { limit: 20, offset: 0 },
    });
  });
});

describe("getNextTripPageParam", () => {
  it("should return undefined when no more pages", () => {
    const result = getNextTripPageParam({
      pagination: { hasMore: false, offset: 0, limit: 20 },
    });
    expect(result).toBeUndefined();
  });

  it("should return next offset when more pages exist", () => {
    const result = getNextTripPageParam({
      pagination: { hasMore: true, offset: 20, limit: 20 },
    });
    expect(result).toBe(40);
  });
});

import { calculateAllTrips } from "../../trips/useTrips";

describe("calculateAllTrips", () => {
  it("should return tripsData when available", () => {
    const trips = [{ id: "1", name: "Trip 1" }] as unknown as TripListItem[];
    const result = calculateAllTrips(trips, null);
    expect(result).toEqual(trips);
  });

  it("should return cachedTrips when tripsData is null", () => {
    const cached = [{ id: "2", name: "Cached" }] as unknown as TripListItem[];
    const result = calculateAllTrips(null, cached);
    expect(result).toEqual(cached);
  });

  it("should return empty array when both are null", () => {
    const result = calculateAllTrips(null, null);
    expect(result).toEqual([]);
  });
});
