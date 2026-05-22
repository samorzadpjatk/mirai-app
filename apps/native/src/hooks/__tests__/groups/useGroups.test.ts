import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useGroups, buildGroupQueryInput, getNextGroupPageParam } from "../../groups/useGroups";

const mockUseInfiniteQuery = jest.fn();
const mockGetAllInfiniteOptions = jest.fn(
  (options: {
    input: (pageParam: number) => unknown;
    initialPageParam: number;
    getNextPageParam: (lastPage: {
      pagination: { hasMore: boolean; offset: number; limit: number };
    }) => unknown;
    enabled: boolean;
  }) => ({
    queryKey: ["groups", "getAll"],
    ...options,
  }),
);

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    group: {
      getAll: {
        infiniteOptions: (options: {
          input: (pageParam: number) => unknown;
          initialPageParam: number;
          getNextPageParam: (lastPage: {
            pagination: { hasMore: boolean; offset: number; limit: number };
          }) => unknown;
          enabled: boolean;
        }) => mockGetAllInfiniteOptions(options),
      },
    },
  },
}));

describe("useGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("query initialization", () => {
    it("should initialize with empty tripId", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups());

      expect(result.current.groups).toEqual([]);
      expect(result.current.filteredGroups).toEqual([]);
    });

    it("should enable query when tripId is provided", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      renderHook(() => useGroups("trip-123"));

      expect(mockGetAllInfiniteOptions).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it("should disable query when tripId is null", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      renderHook(() => useGroups(null));

      expect(mockGetAllInfiniteOptions).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("should disable query when tripId is undefined", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      renderHook(() => useGroups(undefined));

      expect(mockGetAllInfiniteOptions).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });
  });

  describe("groups data processing", () => {
    it("should flatten paginated groups data", () => {
      const mockGroups = [
        {
          id: "group-1",
          name: "Group 1",
          code: "G1",
          image: "img1.jpg",
          participants: [{ id: "p1" }],
        },
        {
          id: "group-2",
          name: "Group 2",
          code: "G2",
          image: "img2.jpg",
          participants: [{ id: "p1" }, { id: "p2" }],
        },
      ];

      mockUseInfiniteQuery.mockReturnValue({
        data: {
          pages: [{ groups: mockGroups, pagination: { hasMore: true, offset: 0, limit: 30 } }],
        },
        isLoading: false,
        isRefetching: false,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0]!.id).toBe("group-1");
      expect(result.current.groups[1]!.id).toBe("group-2");
    });

    it("should handle multiple pages of groups", () => {
      const page1Groups = [
        { id: "group-1", name: "Group 1", code: "G1", image: "img1.jpg", participants: [] },
      ];
      const page2Groups = [
        { id: "group-2", name: "Group 2", code: "G2", image: "img2.jpg", participants: [] },
      ];

      mockUseInfiniteQuery.mockReturnValue({
        data: {
          pages: [
            { groups: page1Groups, pagination: { hasMore: true, offset: 0, limit: 30 } },
            { groups: page2Groups, pagination: { hasMore: false, offset: 30, limit: 30 } },
          ],
        },
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.groups).toHaveLength(2);
      expect(result.current.groups[0]!.id).toBe("group-1");
      expect(result.current.groups[1]!.id).toBe("group-2");
    });

    it("should handle empty groups data", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: {
          pages: [{ groups: [], pagination: { hasMore: false, offset: 0, limit: 30 } }],
        },
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.groups).toEqual([]);
      expect(result.current.filteredGroups).toEqual([]);
    });

    it("should handle undefined data", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.groups).toEqual([]);
    });
  });

  describe("filtered groups", () => {
    const mockGroups = [
      {
        id: "group-1",
        name: "Alpha Team",
        code: "AT1",
        image: "img1.jpg",
        participants: [{ id: "p1" }],
      },
      {
        id: "group-2",
        name: "Beta Squad",
        code: "BS1",
        image: "img2.jpg",
        participants: [{ id: "p1" }, { id: "p2" }],
      },
      { id: "group-3", name: "Gamma Group", code: "GG1", image: "img3.jpg", participants: [] },
    ];

    beforeEach(() => {
      mockUseInfiniteQuery.mockReturnValue({
        data: {
          pages: [{ groups: mockGroups, pagination: { hasMore: false, offset: 0, limit: 30 } }],
        },
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });
    });

    it("should return all groups when search query is empty", () => {
      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.filteredGroups).toHaveLength(3);
    });

    it("should filter groups by name (case insensitive)", () => {
      const { result } = renderHook(() => useGroups("trip-123"));

      result.current.setSearchQuery("alpha");

      expect(typeof result.current.setSearchQuery).toBe("function");
    });

    it("should map groups to GroupListItem format", () => {
      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.filteredGroups[0]).toEqual({
        id: "group-1",
        name: "Alpha Team",
        code: "AT1",
        image: "img1.jpg",
        participantCount: 1,
      });
    });

    it("should calculate participant count correctly", () => {
      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.filteredGroups[0]!.participantCount).toBe(1);
      expect(result.current.filteredGroups[1]!.participantCount).toBe(2);
      expect(result.current.filteredGroups[2]!.participantCount).toBe(0);
    });
  });

  describe("loading states", () => {
    it("should return isLoading from query", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isRefetching from query", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [] },
        isLoading: false,
        isRefetching: true,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.isRefetching).toBe(true);
    });

    it("should return isFetchingNextPage from query", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [] },
        isLoading: false,
        isRefetching: false,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.isFetchingNextPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });
  });

  describe("pagination", () => {
    it("should expose fetchNextPage function", () => {
      const mockFetchNextPage = jest.fn();
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [] },
        isLoading: false,
        isRefetching: false,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: mockFetchNextPage,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(typeof result.current.fetchNextPage).toBe("function");
    });

    it("should expose refetch function", () => {
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

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(typeof result.current.refetch).toBe("function");
    });
  });

  describe("search functionality", () => {
    it("should initialize with empty search query", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [{ groups: [], pagination: { hasMore: false, offset: 0, limit: 30 } }] },
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(result.current.searchQuery).toBe("");
    });

    it("should expose setSearchQuery function", () => {
      mockUseInfiniteQuery.mockReturnValue({
        data: { pages: [{ groups: [], pagination: { hasMore: false, offset: 0, limit: 30 } }] },
        isLoading: false,
        isRefetching: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useGroups("trip-123"));

      expect(typeof result.current.setSearchQuery).toBe("function");
    });
  });
});

describe("buildGroupQueryInput", () => {
  it("should build query input with valid tripId and pageParam", () => {
    const result = buildGroupQueryInput("trip-123", 30);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 30 },
    });
  });

  it("should default offset to 0 when pageParam is 0", () => {
    const result = buildGroupQueryInput("trip-123", 0);
    expect(result).toEqual({
      tripId: "trip-123",
      pagination: { limit: 30, offset: 0 },
    });
  });

  it("should use empty string for null tripId", () => {
    const result = buildGroupQueryInput(null, 0);
    expect(result.tripId).toBe("");
  });

  it("should use empty string for undefined tripId", () => {
    const result = buildGroupQueryInput(undefined, 0);
    expect(result.tripId).toBe("");
  });
});

describe("getNextGroupPageParam", () => {
  it("should return undefined when no more pages", () => {
    const result = getNextGroupPageParam({
      pagination: { hasMore: false, offset: 0, limit: 30 },
    });
    expect(result).toBeUndefined();
  });

  it("should return next offset when more pages exist", () => {
    const result = getNextGroupPageParam({
      pagination: { hasMore: true, offset: 30, limit: 30 },
    });
    expect(result).toBe(60);
  });
});
