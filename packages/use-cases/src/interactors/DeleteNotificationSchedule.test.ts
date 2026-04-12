import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
  DeleteScheduleNotFoundError,
} from "./DeleteNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteNotificationScheduleUseCase (Effect)", () => {
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
  const runUseCase = async (input: DeleteNotificationScheduleInput) => {
    const program = deleteNotificationScheduleUseCase(input).pipe(
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
    it("should delete schedule successfully", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-456",
        name: "Daily Reminder",
      });
      await repo.create(schedule);
      // Add execution history
      repo.seedExecutionHistory("schedule-456", [
        {
          id: "exec-1",
          executedAt: new Date(),
          notification: {
            id: "notif-1",
            title: "Test",
            body: "Test body",
            createdAt: new Date(),
          },
        },
        {
          id: "exec-2",
          executedAt: new Date(),
          notification: null,
        },
        {
          id: "exec-3",
          executedAt: new Date(),
          notification: {
            id: "notif-2",
            title: "Test 2",
            body: "Test body 2",
            createdAt: new Date(),
          },
        },
      ]);

      const input: DeleteNotificationScheduleInput = {
        id: "schedule-456",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedExecutionCount).toBe(3);
      expect(result.message).toContain("Daily Reminder");

      // Verify schedule was deleted
      const stored = await repo.findById("schedule-456");
      expect(stored).toBeNull();
    });

    it("should return error when schedule not found", async () => {
      const input: DeleteNotificationScheduleInput = {
        id: "non-existent",
      };

      const program = deleteNotificationScheduleUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DeleteScheduleNotFoundError);
      }
    });
  });
});
