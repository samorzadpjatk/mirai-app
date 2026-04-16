import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  toggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
  ToggleScheduleNotFoundError,
} from "./toggle-active";
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
    getSummary: () =>
      `${name} (${overrides.notificationType ?? NotificationScheduleType.INFO}) at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} - ${isActive ? "active" : "inactive"}`,
    toggleActive: function () {
      return createMockScheduleDomainEntity(id, {
        ...overrides,
        isActive: !isActive,
        updatedAt: new Date(),
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
    toggledIsActive?: boolean;
    shouldFailToggle?: boolean;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule = createMockScheduleDomainEntity("schedule-123", {
    isActive: options.toggledIsActive ?? false,
  });

  return {
    create: (schedule) => Effect.succeed(schedule),

    findById: (id: string) => {
      if (options.existingSchedule !== undefined) {
        return Effect.succeed(options.existingSchedule);
      }
      if (id === "schedule-123") {
        return Effect.succeed(createMockScheduleDomainEntity("schedule-123"));
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

    toggleActive: (id: string) => {
      if (options.shouldFailToggle) {
        return Effect.fail(
          new DatabaseError({
            operation: "toggleActive",
            message: "Database error",
          }),
        );
      }
      // Return schedule with toggled active status
      return Effect.succeed(
        createMockScheduleDomainEntity(id, {
          isActive: options.toggledIsActive ?? false,
          updatedAt: new Date(),
        }),
      );
    },

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

describe("[UNIT] toggleNotificationScheduleActiveUseCase", () => {
  it("should toggle active schedule to inactive", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      toggledIsActive: false,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: ToggleNotificationScheduleActiveInput = {
      id: "schedule-123",
    };

    const program = toggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(false);
    expect(result.id).toBe("schedule-123");
  });

  it("should toggle inactive schedule to active", async () => {
    const inactiveSchedule = createMockScheduleDomainEntity(
      "inactive-schedule",
      {
        name: "Inactive Schedule",
        isActive: false,
      },
    );

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: inactiveSchedule,
      toggledIsActive: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: ToggleNotificationScheduleActiveInput = {
      id: "inactive-schedule",
    };

    const program = toggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(true);
    expect(result.id).toBe("inactive-schedule");
  });

  it("should fail with ToggleScheduleNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: ToggleNotificationScheduleActiveInput = {
      id: "nonexistent-123",
    };

    const program = toggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ToggleScheduleNotFoundError);
      if (either.left instanceof ToggleScheduleNotFoundError) {
        expect(either.left.id).toBe("nonexistent-123");
      }
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailToggle: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: ToggleNotificationScheduleActiveInput = {
      id: "schedule-123",
    };

    const program = toggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return schedule with updated timestamp", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      toggledIsActive: false,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: ToggleNotificationScheduleActiveInput = {
      id: "schedule-123",
    };

    const program = toggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt.getTime()).toBeGreaterThan(
      new Date("2024-12-01").getTime(),
    );
  });
});
