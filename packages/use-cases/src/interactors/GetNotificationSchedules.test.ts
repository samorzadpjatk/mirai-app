import { describe, it, expect, beforeEach } from "bun:test";
import {
  getNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
} from "./GetNotificationSchedules";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getNotificationSchedulesUseCase (Effect)", () => {
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
  const runUseCase = async (input: GetNotificationSchedulesInput) => {
    const program = getNotificationSchedulesUseCase(input).pipe(
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
    it("should return empty list when no schedules exist", async () => {
      const input: GetNotificationSchedulesInput = {};

      const result = await runUseCase(input);

      expect(result.schedules).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should return list of schedules", async () => {
      // Arrange
      const schedule1 = createValidSchedule({
        id: "schedule-1",
        name: "Schedule One",
        notificationType: NotificationScheduleType.INFO,
      });
      const schedule2 = createValidSchedule({
        id: "schedule-2",
        name: "Schedule Two",
        notificationType: NotificationScheduleType.REMINDER,
      });
      await repo.create(schedule1);
      await repo.create(schedule2);

      const input: GetNotificationSchedulesInput = {};

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.schedules[0].name).toBe("Schedule One");
      expect(result.schedules[1].name).toBe("Schedule Two");
    });

    it("should support pagination", async () => {
      // Arrange
      for (let i = 1; i <= 5; i++) {
        const schedule = createValidSchedule({
          id: `schedule-${i}`,
          name: `Schedule ${i}`,
        });
        await repo.create(schedule);
      }

      const input: GetNotificationSchedulesInput = {
        pagination: { limit: 2, offset: 0 },
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should include computed fields in output", async () => {
      // Arrange
      const schedule = createValidSchedule({
        id: "schedule-1",
        name: "Test Schedule",
      });
      await repo.create(schedule);

      const input: GetNotificationSchedulesInput = {};

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.schedules[0].formattedTime).toBe("09:00");
      expect(typeof result.schedules[0].isCurrentlyActive).toBe("boolean");
      expect(typeof result.schedules[0].isExpired).toBe("boolean");
      expect(typeof result.schedules[0].isUpcoming).toBe("boolean");
    });
  });
});
