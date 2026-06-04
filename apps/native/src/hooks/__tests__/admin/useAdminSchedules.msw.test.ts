import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildScheduleMessage,
  isScheduleRecurring,
  toTriggerTime,
  useAdminSchedules,
} from "../../admin/useAdminSchedules";

describe("useAdminSchedules (MSW)", () => {
  const tripId = "trip-123";

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

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

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

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({
        schedules: mockSchedules,
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.schedules[0]!.id).toBe("schedule-1");
    expect(result.current.schedules[0]!.triggerTime).toBe("09:00");
    expect(result.current.schedules[0]!.isRecurring).toBe(true);
    expect(result.current.schedules[1]!.triggerTime).toBe("20:30");
    expect(result.current.schedules[1]!.isRecurring).toBe(false);
  });

  it("should create schedule", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "create"], (data) => {
        expect(data).toMatchObject({
          tripId: "trip-123",
          name: "New Schedule",
          notificationType: "custom",
          hour: 10,
          minute: 0,
        });
        return { id: "schedule-new" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const createData = {
      tripId: "trip-123",
      name: "New Schedule",
      notificationType: "custom" as const,
      notificationTitle: "Test Title",
      notificationBody: "Test Body",
      hour: 10,
      minute: 0,
      startDate: new Date(),
      endDate: new Date(),
    };

    await act(async () => {
      await result.current.createSchedule(createData);
    });
  });

  it("should update schedule", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "update"], (data) => {
        expect(data).toMatchObject({
          id: "schedule-1",
          name: "Updated Schedule",
          hour: 14,
          minute: 30,
        });
        return { id: "schedule-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateData = {
      id: "schedule-1",
      name: "Updated Schedule",
      hour: 14,
      minute: 30,
    };

    await act(async () => {
      await result.current.updateSchedule(updateData);
    });
  });

  it("should delete schedule", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "delete"], ({ id }) => {
        expect(id).toBe("schedule-1");
        return { id: "schedule-1" };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteSchedule("schedule-1");
    });
  });

  it("should toggle schedule active state", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(["notificationSchedule", "toggleActive"], ({ id }) => {
        expect(id).toBe("schedule-1");
        return { id: "schedule-1", isActive: false };
      }),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleSchedule("schedule-1");
    });
  });

  it("should upsert template schedule", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(
        ["notificationSchedule", "upsertTemplate"],
        ({ tripId: t, templateKey }) => {
          expect(t).toBe("trip-123");
          expect(templateKey).toBe("daily_morning");
          return { id: "schedule-template" };
        },
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.upsertTemplateSchedule("daily_morning");
    });
  });

  it("should throw error when upserting template without tripId", async () => {
    server.use(createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })));

    const { result } = renderHookWithMSW(() => useAdminSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.upsertTemplateSchedule("daily_morning");
      }),
    ).rejects.toThrow("Trip is required to create template schedules");
  });

  it("should indicate loading states for mutations", async () => {
    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })),
      createORPCHandler(
        ["notificationSchedule", "create"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["notificationSchedule", "update"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["notificationSchedule", "delete"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["notificationSchedule", "toggleActive"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
      createORPCHandler(
        ["notificationSchedule", "upsertTemplate"],
        () =>
          new Promise(() => {
            /* no-op */
          }),
      ),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    result.current
      .createSchedule({
        tripId: "trip-123",
        name: "Test",
        notificationType: "custom",
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
        hour: 10,
        minute: 0,
        startDate: new Date(),
        endDate: new Date(),
      })
      .catch(() => {
        /* no-op */
      });
    result.current
      .updateSchedule({ id: "schedule-1", name: "Updated", hour: 14, minute: 30 })
      .catch(() => {
        /* no-op */
      });
    result.current.deleteSchedule("schedule-1").catch(() => {
      /* no-op */
    });
    result.current.toggleSchedule("schedule-1").catch(() => {
      /* no-op */
    });
    result.current.upsertTemplateSchedule("daily_morning").catch(() => {
      /* no-op */
    });

    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
      expect(result.current.isUpdating).toBe(true);
      expect(result.current.isDeleting).toBe(true);
      expect(result.current.isToggling).toBe(true);
      expect(result.current.isUpsertingTemplate).toBe(true);
    });
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

    server.use(
      createORPCHandler(["notificationSchedule", "getAll"], () => ({
        schedules: mockSchedules,
      })),
    );

    const { result } = renderHookWithMSW(() => useAdminSchedules(tripId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules[0]!.message).toBe("Custom Body");
    expect(result.current.schedules[1]!.message).toBe("Scheduled notification: SYSTEM");
  });

  it("should work without tripId", async () => {
    server.use(createORPCHandler(["notificationSchedule", "getAll"], () => ({ schedules: [] })));

    const { result } = renderHookWithMSW(() => useAdminSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
  });
});

describe("toTriggerTime", () => {
  it("should format single-digit hour and minute with leading zeros", () => {
    expect(toTriggerTime(9, 5)).toBe("09:05");
  });

  it("should format double-digit hour and minute", () => {
    expect(toTriggerTime(23, 59)).toBe("23:59");
  });

  it("should handle midnight", () => {
    expect(toTriggerTime(0, 0)).toBe("00:00");
  });

  it("should handle noon", () => {
    expect(toTriggerTime(12, 0)).toBe("12:00");
  });
});

describe("isScheduleRecurring", () => {
  it("should return true for multi-day schedule", () => {
    const startDate = "2024-01-01T00:00:00Z";
    const endDate = "2024-01-02T00:00:01Z";
    expect(isScheduleRecurring(startDate, endDate)).toBe(true);
  });

  it("should return false for same-day schedule", () => {
    const startDate = "2024-01-01T00:00:00Z";
    const endDate = "2024-01-01T23:59:59Z";
    expect(isScheduleRecurring(startDate, endDate)).toBe(false);
  });

  it("should return true for exact 24-hour schedule", () => {
    const startDate = "2024-01-01T00:00:00Z";
    const endDate = "2024-01-02T00:00:00Z";
    expect(isScheduleRecurring(startDate, endDate)).toBe(true);
  });

  it("should handle Date objects", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-03T00:00:00Z");
    expect(isScheduleRecurring(startDate, endDate)).toBe(true);
  });
});

describe("buildScheduleMessage", () => {
  it("should prefer notification body over title", () => {
    expect(buildScheduleMessage("Body", "Title", "TYPE")).toBe("Body");
  });

  it("should fall back to title when body is null", () => {
    expect(buildScheduleMessage(null, "Title", "TYPE")).toBe("Title");
  });

  it("should fall back to title when body is undefined", () => {
    expect(buildScheduleMessage(undefined, "Title", "TYPE")).toBe("Title");
  });

  it("should use default message when both are null", () => {
    expect(buildScheduleMessage(null, null, "REMINDER")).toBe("Scheduled notification: REMINDER");
  });

  it("should use default message when both are undefined", () => {
    expect(buildScheduleMessage(undefined, undefined, "ALERT")).toBe(
      "Scheduled notification: ALERT",
    );
  });

  it("should prefer body even when title is null", () => {
    expect(buildScheduleMessage("Body", null, "TYPE")).toBe("Body");
  });
});
