import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useChallenges, buildChallengeQueryInput, getNextChallengePageParam } from "../../challenges/useChallenges";

const mockUseQuery = jest.fn();
const mockUseInfiniteQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useMemo: (fn: () => unknown) => fn(),
  useCallback: (fn: () => unknown) => fn,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    trip: {
      getById: {
        queryOptions: jest.fn(() => ({ queryKey: ["trip"] })),
      },
    },
    challenge: {
      getAllByTrip: {
        infiniteOptions: jest.fn((options: unknown) => options),
      },
    },
    user: {
      getMy: {
        queryOptions: jest.fn(() => ({ queryKey: ["user"] })),
      },
    },
  },
}));

jest.mock("@mirai-app/shared", () => ({
  mapChallengeToListItem: (challenge: { id: string; name: string }) => ({
    id: challenge.id,
    name: challenge.name,
    icon: "trophy",
    color: "#00ced1",
  }),
  countCompletedChallenges: (challenges: unknown[]) => challenges.length,
  calculateLeaderboardInfo: (userGroup: unknown, groups: unknown) => ({
    userGroup,
    totalGroups: groups?.length ?? 0,
  }),
  findUserGroup: (userId: string, participants: { group?: { id: string } }[]) => {
    return participants?.find((p) => p.group)?.group ?? null;
  },
}));

describe("useChallenges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state initially", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isRefetching: false,
      refetch: jest.fn(),
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

  it("should map challenges from API data", () => {
    const mockTrip = {
      id: "trip-123",
      participants: [{ group: { id: "group-1" } }],
      groups: [{ id: "group-1" }],
    };

    const mockChallenges = [
      { id: "c1", name: "Challenge 1" },
      { id: "c2", name: "Challenge 2" },
    ];

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("trip")) {
        return { data: mockTrip, isLoading: false, isRefetching: false, refetch: jest.fn() };
      }
      return { data: { id: "user-1" }, isLoading: false, isRefetching: false, refetch: jest.fn() };
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ challenges: mockChallenges, pagination: { hasMore: true } }],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    });

    const { result } = renderHook(() => useChallenges("trip-123"));

    expect(result.current.challenges).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle null tripId", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
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
    expect(result.current.isLoading).toBe(false);
  });
});

describe("buildChallengeQueryInput", () => {
  it("should build query input with valid tripId and pageParam", () => {
    const result = buildChallengeQueryInput("trip-123", 30);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 30 },
    });
  });

  it("should default offset to 0 when pageParam is 0", () => {
    const result = buildChallengeQueryInput("trip-123", 0);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 0 },
    });
  });

  it("should use empty string for null tripId", () => {
    const result = buildChallengeQueryInput(null, 0);
    expect(result.tripId).toBe("");
  });
});

describe("getNextChallengePageParam", () => {
  it("should return undefined when no more pages", () => {
    const result = getNextChallengePageParam({
      pagination: { hasMore: false, offset: 0, limit: 30 },
    });
    expect(result).toBeUndefined();
  });

  it("should return next offset when more pages exist", () => {
    const result = getNextChallengePageParam({
      pagination: { hasMore: true, offset: 30, limit: 30 },
    });
    expect(result).toBe(60);
  });
});
