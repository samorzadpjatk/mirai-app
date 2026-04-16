import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  bulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  BulkToggleValidationError,
} from "./bulk-toggle-active";
import { NotificationScheduleType } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    shouldFailToggle?: boolean;
  } = {},
): NotificationScheduleGateway {
  const baseSchedule: NotificationScheduleDTO = {
    id: "schedule-1",
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

    findById: () => Effect.succeed(baseSchedule),

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    delete: () => Effect.succeed(void 0),

    deleteMany: () => Effect.succeed(0),

    exists: () => Effect.succeed(false),

    count: () => Effect.succeed(0),

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: (ids: string[], isActive: boolean) => {
      if (options.shouldFailToggle) {
        return Effect.fail(
          new DatabaseError({
            operation: "bulkToggleActive",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(ids.length);
    },

    countExecutions: () => Effect.succeed(0),
  };
}

describe("[UNIT] bulkToggleNotificationScheduleActiveUseCase", () => {
  it("should activate multiple schedules", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkToggleNotificationScheduleActiveInput = {
      ids: ["schedule-1", "schedule-2", "schedule-3"],
      isActive: true,
    };

    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(3);
  });

  it("should deactivate multiple schedules", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkToggleNotificationScheduleActiveInput = {
      ids: ["schedule-1", "schedule-2"],
      isActive: false,
    };

    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
  });

  it("should fail with BulkToggleValidationError when no IDs provided", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkToggleNotificationScheduleActiveInput = {
      ids: [],
      isActive: true,
    };

    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(BulkToggleValidationError);
      expect(either.left.message).toBe("At least one ID must be provided");
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

    const input: BulkToggleNotificationScheduleActiveInput = {
      ids: ["schedule-1", "schedule-2"],
      isActive: true,
    };

    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should toggle single schedule", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkToggleNotificationScheduleActiveInput = {
      ids: ["schedule-1"],
      isActive: false,
    };

    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
  });
});
