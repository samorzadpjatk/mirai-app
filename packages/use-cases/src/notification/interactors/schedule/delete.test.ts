import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  deleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  DeleteScheduleNotFoundError,
} from "./delete";
import { NotificationScheduleType } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    shouldFailDelete?: boolean;
    existingSchedule?: NotificationScheduleDTO | null;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule: NotificationScheduleDTO = {
    id: "schedule-123",
    name: "Test Schedule",
    tripId: null,
    notificationType: NotificationScheduleType.INFO,
    notificationTitle: null,
    notificationBody: null,
    notificationUrl: null,
    startDate: new Date("2025-01-01T10:00:00Z"),
    endDate: new Date("2025-01-07T10:00:00Z"),
    hour: 10,
    minute: 0,
    isActive: true,
    createdById: "admin-123",
    lastRun: null,
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  };

  return {
    create: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    findById: (id: string) => {
      if (options.existingSchedule) {
        return Effect.succeed(options.existingSchedule);
      }
      if (id === "schedule-123") {
        return Effect.succeed(baseSchedule);
      }
      return Effect.succeed(null);
    },

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(void 0);
    },

    deleteMany: () => Effect.succeed(0),

    exists: () => Effect.succeed(false),

    count: () => Effect.succeed(0),

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: (scheduleId: string) => {
      return Effect.succeed(scheduleId === "schedule-123" ? 5 : 0);
    },
  };
}

describe("[UNIT] deleteNotificationScheduleUseCase", () => {
  it("should delete a schedule successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: DeleteNotificationScheduleInput = {
      id: "schedule-123",
    };

    const program = deleteNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Test Schedule");
    expect(result.message).toContain("5 execution records");
    expect(result.deletedExecutionCount).toBe(5);
  });

  it("should fail with DeleteScheduleNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: null,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: DeleteNotificationScheduleInput = {
      id: "nonexistent-123",
    };

    const program = deleteNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteScheduleNotFoundError);
      expect(either.left.id).toBe("nonexistent-123");
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: DeleteNotificationScheduleInput = {
      id: "schedule-123",
    };

    const program = deleteNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should include execution count in success message", async () => {
    const customSchedule: NotificationScheduleDTO = {
      id: "custom-456",
      name: "Custom Schedule",
      tripId: "trip-123",
      notificationType: NotificationScheduleType.DAILY_RANKING,
      notificationTitle: "Daily Update",
      notificationBody: "Check your ranking!",
      notificationUrl: null,
      startDate: new Date("2025-01-01T09:00:00Z"),
      endDate: new Date("2025-01-31T09:00:00Z"),
      hour: 9,
      minute: 0,
      isActive: true,
      createdById: "admin-456",
      lastRun: new Date("2025-01-15"),
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-15"),
    };

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule: customSchedule,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: DeleteNotificationScheduleInput = {
      id: "custom-456",
    };

    const program = deleteNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Custom Schedule");
    expect(result.deletedExecutionCount).toBe(0); // Because the gateway counts by ID
  });
});
