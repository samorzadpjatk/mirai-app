import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  bulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  BulkDeleteValidationError,
} from "./bulk-delete";
import { NotificationScheduleType } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    existingIds?: string[];
    shouldFailDelete?: boolean;
  } = {},
): NotificationScheduleGateway {
  const scheduleMap = new Map<string, boolean>();
  if (options.existingIds) {
    options.existingIds.forEach((id) => scheduleMap.set(id, true));
  } else {
    scheduleMap.set("schedule-1", true);
    scheduleMap.set("schedule-2", true);
    scheduleMap.set("schedule-3", true);
  }

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

    findById: () => Effect.succeed(null),

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    delete: () => Effect.succeed(void 0),

    deleteMany: (ids: string[]) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "deleteMany",
            message: "Database error",
          }),
        );
      }
      const existingIds = ids.filter((id) => scheduleMap.has(id));
      return Effect.succeed(existingIds.length);
    },

    exists: (id: string) => Effect.succeed(scheduleMap.has(id)),

    count: () => Effect.succeed(scheduleMap.size),

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: () => Effect.succeed(0),
  };
}

describe("[UNIT] bulkDeleteNotificationSchedulesUseCase", () => {
  it("should delete multiple schedules successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingIds: ["schedule-1", "schedule-2", "schedule-3"],
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: ["schedule-1", "schedule-2", "schedule-3"],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(3);
    expect(result.requestedCount).toBe(3);
    expect(result.notFoundIds).toBeUndefined();
  });

  it("should handle partial deletion with some non-existent IDs", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingIds: ["schedule-1", "schedule-2"],
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: ["schedule-1", "schedule-2", "nonexistent-1", "nonexistent-2"],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(2);
    expect(result.requestedCount).toBe(4);
    expect(result.notFoundIds).toContain("nonexistent-1");
    expect(result.notFoundIds).toContain("nonexistent-2");
  });

  it("should fail with BulkDeleteValidationError when no IDs provided", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: [],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(BulkDeleteValidationError);
      expect(either.left.message).toBe("At least one ID must be provided");
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

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: ["schedule-1", "schedule-2"],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should delete single schedule successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingIds: ["single-schedule"],
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: ["single-schedule"],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(1);
    expect(result.requestedCount).toBe(1);
  });

  it("should report all IDs as not found when none exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      existingIds: [],
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: BulkDeleteNotificationSchedulesInput = {
      ids: ["nonexistent-1", "nonexistent-2", "nonexistent-3"],
    };

    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(0);
    expect(result.requestedCount).toBe(3);
    expect(result.notFoundIds).toHaveLength(3);
    expect(result.notFoundIds).toContain("nonexistent-1");
    expect(result.notFoundIds).toContain("nonexistent-2");
    expect(result.notFoundIds).toContain("nonexistent-3");
  });
});
