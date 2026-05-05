import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useAdminSchedules } from "../../admin/useAdminSchedules";

// Mock tRPC
const mockGetAllQuery = jest.fn(() => ({
  queryKey: ["notificationSchedule", "getAll"],
}));

const mockCreateMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpdateMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockDeleteMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockToggleMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

const mockUpsertTemplateMutation = jest.fn(() => ({
  mutationFn: jest.fn(),
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: jest.fn(() => ({
    notificationSchedule: {
      getAll: {
        queryOptions: mockGetAllQuery,
      },
      create: {
        mutationOptions: mockCreateMutation,
      },
      update: {
        mutationOptions: mockUpdateMutation,
      },
      delete: {
        mutationOptions: mockDeleteMutation,
      },
      toggleActive: {
        mutationOptions: mockToggleMutation,
      },
      upsertTemplate: {
        mutationOptions: mockUpsertTemplateMutation,
      },
    },
  })),
}));

// Mock query invalidation
jest.mock("@mirai-app/trpc/client/query", () => ({
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

describe("useAdminSchedules", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.schedules).toEqual([]);
  });

  it("should return schedules from API", async () => {
    const mockSchedules = [
      {
        id: "schedule-1",
        name: "Morning Reminder",
        notificationType: "DAILY_REMINDER",
        notificationTitle: "Good Morning",
        notificationBody: "Start your day!",
        hour: 9,
        minute: 0,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
        lastRun: "2024-01-15T09:00:00Z",
        tripId: "trip-123",
        _count: { notificationExecutions: 15 },
      },
      {
        id: "schedule-2",
        name: "Evening Summary",
        notificationType: "DAILY_SUMMARY",
        notificationTitle: "Daily Summary",
        notificationBody: "Check your progress",
        hour: 20,
        minute: 30,
        isActive: false,
        createdAt: "2024-01-01T00:00:00Z",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T23:59:59Z",
        lastRun: null,
        tripId: "trip-123",
        _count: { notificationExecutions: 0 },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { schedules: mockSchedules },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.schedules[0].id).toBe("schedule-1");
    expect(result.current.schedules[0].triggerTime).toBe("09:00");
    expect(result.current.schedules[0].isRecurring).toBe(true);
    expect(result.current.schedules[1].triggerTime).toBe("20:30");
    expect(result.current.schedules[1].isRecurring).toBe(false);
  });

  it("should create schedule", async () => {
    const mockCreate = jest.fn().mockResolvedValue({ id: "schedule-new" });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    const createData = {
      tripId: "trip-123",
      name: "New Schedule",
      notificationType: "REMINDER",
      hour: 10,
      minute: 0,
      startDate: new Date(),
      endDate: new Date(),
    };

    await act(async () => {
      await result.current.createSchedule(createData);
    });

    expect(mockCreate).toHaveBeenCalledWith(createData);
  });

  it("should update schedule", async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ id: "schedule-1" });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockUpdate,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    const updateData = {
      id: "schedule-1",
      name: "Updated Schedule",
      hour: 14,
      minute: 30,
    };

    await act(async () => {
      await result.current.updateSchedule(updateData);
    });

    expect(mockUpdate).toHaveBeenCalledWith(updateData);
  });

  it("should delete schedule", async () => {
    const mockDelete = jest.fn().mockResolvedValue({ success: true });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockDelete,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    await act(async () => {
      await result.current.deleteSchedule("schedule-1");
    });

    expect(mockDelete).toHaveBeenCalledWith({ id: "schedule-1" });
  });

  it("should toggle schedule active state", async () => {
    const mockToggle = jest.fn().mockResolvedValue({ id: "schedule-1", isActive: false });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockToggle,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    await act(async () => {
      await result.current.toggleSchedule("schedule-1");
    });

    expect(mockToggle).toHaveBeenCalledWith({ id: "schedule-1" });
  });

  it("should upsert template schedule", async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ id: "schedule-template" });

    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockUpsert,
        isPending: false,
      })
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    await act(async () => {
      await result.current.upsertTemplateSchedule("daily_morning");
    });

    expect(mockUpsert).toHaveBeenCalledWith({ tripId: "trip-123", templateKey: "daily_morning" });
  });

  it("should throw error when upserting template without tripId", async () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminSchedules());

    let error: Error | null = null;
    try {
      await result.current.upsertTemplateSchedule("daily_morning");
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toBe("Trip is required to create template schedules");
  });

  it("should indicate loading states for mutations", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      })
      .mockReturnValueOnce({
        mutateAsync: jest.fn(),
        isPending: true,
      });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    expect(result.current.isCreating).toBe(true);
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.isDeleting).toBe(true);
    expect(result.current.isToggling).toBe(true);
    expect(result.current.isUpsertingTemplate).toBe(true);
  });

  it("should format schedule message correctly", async () => {
    const mockSchedules = [
      {
        id: "schedule-1",
        name: "Test Schedule",
        notificationType: "CUSTOM",
        notificationTitle: "Custom Title",
        notificationBody: "Custom Body",
        hour: 12,
        minute: 0,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T23:59:59Z",
        lastRun: null,
        tripId: "trip-123",
        _count: { notificationExecutions: 0 },
      },
      {
        id: "schedule-2",
        name: "No Body Schedule",
        notificationType: "SYSTEM",
        notificationTitle: null,
        notificationBody: null,
        hour: 15,
        minute: 30,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-01T23:59:59Z",
        lastRun: null,
        tripId: "trip-123",
        _count: { notificationExecutions: 0 },
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { schedules: mockSchedules },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules[0].message).toBe("Custom Body");
    expect(result.current.schedules[1].message).toBe("Scheduled notification: SYSTEM");
  });

  it("should work without tripId", () => {
    mockUseQuery.mockReturnValue({
      data: { schedules: [] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useAdminSchedules());

    expect(result.current.schedules).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
