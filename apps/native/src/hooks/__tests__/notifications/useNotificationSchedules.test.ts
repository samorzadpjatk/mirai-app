import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useNotificationSchedules } from "../../notifications/useNotificationSchedules";

// Mock oRPC
jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    notificationSchedule: {
      getAll: {
        queryOptions: ({ input }: { input: Record<string, never> }) => ({
          queryKey: ["notificationSchedule", "getAll", input],
        }),
      },
      delete: {
        mutationOptions: ({ onSuccess }: { onSuccess?: () => void | Promise<void> }) => ({
          mutationFn: jest.fn(),
          onSuccess,
        }),
      },
      toggleActive: {
        mutationOptions: ({ onSuccess }: { onSuccess?: () => void | Promise<void> }) => ({
          mutationFn: jest.fn(),
          onSuccess,
        }),
      },
    },
  },
}));

// Mock query invalidation
jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateNotificationQueries: jest.fn(),
}));

// Mock React Query
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

describe("useNotificationSchedules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.schedules).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("should return schedules from API", async () => {
    const mockSchedules = [
      {
        id: "schedule-1",
        name: "Morning Reminder",
        body: "Don't forget to check in!",
        scheduledAt: "2024-01-01T08:00:00Z",
        isActive: true,
        tripId: "trip-123",
        createdBy: { id: "user-1", firstName: "John" },
      },
      {
        id: "schedule-2",
        name: "Evening Summary",
        body: "Check today's progress",
        scheduledAt: "2024-01-01T20:00:00Z",
        isActive: false,
        tripId: "trip-123",
        createdBy: { id: "user-2", firstName: "Jane" },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { schedules: mockSchedules },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.schedules[0]!.id).toBe("schedule-1");
    expect(result.current.schedules[1]!.name).toBe("Evening Summary");
  });

  it("should handle empty schedules", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.schedules).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle error state", () => {
    const error = new Error("Failed to fetch schedules");

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });

  it("should delete schedule", () => {
    const mockDelete = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mockDelete,
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    act(() => {
      result.current.deleteSchedule("schedule-1");
    });

    expect(mockDelete).toHaveBeenCalledWith({ id: "schedule-1" });

    consoleSpy.mockRestore();
  });

  it("should toggle schedule active state", () => {
    const mockToggle = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { /* noop */ });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: mockToggle,
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    act(() => {
      result.current.toggleActive("schedule-1");
    });

    expect(mockToggle).toHaveBeenCalledWith({ id: "schedule-1" });

    consoleSpy.mockRestore();
  });

  it("should indicate deleting state", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.isDeleting).toBe(true);
  });

  it("should indicate toggling state", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutate: jest.fn(),
        isPending: true,
      });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.isToggling).toBe(true);
  });

  it("should refetch schedules", async () => {
    const mockRefetch = jest.fn<() => Promise<{ data: { schedules: unknown[] } }>>()
      .mockResolvedValue({ data: { schedules: [] } });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should indicate fetching state", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: true,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.isFetching).toBe(true);
  });

  it("should handle null data from query", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.schedules).toEqual([]);
  });

  it("should handle undefined schedules in data", () => {
    mockUseQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useNotificationSchedules());

    expect(result.current.schedules).toEqual([]);
  });

});
