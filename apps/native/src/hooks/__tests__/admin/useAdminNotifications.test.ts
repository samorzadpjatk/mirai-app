import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminNotifications } from "../../admin/useAdminNotifications";

// Mock oRPC
const mockGetAllInfiniteOptions = jest.fn((options: {
  input: (pageParam: number) => unknown;
  initialPageParam: number;
  getNextPageParam: (lastPage: { pagination?: { hasMore?: boolean; offset: number; limit: number } }) => unknown;
}) => ({
  queryKey: ["notifications", "getAll"],
  ...options,
}));

const mockRetryNotificationMutation = jest.fn((options: { onSuccess: () => void }) => ({
  mutationFn: jest.fn(),
  ...options,
}));

const mockDeleteNotificationMutation = jest.fn((options: { onSuccess: () => void }) => ({
  mutationFn: jest.fn(),
  ...options,
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    notifications: {
      getAll: {
        infiniteOptions: (options: { input: (pageParam: number) => { tripId: string; pagination: { limit: number; offset: number } }; initialPageParam: number; getNextPageParam: (lastPage: { pagination?: { hasMore?: boolean | undefined; offset: number; limit: number; } | undefined; }) => unknown; }) => mockGetAllInfiniteOptions(options),
      },
      retryNotification: {
        mutationOptions: (options: { onSuccess: () => void }) => mockRetryNotificationMutation(options),
      },
      delete: {
        mutationOptions: (options: { onSuccess: () => void }) => mockDeleteNotificationMutation(options),
      },
    },
  },
}));

jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateNotificationQueries: jest.fn(),
}));

// Mock React Query
const mockUseInfiniteQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

describe("useAdminNotifications", () => {
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

    const { result } = renderHook(() => useAdminNotifications(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.notifications).toEqual([]);
    expect(result.current.status).toBe("all");
  });

  it("should return notifications from API", async () => {
    const mockNotifications = [
      {
        id: "notif-1",
        title: "Test Notification",
        body: "This is a test",
        url: "/test",
        tripId: "trip-123",
        createdAt: "2024-01-01T00:00:00Z",
        createdBy: { id: "user-1", firstName: "John", lastName: "Doe" },
        pushes: [
          { targetUserId: "user-2", status: "sent", sentAt: new Date(), failureReason: null },
        ],
      },
      {
        id: "notif-2",
        title: "Another Notification",
        body: "Another test",
        url: "/test2",
        tripId: null,
        createdAt: "2024-01-02T00:00:00Z",
        createdBy: { id: "user-2", firstName: "Jane", lastName: "Smith" },
        pushes: [
          { targetUserId: "user-3", status: "failed", sentAt: null, failureReason: "Network error" },
        ],
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            notifications: mockNotifications,
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

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminNotifications(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0]!.id).toBe("notif-1");
    expect(result.current.notifications[1]!.title).toBe("Another Notification");
  });

  it("should handle status filter changes", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: null,
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

    const { result } = renderHook(() => useAdminNotifications(tripId));

    act(() => {
      result.current.setStatus("pending");
    });

    expect(result.current.status).toBe("pending");

    act(() => {
      result.current.setStatus("sent");
    });

    expect(result.current.status).toBe("sent");

    act(() => {
      result.current.setStatus("failed");
    });

    expect(result.current.status).toBe("failed");
  });

  it("should retry notification", async () => {
    const mockRetry = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });
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

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockRetry,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminNotifications(tripId));

    await act(async () => {
      await result.current.retryNotification("notif-1");
    });

    expect(mockRetry).toHaveBeenCalled();
  });

  it("should delete notification", async () => {
    const mockDelete = jest.fn<() => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });
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

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockDelete,
        isPending: false,
      });

    const { result } = renderHook(() => useAdminNotifications(tripId));

    await act(async () => {
      await result.current.deleteNotification("notif-1");
    });

    expect(mockDelete).toHaveBeenCalled();
  });

  it("should return correct status badge colors", () => {
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
      isPending: false,
    });

    const { result } = renderHook(() => useAdminNotifications(tripId));

    expect(result.current.getStatusBadge("sent")).toEqual({
      color: "#10b981",
      text: "Sent",
    });

    expect(result.current.getStatusBadge("failed")).toEqual({
      color: "#ef4444",
      text: "Failed",
    });

    expect(result.current.getStatusBadge("pending")).toEqual({
      color: "#3b82f6",
      text: "Pending",
    });

    expect(result.current.getStatusBadge("unknown")).toEqual({
      color: "#9ca3af",
      text: "unknown",
    });
  });

  it("should handle pagination", async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            notifications: [{ id: "notif-1", title: "Test" }],
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

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminNotifications(tripId));

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

    const { result } = renderHook(() => useAdminNotifications(tripId));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should indicate loading states for mutations", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      isRefetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      });

    const { result } = renderHook(() => useAdminNotifications(tripId));

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.isDeleting).toBe(true);
  });

  it("should work without tripId", () => {
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
      isPending: false,
    });

    const { result } = renderHook(() => useAdminNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.isLoading).toBe(false);
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

    const { result } = renderHook(() => useAdminNotifications(tripId));

    expect(result.current.isRefetching).toBe(true);
  });
});
