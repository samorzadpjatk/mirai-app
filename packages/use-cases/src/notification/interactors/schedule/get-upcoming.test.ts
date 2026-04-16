import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  getUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
  type GetUpcomingNotificationSchedulesOutput,
} from "./get-upcoming";
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
    shouldFailFindUpcoming?: boolean;
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

    findActive: () => Effect.succeed([]),

    findUpcoming: (days?: number) => {
      if (options.shouldFailFindUpcoming) {
        return Effect.fail(
          new DatabaseError({
            operation: "findUpcoming",
            message: "Database error",
          }),
        );
      }
      const now = new Date();
      const cutoffDate = days
        ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const upcomingSchedules = schedules.filter(
        (s) => s.isActive && s.startDate > now && s.startDate <= cutoffDate,
      );
      return Effect.succeed(upcomingSchedules);
    },

    getExecutionHistory: () => Effect.succeed([]),
  };
}

const createMockSchedule = (
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule => createMockScheduleDomainEntity(id, overrides);

describe("[UNIT] getUpcomingNotificationSchedulesUseCase", () => {
  it("should return empty array when no upcoming schedules", async () => {
    const mockGateway = createMockNotificationScheduleGateway([]);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {};

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(0);
  });

  it("should return upcoming schedules within default window", async () => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const futureEnd = new Date(futureStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const schedules = [
      createMockSchedule("upcoming-1", {
        startDate: futureStart,
        endDate: futureEnd,
        isActive: true,
      }),
      createMockSchedule("upcoming-2", {
        startDate: futureStart,
        endDate: futureEnd,
        isActive: true,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {};

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(2);
    expect(result[0].isUpcoming).toBe(true);
    expect(result[1].isUpcoming).toBe(true);
  });

  it("should respect custom days window", async () => {
    const now = new Date();
    const withinWindow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
    const outsideWindow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days
    const farFuture = new Date(
      withinWindow.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const schedules = [
      createMockSchedule("within-window", {
        startDate: withinWindow,
        endDate: farFuture,
        isActive: true,
      }),
      createMockSchedule("outside-window", {
        startDate: outsideWindow,
        endDate: new Date(outsideWindow.getTime() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {
      days: 7,
    };

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("within-window");
  });

  it("should filter out inactive schedules", async () => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = [
      createMockSchedule("active-upcoming", {
        startDate: futureStart,
        endDate: futureEnd,
        isActive: true,
      }),
      createMockSchedule("inactive-upcoming", {
        startDate: futureStart,
        endDate: futureEnd,
        isActive: false,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {};

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("active-upcoming");
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway([], {
      shouldFailFindUpcoming: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {};

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
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
    const futureStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = [
      createMockSchedule("morning-upcoming", {
        startDate: futureStart,
        endDate: futureEnd,
        isActive: true,
        hour: 7,
        minute: 0,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetUpcomingNotificationSchedulesInput = {};

    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(1);
    expect(result[0].formattedTime).toBe("07:00");
  });
});
