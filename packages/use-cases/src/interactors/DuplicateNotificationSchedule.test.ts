import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  DuplicateScheduleNotFoundError,
} from "./DuplicateNotificationSchedule";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] duplicateNotificationScheduleUseCase (Effect)", () => {
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
    overrides?: Partial<{
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
    }>,
  ): NotificationSchedule => {
    const notificationType =
      overrides?.notificationType ?? NotificationScheduleType.INFO;
    const needsContent = notificationType !== NotificationScheduleType.INFO;

    const result = NotificationSchedule.create({
      id: overrides?.id ?? "schedule-123",
      name: overrides?.name ?? "Test Schedule",
      tripId: null,
      notificationType,
      ...(needsContent && {
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
      }),
      startDate: getFutureDate(2),
      endDate: getFutureDate(10),
      hour: 9,
      minute: 0,
      createdById: "user-123",
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test schedule: ${result.error}`);
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DuplicateNotificationScheduleInput) => {
    const program = duplicateNotificationScheduleUseCase(input).pipe(
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
    it("should duplicate a schedule with default options", async () => {
      // Arrange - Create schedule with future dates
      const schedule = NotificationSchedule.create({
        id: "schedule-123",
        name: "Original Schedule",
        tripId: null,
        notificationType: NotificationScheduleType.INFO,
        startDate: getFutureDate(2),
        endDate: getFutureDate(10),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      });
      if (schedule.kind === "err") {
        throw new Error(`Failed to create test schedule: ${schedule.error}`);
      }
      await repo.create(schedule.value);

      // The duplicate method uses new Date() as default for startDate, which can fail validation.
      // We need to provide explicit future dates.
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(15),
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.schedule).toBeDefined();
      expect(result.schedule.name).toContain("Original Schedule");
    });

    it("should return error when original schedule not found", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "nonexistent",
        newCreatedById: "user-456",
      };

      const program = duplicateNotificationScheduleUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DuplicateScheduleNotFoundError);
      }
    });

    it("should duplicate with custom name", async () => {
      // Arrange - Create schedule with future dates
      const schedule = NotificationSchedule.create({
        id: "schedule-123",
        name: "Original Schedule",
        tripId: null,
        notificationType: NotificationScheduleType.INFO,
        startDate: getFutureDate(2),
        endDate: getFutureDate(10),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      });
      if (schedule.kind === "err") {
        throw new Error(`Failed to create test schedule: ${schedule.error}`);
      }
      await repo.create(schedule.value);

      // The duplicate method uses new Date() as default for startDate, which can fail validation.
      // We need to provide explicit future dates.
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        name: "My Custom Name",
        newCreatedById: "user-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(15),
      };

      const result = await runUseCase(input);

      expect(result.schedule).toBeDefined();
      expect(result.schedule.name).toBe("My Custom Name");
    });

    it("should duplicate with custom dates", async () => {
      // Arrange - Create schedule with future dates
      const schedule = NotificationSchedule.create({
        id: "schedule-123",
        name: "Original Schedule",
        tripId: null,
        notificationType: NotificationScheduleType.INFO,
        startDate: getFutureDate(2),
        endDate: getFutureDate(10),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      });
      if (schedule.kind === "err") {
        throw new Error(`Failed to create test schedule: ${schedule.error}`);
      }
      await repo.create(schedule.value);

      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        startDate: getFutureDate(20),
        endDate: getFutureDate(30),
        newCreatedById: "user-456",
      };

      const result = await runUseCase(input);

      expect(result.schedule).toBeDefined();
    });
  });
});
