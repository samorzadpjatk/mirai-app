import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
  UpdateScheduleNotFoundError,
  UpdateScheduleValidationError,
} from "./UpdateNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateNotificationScheduleUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleRepository();
  });

  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const createValidSchedule = (
    overrides?: Partial<{ id: string; name: string; isActive: boolean }>,
  ): NotificationSchedule => {
    const result = NotificationSchedule.create({
      id: overrides?.id ?? "schedule-123",
      name: overrides?.name ?? "Test Schedule",
      tripId: null,
      notificationType: NotificationScheduleType.INFO,
      startDate: getFutureDate(2),
      endDate: getFutureDate(10),
      hour: 9,
      minute: 0,
      isActive: overrides?.isActive ?? true,
      createdById: "user-123",
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test schedule: ${result.error}`);
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateNotificationScheduleInput) => {
    const program = updateNotificationScheduleUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        create: (schedule: NotificationSchedule) =>
          Effect.promise(() => repo.create(schedule)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => repo.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() => repo.findByTripIdAndName(tripId, name)),
        findByType: (type: NotificationScheduleType) =>
          Effect.promise(() => repo.findByType(type)),
        findAll: (options?: {
          filter?: import("@mirai-app/domain").NotificationScheduleFilter;
          pagination?: import("@mirai-app/domain").PaginationOptions;
        }) => Effect.promise(() => repo.findAll(options)),
        findActive: (now?: Date) => Effect.promise(() => repo.findActive(now)),
        findUpcoming: (days?: number, now?: Date) =>
          Effect.promise(() => repo.findUpcoming(days, now)),
        update: (schedule: NotificationSchedule) =>
          Effect.promise(() => repo.update(schedule)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => repo.deleteMany(ids)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        count: (
          filter?: import("@mirai-app/domain").NotificationScheduleFilter,
        ) => Effect.promise(() => repo.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => repo.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => repo.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => repo.countExecutions(scheduleId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should update schedule name", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
        name: "Old Name",
      });
      await repo.create(schedule);

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "New Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("New Name");

      // Verify it was stored
      const stored = await repo.findById("schedule-456");
      expect(stored?.name).toBe("New Name");
    });

    it("should update schedule dates", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
      });
      await repo.create(schedule);

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(60),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.startDate.getDate()).toBe(getFutureDate(5).getDate());
      expect(result.endDate.getDate()).toBe(getFutureDate(60).getDate());
    });

    it("should update schedule time", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
      });
      await repo.create(schedule);

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        hour: 14,
        minute: 30,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formattedTime).toBe("14:30");
    });

    it("should update schedule active status", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
        isActive: true,
      });
      await repo.create(schedule);

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        isActive: false,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const input: UpdateNotificationScheduleInput = {
        id: "non-existent",
        name: "New Name",
      };

      const program = updateNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          create: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.create(schedule)),
          findById: () => Effect.succeed(null),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByName: (name: string) =>
            Effect.promise(() => repo.findByName(name)),
          findByTripIdAndName: (tripId: string, name: string) =>
            Effect.promise(() => repo.findByTripIdAndName(tripId, name)),
          findByType: (type: NotificationScheduleType) =>
            Effect.promise(() => repo.findByType(type)),
          findAll: (options?: {
            filter?: import("@mirai-app/domain").NotificationScheduleFilter;
            pagination?: import("@mirai-app/domain").PaginationOptions;
          }) => Effect.promise(() => repo.findAll(options)),
          findActive: (now?: Date) =>
            Effect.promise(() => repo.findActive(now)),
          findUpcoming: (days?: number, now?: Date) =>
            Effect.promise(() => repo.findUpcoming(days, now)),
          update: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.update(schedule)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteMany: (ids: string[]) =>
            Effect.promise(() => repo.deleteMany(ids)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          count: (
            filter?: import("@mirai-app/domain").NotificationScheduleFilter,
          ) => Effect.promise(() => repo.count(filter)),
          updateLastRun: (id: string, lastRun: Date) =>
            Effect.promise(() => repo.updateLastRun(id, lastRun)),
          toggleActive: (id: string) =>
            Effect.promise(() => repo.toggleActive(id)),
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
          countExecutions: (scheduleId: string) =>
            Effect.promise(() => repo.countExecutions(scheduleId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateScheduleNotFoundError);
      }
    });

    it("should fail when validation fails for empty name", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
      });
      await repo.create(schedule);

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "",
      };

      const program = updateNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          create: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.create(schedule)),
          findById: () => Effect.succeed(schedule),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByName: (name: string) =>
            Effect.promise(() => repo.findByName(name)),
          findByTripIdAndName: (tripId: string, name: string) =>
            Effect.promise(() => repo.findByTripIdAndName(tripId, name)),
          findByType: (type: NotificationScheduleType) =>
            Effect.promise(() => repo.findByType(type)),
          findAll: (options?: {
            filter?: import("@mirai-app/domain").NotificationScheduleFilter;
            pagination?: import("@mirai-app/domain").PaginationOptions;
          }) => Effect.promise(() => repo.findAll(options)),
          findActive: (now?: Date) =>
            Effect.promise(() => repo.findActive(now)),
          findUpcoming: (days?: number, now?: Date) =>
            Effect.promise(() => repo.findUpcoming(days, now)),
          update: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.update(schedule)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteMany: (ids: string[]) =>
            Effect.promise(() => repo.deleteMany(ids)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          count: (
            filter?: import("@mirai-app/domain").NotificationScheduleFilter,
          ) => Effect.promise(() => repo.count(filter)),
          updateLastRun: (id: string, lastRun: Date) =>
            Effect.promise(() => repo.updateLastRun(id, lastRun)),
          toggleActive: (id: string) =>
            Effect.promise(() => repo.toggleActive(id)),
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
          countExecutions: (scheduleId: string) =>
            Effect.promise(() => repo.countExecutions(scheduleId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateScheduleValidationError);
      }
    });
  });
});
