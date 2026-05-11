import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminTransactions } from "../../admin/useAdminTransactions";

// Mock oRPC
const mockGetAllInfiniteOptions = jest.fn((options: { input: unknown; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => unknown; enabled: boolean }) => ({
  queryKey: ["coinTransaction", "getAll"],
  ...options,
}));

const mockGetAllNamesQuery = jest.fn((options: { input: unknown; enabled: boolean }) => ({
  queryKey: ["group", "getAllNames"],
  ...options,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    coinTransaction: {
      getAll: {
        infiniteOptions: (options: { input: unknown; initialPageParam: number; getNextPageParam: (lastPage: { pagination: { hasMore: boolean; offset: number; limit: number } }) => unknown; enabled: boolean }) => mockGetAllInfiniteOptions(options),
      },
    },
    group: {
      getAllNames: {
        queryOptions: (options: { input: unknown; enabled: boolean }) => mockGetAllNamesQuery(options),
      },
    },
  },
}));

// Mock React Query
const mockUseInfiniteQuery = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useAdminTransactions", () => {
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.groupsLoading).toBe(true);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.groups).toEqual([]);
  });

  it("should return transactions from API", async () => {
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: "Challenge completion",
        createdAt: "2024-01-01T10:00:00Z",
        group: { id: "group-1", name: "Team Alpha" },
        admin: { id: "admin-1", firstName: "John", lastName: "Doe" },
      },
      {
        id: "tx-2",
        amount: -50,
        reason: "Penalty",
        createdAt: new Date("2024-01-02T15:30:00Z"),
        group: { id: "group-2", name: "Team Beta" },
        admin: { id: "admin-2", firstName: "Jane", lastName: "Smith" },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            transactions: mockTransactions,
            pagination: { hasMore: false, offset: 0, limit: 50 },
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions[0]!.id).toBe("tx-1");
    expect(result.current.transactions[0]!.amount).toBe(100);
    expect(result.current.transactions[1]!.amount).toBe(-50);
    expect(result.current.transactions[1]!.admin.firstName).toBe("Jane");
  });

  it("should return groups from API", async () => {
    const mockGroups = [
      { id: "group-1", name: "Team Alpha" },
      { id: "group-2", name: "Team Beta" },
      { id: "group-3", name: "Team Gamma" },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: mockGroups,
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.groupsLoading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(3);
    expect(result.current.groups[0]!.name).toBe("Team Alpha");
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            transactions: [{ id: "tx-1", amount: 100, reason: "Test", createdAt: "2024-01-01T00:00:00Z", group: { id: "g-1", name: "G1" }, admin: { id: "a-1", firstName: "A", lastName: "B" } }],
            pagination: { hasMore: true, offset: 0, limit: 50 },
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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

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

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

    expect(result.current.isFetchingNextPage).toBe(true);
    expect(result.current.hasNextPage).toBe(true);
  });

  it("should flatten multiple pages of transactions", async () => {
    const mockTransactions = [
      {
        id: "tx-1",
        amount: 100,
        reason: "Page 1",
        createdAt: "2024-01-01T00:00:00Z",
        group: { id: "g-1", name: "G1" },
        admin: { id: "a-1", firstName: "A", lastName: "B" },
      },
      {
        id: "tx-2",
        amount: 200,
        reason: "Page 2",
        createdAt: "2024-01-02T00:00:00Z",
        group: { id: "g-2", name: "G2" },
        admin: { id: "a-2", firstName: "C", lastName: "D" },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { transactions: [mockTransactions[0]], pagination: { hasMore: true, offset: 0, limit: 50 } },
          { transactions: [mockTransactions[1]], pagination: { hasMore: false, offset: 50, limit: 50 } },
        ],
      },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = renderHook(() => useAdminTransactions(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions[0]!.reason).toBe("Page 1");
    expect(result.current.transactions[1]!.reason).toBe("Page 2");
  });

  it("should disable query when tripId is empty", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderHook(() => useAdminTransactions(""));

    const infiniteQueryCall = mockUseInfiniteQuery.mock.calls[0];
    expect((infiniteQueryCall![0] as { enabled?: boolean }).enabled).toBe(false);
  });
});
