import { describe, it, expect, beforeEach } from "bun:test";
import {
  getNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
  GetScheduleNotFoundError,
} from "./GetNotificationScheduleById";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getNotificationScheduleByIdUseCase (Effect)", () => {
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
    // INFO type doesn't require notification content, other types do
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
  const runUseCase = async (input: GetNotificationScheduleByIdInput) => {
    const program = getNotificationScheduleByIdUseCase(input).pipe(
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
    it("should return schedule when found", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
        name: "Daily Reminder",
      });
      await repo.create(schedule);

      const input: GetNotificationScheduleByIdInput = {
        id: "schedule-456",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("schedule-456");
      expect(result.name).toBe("Daily Reminder");
      expect(result.tripId).toBeNull();
      expect(result.notificationType).toBe("INFO");
      expect(result.formattedTime).toBeDefined();
    });

    it("should return error when schedule not found", async () => {
      const input: GetNotificationScheduleByIdInput = {
        id: "non-existent",
      };

      const program = getNotificationScheduleByIdUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GetScheduleNotFoundError);
      }
    });
  });
});
