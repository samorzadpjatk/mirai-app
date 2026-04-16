import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  updateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  UpdateScheduleNotFoundError,
  UpdateScheduleValidationError,
} from "./update";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Create a mock NotificationSchedule domain entity
 */
function createMockScheduleDomainEntity(
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule {
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 2);
  const futureEnd = new Date(futureStart);
  futureEnd.setDate(futureEnd.getDate() + 7);

  const startDate = overrides.startDate ?? futureStart;
  const endDate = overrides.endDate ?? futureEnd;
  const hour = overrides.hour ?? 10;
  const minute = overrides.minute ?? 0;
  const isActive = overrides.isActive ?? true;
  const name = overrides.name ?? `Schedule ${id}`;

  const entity: NotificationSchedule = {
    id,
    name,
    tripId: overrides.tripId ?? null,
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.REMINDER,
    notificationTitle: overrides.notificationTitle ?? "Original Title",
    notificationBody: overrides.notificationBody ?? "Original Body",
    notificationUrl: overrides.notificationUrl ?? null,
    startDate,
    endDate,
    hour,
    minute,
    isActive,
    createdById: overrides.createdById ?? "admin-123",
    lastRun: overrides.lastRun ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-12-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-12-01"),
    isCurrentlyActive: (now = new Date()) => {
      if (!isActive) return false;
      return now >= startDate && now <= endDate;
    },
    isExpired: (now = new Date()) => now > endDate,
    isUpcoming: (now = new Date()) => now < startDate,
    shouldRunAt: (date: Date) => {
      return date.getUTCHours() === hour && date.getUTCMinutes() === minute;
    },
    getNextRunTime: () => null,
    getDurationMs: () => endDate.getTime() - startDate.getTime(),
    getDurationDays: () =>
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      ),
    isDailyRanking: () =>
      overrides.notificationType === NotificationScheduleType.DAILY_RANKING,
    isTripSpecific: () => (overrides.tripId ?? null) !== null,
    hasContent: () =>
      (overrides.notificationTitle ?? null) !== null &&
      (overrides.notificationBody ?? null) !== null,
    hasUrl: () => (overrides.notificationUrl ?? null) !== null,
    getFormattedTime: () => {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      return `${h}:${m}`;
    },
    getSummary: () =>
      `${name} (${overrides.notificationType ?? NotificationScheduleType.REMINDER}) at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} - ${isActive ? "active" : "inactive"}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !isActive,
      });
    },
    updateLastRun: (lr: Date) =>
      createMockScheduleDomainEntity(id, { ...overrides, lastRun: lr }),
    duplicate: (params) =>
      Effect.succeed(
        createMockScheduleDomainEntity("new-id", {
          ...overrides,
          name: params.name ?? `${name} (Copy)`,
          createdById: params.newCreatedById,
        }),
      ),
    update: (props) => {
      // Handle validation for name
      if (props.name !== undefined) {
        if (props.name.trim() === "") {
          return Effect.fail(new (class ValidationError extends Error {})());
        }
      }
      return Effect.succeed(
        createMockScheduleDomainEntity(id, { ...overrides, ...props }),
      );
    },
  } as NotificationSchedule;

  return entity;
}

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    shouldFailUpdate?: boolean;
    existingSchedule?: NotificationSchedule | null;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule = createMockScheduleDomainEntity("schedule-123");

  return {
    create: (schedule) => Effect.succeed(schedule),

    findById: (id: string) => {
      if (options.existingSchedule !== undefined) {
        return Effect.succeed(options.existingSchedule);
      }
      if (id === "schedule-123") {
        return Effect.succeed(baseSchedule);
      }
      return Effect.succeed(null);
    },

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(schedule);
    },

    delete: () => Effect.succeed(void 0),

    deleteMany: () => Effect.succeed(0),

    exists: () => Effect.succeed(false),

    count: () => Effect.succeed(0),

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: () => Effect.succeed(0),

    findAllPaginated: () =>
      Effect.succeed({
        items: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      }),

    findActive: () => Effect.succeed([]),

    findUpcoming: () => Effect.succeed([]),

    getExecutionHistory: () => Effect.succeed([]),
  };
}

describe("[UNIT] updateNotificationScheduleUseCase", () => {
  it("should update schedule name successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      name: "Updated Schedule Name",
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Updated Schedule Name");
    expect(result.id).toBe("schedule-123");
  });

  it("should update notification content successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      notificationTitle: "New Title",
      notificationBody: "New Body Content",
      notificationUrl: "https://example.com/new",
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.notificationTitle).toBe("New Title");
    expect(result.notificationBody).toBe("New Body Content");
    expect(result.notificationUrl).toBe("https://example.com/new");
  });

  it("should update time settings successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 3);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      hour: 15,
      minute: 30,
      startDate: futureStart,
      endDate: futureEnd,
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.hour).toBe(15);
    expect(result.minute).toBe(30);
    expect(result.formattedTime).toBe("15:30");
  });

  it("should update isActive status", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      isActive: false,
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(false);
  });

  it("should fail with UpdateScheduleNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "nonexistent-123",
      name: "New Name",
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateScheduleNotFoundError);
    }
  });

  it("should fail with UpdateScheduleValidationError for empty name", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      name: "",
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateScheduleValidationError);
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      name: "New Name",
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should allow partial updates", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleInput = {
      id: "schedule-123",
      // Only update hour, leave everything else unchanged
      hour: 20,
    };

    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.hour).toBe(20);
    // Other fields should remain unchanged from base schedule
    expect(result.name).toBe("Schedule schedule-123");
    expect(result.minute).toBe(0);
    expect(result.isActive).toBe(true);
  });
});
