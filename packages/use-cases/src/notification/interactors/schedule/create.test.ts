import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import type { NotificationScheduleGateway } from "../../ports/schedule/gateway";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./create";
import { NotificationScheduleType } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationScheduleGateway for testing
 */
function createMockNotificationScheduleGateway(
  options: {
    shouldFailCreate?: boolean;
    existingSchedule?: NotificationScheduleDTO | null;
  } = {},
): NotificationScheduleGateway {
  const scheduleMap = new Map<string, NotificationScheduleDTO>();

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
    create: (schedule: NotificationScheduleDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      scheduleMap.set(schedule.id, schedule);
      return Effect.succeed(schedule);
    },

    findById: (id: string) =>
      Effect.succeed(scheduleMap.get(id) || options.existingSchedule || null),

    findByName: () => Effect.succeed(null),

    findByTripIdAndName: (tripId: string, name: string) => {
      if (
        options.existingSchedule &&
        options.existingSchedule.tripId === tripId &&
        options.existingSchedule.name === name
      ) {
        return Effect.succeed(options.existingSchedule);
      }
      return Effect.succeed(null);
    },

    update: (schedule: NotificationScheduleDTO) => Effect.succeed(schedule),

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

describe("[UNIT] createNotificationScheduleUseCase", () => {
  it("should create a notification schedule successfully", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Daily Reminder",
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 9,
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Daily Reminder");
    expect(result.notificationType).toBe(NotificationScheduleType.INFO);
    expect(result.isActive).toBe(true);
    expect(result.createdById).toBe("admin-123");
    expect(result.hour).toBe(9);
    expect(result.minute).toBe(0);
  });

  it("should fail with DuplicateScheduleNameError when name exists in same trip", async () => {
    const existingSchedule: NotificationScheduleDTO = {
      id: "existing-123",
      name: "Duplicate Name",
      tripId: "trip-123",
      notificationType: NotificationScheduleType.INFO,
      notificationTitle: null,
      notificationBody: null,
      notificationUrl: null,
      startDate: new Date("2025-02-01T10:00:00Z"),
      endDate: new Date("2025-02-07T10:00:00Z"),
      hour: 10,
      minute: 0,
      isActive: true,
      createdById: "admin-123",
      lastRun: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Duplicate Name",
      tripId: "trip-123",
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 9,
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DuplicateScheduleNameError);
    }
  });

  it("should fail with ScheduleValidationError for invalid hour", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Invalid Schedule",
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 25, // Invalid hour
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ScheduleValidationError);
    }
  });

  it("should fail with ScheduleValidationError for empty name", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "",
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 9,
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ScheduleValidationError);
    }
  });

  it("should create schedule with trip association", async () => {
    const mockGateway = createMockNotificationScheduleGateway();
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Trip Reminder",
      tripId: "trip-456",
      notificationType: NotificationScheduleType.REMINDER,
      notificationTitle: "Trip Update",
      notificationBody: "Your trip is starting soon!",
      startDate: futureDate,
      endDate: endDate,
      hour: 8,
      minute: 30,
      isActive: true,
      createdById: "admin-456",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.tripId).toBe("trip-456");
    expect(result.notificationTitle).toBe("Trip Update");
    expect(result.notificationBody).toBe("Your trip is starting soon!");
  });

  it("should handle repository database errors gracefully", async () => {
    const mockGateway = createMockNotificationScheduleGateway({
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Error Test",
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 9,
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should allow same name in different trips", async () => {
    const existingSchedule: NotificationScheduleDTO = {
      id: "existing-123",
      name: "Shared Name",
      tripId: "trip-111",
      notificationType: NotificationScheduleType.INFO,
      notificationTitle: null,
      notificationBody: null,
      notificationUrl: null,
      startDate: new Date("2025-02-01T10:00:00Z"),
      endDate: new Date("2025-02-07T10:00:00Z"),
      hour: 10,
      minute: 0,
      isActive: true,
      createdById: "admin-123",
      lastRun: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockGateway = createMockNotificationScheduleGateway({
      existingSchedule,
    });
    const mockLayer = Layer.succeed(
      NotificationScheduleGatewayTag,
      mockGateway,
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);

    const input: CreateNotificationScheduleInput = {
      name: "Shared Name",
      tripId: "trip-222", // Different trip
      notificationType: NotificationScheduleType.INFO,
      startDate: futureDate,
      endDate: endDate,
      hour: 9,
      minute: 0,
      createdById: "admin-123",
    };

    const program = createNotificationScheduleUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Shared Name");
    expect(result.tripId).toBe("trip-222");
  });
});
