import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  DuplicateScheduleNotFoundError,
  DuplicateScheduleError,
} from "./duplicate";
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
    tripId: overrides.tripId ?? "trip-123",
    notificationType:
      overrides.notificationType ?? NotificationScheduleType.REMINDER,
    notificationTitle: overrides.notificationTitle ?? "Original Title",
    notificationBody: overrides.notificationBody ?? "Original Body",
    notificationUrl:
      overrides.notificationUrl ?? "https://example.com/original",
    startDate,
    endDate,
    hour,
    minute,
    isActive,
    createdById: overrides.createdById ?? "admin-123",
    lastRun: overrides.lastRun ?? new Date("2025-01-05"),
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
    hasUrl: () =>
      (overrides.notificationUrl ?? null) !== null &&
      (overrides.notificationUrl ?? "") !== "",
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
    duplicate: function (params) {
      const newStartDate = params.startDate ?? startDate;
      const durationMs = endDate.getTime() - startDate.getTime();
      const newEndDate =
        params.endDate ?? new Date(newStartDate.getTime() + durationMs);

      return Effect.succeed(
        createMockScheduleDomainEntity("duplicated-456", {
          ...overrides,
          name: params.name ?? `${name} (Copy)`,
          startDate: newStartDate,
          endDate: newEndDate,
          isActive: false, // Duplicates are inactive by default
          createdById: params.newCreatedById,
          lastRun: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
    },
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
    shouldFailCreate?: boolean;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule = createMockScheduleDomainEntity("original-123");

  return {
    create: (schedule) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(schedule);
    },

    findById: (id: string) => {
      if (options.existingSchedule !== undefined) {
        return Effect.succeed(options.existingSchedule);
      }
      if (id === "original-123") {
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

describe("[UNIT] duplicateNotificationScheduleUseCase", () => {
  it("should duplicate a schedule with default name", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: DuplicateNotificationScheduleInput = {
      id: "original-123",
      startDate: futureStart,
      endDate: futureEnd,
      newCreatedById: "admin-456",
    };

    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedule.name).toBe("Schedule original-123 (Copy)");
    expect(result.schedule.tripId).toBe("trip-123");
    expect(result.schedule.notificationType).toBe(
      NotificationScheduleType.REMINDER,
    );
    expect(result.schedule.isActive).toBe(false); // Duplicates are inactive by default
    expect(result.schedule.createdById).toBe("admin-456");
  });

  it("should duplicate with custom name", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: DuplicateNotificationScheduleInput = {
      id: "original-123",
      name: "Custom Duplicate Name",
      startDate: futureStart,
      endDate: futureEnd,
      newCreatedById: "admin-456",
    };

    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedule.name).toBe("Custom Duplicate Name");
  });

  it("should fail with DuplicateScheduleNotFoundError when original does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: DuplicateNotificationScheduleInput = {
      id: "nonexistent-123",
      startDate: futureStart,
      endDate: futureEnd,
      newCreatedById: "admin-456",
    };

    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DuplicateScheduleNotFoundError);
      if (either.left instanceof DuplicateScheduleNotFoundError) {
        expect(either.left.id).toBe("nonexistent-123");
      }
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: DuplicateNotificationScheduleInput = {
      id: "original-123",
      startDate: futureStart,
      endDate: futureEnd,
      newCreatedById: "admin-456",
    };

    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should preserve notification content from original", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 2);
    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 7);

    const input: DuplicateNotificationScheduleInput = {
      id: "original-123",
      startDate: futureStart,
      endDate: futureEnd,
      newCreatedById: "admin-456",
    };

    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.schedule.notificationTitle).toBe("Original Title");
    expect(result.schedule.notificationBody).toBe("Original Body");
    expect(result.schedule.notificationUrl).toBe(
      "https://example.com/original",
    );
    expect(result.schedule.hour).toBe(10);
    expect(result.schedule.minute).toBe(0);
  });
});
