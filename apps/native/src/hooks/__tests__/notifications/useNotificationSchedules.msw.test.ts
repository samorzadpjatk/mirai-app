import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { waitFor, act } from "@testing-library/react-native";
import { useNotificationSchedules } from "../../notifications/useNotificationSchedules";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler, resetHandlers } from "../../../test-utils/msw/server";

describe("useNotificationSchedules (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
  });

  it("should return loading state initially", async () => {
    server.use(
      createORPCHandler(
        ["notificationSchedule", "getAll"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

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

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: mockSchedules })),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.schedules[0]!.id).toBe("schedule-1");
    expect(result.current.schedules[1]!.name).toBe("Evening Summary");
  });

  it("should handle empty schedules", async () => {
    server.use(createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })));

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
  });

  it("should handle error state", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => {
        throw new Error("Failed to fetch schedules");
      }),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.schedules).toEqual([]);
  });

  it("should delete schedule", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "delete"], ({ id }) => {
        expect(id).toBe("schedule-1");
        return { id: "schedule-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.deleteSchedule("schedule-1");
    });

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it("should toggle schedule active state", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "toggleActive"], ({ id }) => {
        expect(id).toBe("schedule-1");
        return { id: "schedule-1", isActive: false };
      }),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.toggleActive("schedule-1");
    });

    await waitFor(() => {
      expect(result.current.isToggling).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it("should indicate deleting state", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(
        ["notificationSchedule", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger delete without awaiting
    result.current.deleteSchedule("schedule-1");

    await waitFor(() => {
      expect(result.current.isDeleting).toBe(true);
    });
  });

  it("should indicate toggling state", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(
        ["notificationSchedule", "toggleActive"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger toggle without awaiting
    result.current.toggleActive("schedule-1");

    await waitFor(() => {
      expect(result.current.isToggling).toBe(true);
    });
  });

  it("should refetch schedules", async () => {
    let callCount = 0;
    const mockSchedules = [
      {
        id: "schedule-1",
        name: "Test",
        body: "Body",
        scheduledAt: "2024-01-01T08:00:00Z",
        isActive: true,
        tripId: "trip-123",
        createdBy: { id: "user-1", firstName: "John" },
      },
    ];

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => {
        callCount++;
        return { schedules: callCount === 1 ? [] : mockSchedules };
      }),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.schedules).toHaveLength(1);
    });
  });

  it("should indicate fetching state", async () => {
    server.use(
      createORPCHandler(
        ["notificationSchedule", "getAll"],
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ schedules: [] }), 100);
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    expect(result.current.isFetching).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle null data from query", async () => {
    server.use(createORPCHandler(["notificationSchedule", "getAll"], () => null));

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
  });

  it("should handle undefined schedules in data", async () => {
    server.use(createORPCHandler(["notificationSchedule", "getAll"], () => ({})));

    const { result } = renderHookWithMSW(() => useNotificationSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
  });
});
