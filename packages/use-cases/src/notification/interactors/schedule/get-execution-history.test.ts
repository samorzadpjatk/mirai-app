import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type {
  NotificationScheduleGateway,
  NotificationScheduleExecutionRecord,
} from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  ScheduleNotFoundError,
} from "./get-execution-history";
import { NotificationScheduleType } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    exists?: boolean;
    executionHistory?: NotificationScheduleExecutionRecord[];
    shouldFailExists?: boolean;
    shouldFailGetHistory?: boolean;
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
    lastRun: new Date("2025-01-05"),
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  };

  const defaultHistory: NotificationScheduleExecutionRecord[] = [
    {
      id: "exec-1",
      executedAt: new Date("2025-01-05T10:00:00Z"),
      notification: {
        id: "notif-1",
        title: "Daily Update",
        body: "Here is your daily update",
        createdAt: new Date("2025-01-05T10:00:00Z"),
      },
    },
    {
      id: "exec-2",
      executedAt: new Date("2025-01-04T10:00:00Z"),
      notification: {
        id: "notif-2",
        title: "Daily Update",
        body: "Here is your daily update",
        createdAt: new Date("2025-01-04T10:00:00Z"),
      },
    },
  ];

  return {
    create: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    findById: () => Effect.succeed(baseSchedule),

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: () => Effect.succeed(null),

    update: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

    delete: () => Effect.succeed(void 0),

    deleteMany: () => Effect.succeed(0),

    exists: (id: string) => {
      if (options.shouldFailExists) {
        return Effect.fail(
          new DatabaseError({
            operation: "exists",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(options.exists ?? id === "schedule-123");
    },

    count: () => Effect.succeed(0),

    updateLastRun: () => Effect.succeed(baseSchedule),

    toggleActive: () => Effect.succeed(baseSchedule),

    bulkToggleActive: () => Effect.succeed(0),

    countExecutions: () => Effect.succeed(2),

    getExecutionHistory: (scheduleId: string, limit: number) => {
      if (options.shouldFailGetHistory) {
        return Effect.fail(
          new DatabaseError({
            operation: "getExecutionHistory",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(
        (options.executionHistory || defaultHistory).slice(0, limit),
      );
    },
  };
}

describe("[UNIT] getNotificationScheduleExecutionHistoryUseCase", () => {
  it("should return execution history successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({ exists: true });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.executions).toHaveLength(2);
    expect(result.executions[0].id).toBe("exec-1");
    expect(result.executions[1].id).toBe("exec-2");
    expect(result.executions[0].notification?.title).toBe("Daily Update");
  });

  it("should fail with ScheduleNotFoundError when schedule does not exist", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      exists: false,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "nonexistent-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ScheduleNotFoundError);
      expect(either.left.scheduleId).toBe("nonexistent-123");
    }
  });

  it("should handle database errors when checking existence", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailExists: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors when getting history", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      exists: true,
      shouldFailGetHistory: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should respect limit parameter", async () => {
    const history: NotificationScheduleExecutionRecord[] = Array.from(
      { length: 10 },
      (_, i) => ({
        id: `exec-${i + 1}`,
        executedAt: new Date(
          `2025-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
        ),
        notification: {
          id: `notif-${i + 1}`,
          title: `Update ${i + 1}`,
          body: `Body ${i + 1}`,
          createdAt: new Date(
            `2025-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
          ),
        },
      }),
    );

    const mockGateway = createMockNotificationScheduleGateway({
      exists: true,
      executionHistory: history,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
      limit: 5,
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.executions).toHaveLength(5);
  });

  it("should return empty history when no executions", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      exists: true,
      executionHistory: [],
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.executions).toHaveLength(0);
  });

  it("should use default limit of 20 when not specified", async () => {
    const history: NotificationScheduleExecutionRecord[] = Array.from(
      { length: 25 },
      (_, i) => ({
        id: `exec-${i + 1}`,
        executedAt: new Date(),
        notification: {
          id: `notif-${i + 1}`,
          title: `Update ${i + 1}`,
          body: `Body ${i + 1}`,
          createdAt: new Date(),
        },
      }),
    );

    const mockGateway = createMockNotificationScheduleGateway({
      exists: true,
      executionHistory: history,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const input: GetNotificationScheduleExecutionHistoryInput = {
      scheduleId: "schedule-123",
    };

    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.executions).toHaveLength(20); // Default limit applied by mock
  });
});
