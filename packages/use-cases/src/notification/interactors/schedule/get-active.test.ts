import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  getActiveNotificationSchedulesUseCase,
  type GetActiveNotificationSchedulesOutput,
} from "./get-active";
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
  futureStart.setDate(futureStart.getDate() - 1); // Past
  const futureEnd = new Date(futureStart);
  futureEnd.setFullYear(futureEnd.getFullYear() + 1); // Far future

  const startDate = overrides.startDate ?? futureStart;
  const endDate = overrides.endDate ?? futureEnd;
  const hour = overrides.hour ?? 10;
  const minute = overrides.minute ?? 0;
  const isActive = overrides.isActive ?? true;

  return {
    id,
    name: overrides.name ?? `Schedule ${id}`,
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
    hasContent: () => false,
    hasUrl: () => false,
    getFormattedTime: () => {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      return `${h}:${m}`;
    },
    getSummary: () => `Schedule ${id}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !isActive,
      });
    },
    updateLastRun: (lastRun: Date) =>
      createMockScheduleDomainEntity(id, { ...overrides, lastRun }),
    duplicate: () =>
      Effect.succeed(createMockScheduleDomainEntity("new-id", overrides)),
    update: () => Effect.succeed(createMockScheduleDomainEntity(id, overrides)),
  } as NotificationSchedule;
}

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  schedules: NotificationSchedule[] = [],
  options: {
    shouldFailFindActive?: boolean;
  } = {},
): NotificationScheduleGateway {
  return {
    create: (schedule) => Effect.succeed(schedule),

    findById: () => Effect.succeed(null),

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule) => Effect.succeed(schedule),

    delete: () => Effect.succeed(void 0),

    deleteMany: () => Effect.succeed(0),

    exists: () => Effect.succeed(false),

    count: () => Effect.succeed(schedules.length),

    updateLastRun: () =>
      Effect.succeed(schedules[0] || (null as unknown as NotificationSchedule)),

    toggleActive: () =>
      Effect.succeed(schedules[0] || (null as unknown as NotificationSchedule)),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: () => Effect.succeed(0),

    findAllPaginated: () =>
      Effect.succeed({
        items: schedules,
        pagination: {
          total: schedules.length,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      }),

    findActive: () => {
      if (options.shouldFailFindActive) {
        return Effect.fail(
          new DatabaseError({
            operation: "findActive",
            message: "Database error",
          }),
        );
      }
      const now = new Date();
      const activeSchedules = schedules.filter(
        (s) => s.isActive && s.startDate <= now && s.endDate >= now,
      );
      return Effect.succeed(activeSchedules);
    },

    findUpcoming: () => Effect.succeed([]),

    getExecutionHistory: () => Effect.succeed([]),
  };
}

const createMockSchedule = (
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule => createMockScheduleDomainEntity(id, overrides);

describe("[UNIT] getActiveNotificationSchedulesUseCase", () => {
  it("should return empty array when no active schedules", async () => {
    const mockGateway = createMockNotificationScheduleGateway([]);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(0);
  });

  it("should return currently active schedules", async () => {
    const now = new Date();
    const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const schedules = [
      createMockSchedule("active-1", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: true,
      }),
      createMockSchedule("active-2", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: true,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("active-1");
    expect(result[1].id).toBe("active-2");
    expect(result[0].isCurrentlyActive).toBe(true);
  });

  it("should filter out inactive schedules", async () => {
    const now = new Date();
    const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = [
      createMockSchedule("active", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: true,
      }),
      createMockSchedule("inactive", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: false,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("active");
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway([], {
      shouldFailFindActive: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return schedules with formatted time", async () => {
    const now = new Date();
    const pastStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = [
      createMockSchedule("morning", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: true,
        hour: 8,
        minute: 30,
      }),
      createMockSchedule("evening", {
        startDate: pastStart,
        endDate: futureEnd,
        isActive: true,
        hour: 18,
        minute: 0,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(2);
    expect(result[0].formattedTime).toBe("08:30");
    expect(result[1].formattedTime).toBe("18:00");
  });
});
