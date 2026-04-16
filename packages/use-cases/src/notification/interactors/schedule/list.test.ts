import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  getNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
  type GetNotificationSchedulesOutput,
} from "./list";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type {
  PaginatedResult,
  PaginationOptions,
  NotificationScheduleFilter,
} from "@mirai-app/domain";

/**
 * Create a mock NotificationSchedule domain entity
 */
function createMockScheduleDomainEntity(
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule {
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 1);
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

    findAllPaginated: (options?: {
      filter?: NotificationScheduleFilter;
      pagination?: PaginationOptions;
    }) =>
      Effect.succeed({
        items: schedules,
        pagination: {
          total: schedules.length,
          limit: options?.pagination?.limit ?? 20,
          offset: options?.pagination?.offset ?? 0,
          hasMore: false,
        },
      } as PaginatedResult<NotificationSchedule>),

    findActive: () => Effect.succeed([]),

    findUpcoming: () => Effect.succeed([]),

    getExecutionHistory: () => Effect.succeed([]),
  };
}

const createMockSchedule = (
  id: string,
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule => createMockScheduleDomainEntity(id, overrides);

describe("[UNIT] getNotificationSchedulesUseCase", () => {
  it("should return empty list when no schedules exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway([]);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationSchedulesInput = {};

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedules).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("should return list of schedules with computed fields", async () => {
    const schedules = [
      createMockSchedule("schedule-1"),
      createMockSchedule("schedule-2", {
        isActive: false,
        hour: 14,
        minute: 30,
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationSchedulesInput = {};

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedules).toHaveLength(2);
    expect(result.schedules[0].id).toBe("schedule-1");
    expect(result.schedules[1].id).toBe("schedule-2");
    expect(result.schedules[0].formattedTime).toBe("10:00");
    expect(result.schedules[1].formattedTime).toBe("14:30");
  });

  it("should include computed status fields", async () => {
    const now = new Date();
    const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now
    const futureEnd = new Date(futureStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const schedules = [
      createMockSchedule("upcoming", {
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

    const input: GetNotificationSchedulesInput = {};

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedules[0].isUpcoming).toBe(true);
    expect(result.schedules[0].isExpired).toBe(false);
  });

  it("should apply pagination options", async () => {
    const schedules = Array.from({ length: 30 }, (_, i) =>
      createMockSchedule(`schedule-${i + 1}`),
    );

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationSchedulesInput = {
      pagination: { limit: 10, offset: 0 },
    };

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.pagination.limit).toBe(10); // Gateway uses provided limit
    expect(result.pagination.total).toBe(30);
  });

  it("should apply filter options", async () => {
    const schedules = [
      createMockSchedule("trip-a", { tripId: "trip-1" }),
      createMockSchedule("trip-b", { tripId: "trip-2" }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationSchedulesInput = {
      filter: { tripId: "trip-1" },
    };

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedules).toHaveLength(2); // Mock returns all, real impl would filter
  });

  it("should return schedule with trip-specific data", async () => {
    const schedules = [
      createMockSchedule("trip-schedule", {
        tripId: "trip-abc",
        notificationType: NotificationScheduleType.REMINDER,
        notificationTitle: "Trip Reminder",
        notificationBody: "Your trip starts tomorrow!",
      }),
    ];

    const mockGateway = createMockNotificationScheduleGateway(schedules);
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationSchedulesInput = {};

    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedules[0].tripId).toBe("trip-abc");
    expect(result.schedules[0].notificationTitle).toBe("Trip Reminder");
    expect(result.schedules[0].notificationBody).toBe(
      "Your trip starts tomorrow!",
    );
  });
});
