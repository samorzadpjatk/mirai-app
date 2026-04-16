import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  getNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  GetScheduleNotFoundError,
} from "./get-by-id";
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
  futureStart.setDate(futureStart.getDate() + 1);
  const futureEnd = new Date(futureStart);
  futureEnd.setDate(futureEnd.getDate() + 7);

  // Use a simple object that mimics NotificationSchedule structure
  return {
    id: id,
    name: overrides.name ?? `Schedule ${id}`,
    tripId: overrides.tripId ?? null,
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.INFO,
    notificationTitle: overrides.notificationTitle ?? null,
    notificationBody: overrides.notificationBody ?? null,
    notificationUrl: overrides.notificationUrl ?? null,
    startDate: overrides.startDate ?? futureStart,
    endDate: overrides.endDate ?? futureEnd,
    hour: overrides.hour ?? 10,
    minute: overrides.minute ?? 0,
    isActive: overrides.isActive ?? true,
    createdById: overrides.createdById ?? "admin-123",
    lastRun: overrides.lastRun ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-12-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-12-01"),
    isCurrentlyActive: (now = new Date()) => {
      const schedule = createMockScheduleDomainEntity(id, overrides);
      if (!schedule.isActive) return false;
      return now >= schedule.startDate && now <= schedule.endDate;
    },
    isExpired: (now = new Date()) => now > (overrides.endDate ?? futureEnd),
    isUpcoming: (now = new Date()) =>
      now < (overrides.startDate ?? futureStart),
    shouldRunAt: (date: Date) => {
      return (
        date.getUTCHours() === (overrides.hour ?? 10) &&
        date.getUTCMinutes() === (overrides.minute ?? 0)
      );
    },
    getNextRunTime: () => null,
    getDurationMs: () => 7 * 24 * 60 * 60 * 1000,
    getDurationDays: () => 7,
    isDailyRanking: () => false,
    isTripSpecific: () => (overrides.tripId ?? null) !== null,
    hasContent: () => false,
    hasUrl: () => false,
    getFormattedTime: () => {
      const h = String(overrides.hour ?? 10).padStart(2, "0");
      const m = String(overrides.minute ?? 0).padStart(2, "0");
      return `${h}:${m}`;
    },
    getSummary: () => `Schedule ${id}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !this.isActive,
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
  options: {
    existingSchedule?: NotificationSchedule | null;
    shouldFailFind?: boolean;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule = createMockScheduleDomainEntity("schedule-123");

  return {
    create: (schedule) => Effect.succeed(schedule),

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
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

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: () => Effect.succeed(0),
  };
}

describe("[UNIT] getNotificationScheduleByIdUseCase", () => {
  it("should return schedule by ID successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleByIdInput = {
      id: "schedule-123",
    };

    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("schedule-123");
    expect(result.name).toBe("Schedule schedule-123");
    expect(result.hour).toBe(10);
    expect(result.minute).toBe(0);
    expect(result.formattedTime).toBe("10:00");
  });

  it("should fail with GetScheduleNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleByIdInput = {
      id: "nonexistent-123",
    };

    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetScheduleNotFoundError);
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleByIdInput = {
      id: "schedule-123",
    };

    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return schedule with computed status fields", async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 1);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const customSchedule = createMockScheduleDomainEntity("future-schedule", {
      name: "Future Schedule",
      tripId: "trip-123",
      notificationType: NotificationScheduleType.REMINDER,
      notificationTitle: "Reminder Title",
      notificationBody: "Reminder Body",
      notificationUrl: "https://example.com",
      startDate: futureStart,
      endDate: futureEnd,
      hour: 15,
      minute: 30,
      isActive: true,
      createdById: "admin-456",
      lastRun: null,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-01"),
    });

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: customSchedule,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleByIdInput = {
      id: "future-schedule",
    };

    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("future-schedule");
    expect(result.name).toBe("Future Schedule");
    expect(result.isUpcoming).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.formattedTime).toBe("15:30");
    expect(result.tripId).toBe("trip-123");
  });

  it("should return expired schedule with correct status", async () => {
    const pastStart = new Date("2024-01-01T10:00:00Z");
    const pastEnd = new Date("2024-01-07T10:00:00Z");

    const expiredSchedule = createMockScheduleDomainEntity("expired-schedule", {
      name: "Expired Schedule",
      tripId: null,
      notificationType: NotificationScheduleType.INFO,
      notificationTitle: null,
      notificationBody: null,
      notificationUrl: null,
      startDate: pastStart,
      endDate: pastEnd,
      hour: 10,
      minute: 0,
      isActive: false,
      createdById: "admin-123",
      lastRun: pastStart,
      createdAt: new Date("2023-12-01"),
      updatedAt: new Date("2024-01-01"),
    });

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: expiredSchedule,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleByIdInput = {
      id: "expired-schedule",
    };

    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("expired-schedule");
    expect(result.isExpired).toBe(true);
    expect(result.isUpcoming).toBe(false);
    expect(result.lastRun).toEqual(pastStart);
  });
});
