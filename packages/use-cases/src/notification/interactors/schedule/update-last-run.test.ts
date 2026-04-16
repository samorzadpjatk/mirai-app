import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  updateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  UpdateLastRunNotFoundError,
} from "./update-last-run";
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
  const lastRun = overrides.lastRun ?? null;

  const entity: NotificationSchedule = {
    id,
    name,
    tripId: overrides.tripId ?? null,
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.INFO,
    notificationTitle: overrides.notificationTitle ?? null,
    notificationBody: overrides.notificationBody ?? null,
    notificationUrl: overrides.notificationUrl ?? null,
    startDate,
    endDate,
    hour,
    minute,
    isActive,
    createdById: overrides.createdById ?? "admin-123",
    lastRun,
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
    hasContent: () => false,
    hasUrl: () => false,
    getFormattedTime: () => {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      return `${h}:${m}`;
    },
    getSummary: () =>
      `${name} (${overrides.notificationType ?? NotificationScheduleType.INFO}) at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} - ${isActive ? "active" : "inactive"}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !isActive,
      });
    },
    updateLastRun: function (lr: Date) {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        lastRun: lr,
        updatedAt: new Date(),
      });
    },
    duplicate: (params) =>
      Effect.succeed(
        createMockScheduleDomainEntity("new-id", {
          ...overrides,
          name: params.name ?? `${name} (Copy)`,
          createdById: params.newCreatedById,
        }),
      ),
    update: (props) =>
      Effect.succeed(
        createMockScheduleDomainEntity(id, { ...overrides, ...props }),
      ),
  } as NotificationSchedule;

  return entity;
}

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    existingSchedule?: NotificationSchedule | null;
    shouldFailUpdate?: boolean;
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

    update: (schedule) => Effect.succeed(schedule),

    delete: () => Effect.succeed(void 0),

    deleteMany: () => Effect.succeed(0),

    exists: () => Effect.succeed(false),

    count: () => Effect.succeed(0),

    updateLastRun: (id: string, lr: Date) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "updateLastRun",
            message: "Database error",
          }),
        );
      }
      // Return schedule with updated lastRun
      return Effect.succeed(
        createMockScheduleDomainEntity(id, {
          lastRun: lr,
          updatedAt: new Date(),
        }),
      );
    },

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

describe("[UNIT] updateNotificationScheduleLastRunUseCase", () => {
  it("should update last run timestamp successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const lastRunTime = new Date("2025-01-15T10:30:00Z");

    const input: UpdateNotificationScheduleLastRunInput = {
      id: "schedule-123",
      lastRun: lastRunTime,
    };

    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("schedule-123");
    expect(result.lastRun).toEqual(lastRunTime);
  });

  it("should fail with UpdateLastRunNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: UpdateNotificationScheduleLastRunInput = {
      id: "nonexistent-123",
      lastRun: new Date(),
    };

    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateLastRunNotFoundError);
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

    const input: UpdateNotificationScheduleLastRunInput = {
      id: "schedule-123",
      lastRun: new Date(),
    };

    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return schedule with updated timestamp", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const lastRunTime = new Date("2025-01-20T14:00:00Z");

    const input: UpdateNotificationScheduleLastRunInput = {
      id: "schedule-123",
      lastRun: lastRunTime,
    };

    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.lastRun).toEqual(lastRunTime);
  });

  it("should update last run to current time", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const now = new Date();

    const input: UpdateNotificationScheduleLastRunInput = {
      id: "schedule-123",
      lastRun: now,
    };

    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.lastRun).toEqual(now);
  });
});
