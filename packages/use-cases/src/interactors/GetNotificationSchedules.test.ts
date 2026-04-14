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

  const createValidSchedule = async (
    overrides?: Partial<{
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
    }>,
  ): Promise<NotificationSchedule> => {
    const notificationType =
      overrides?.notificationType ?? NotificationScheduleType.INFO;
    const needsContent = notificationType !== NotificationScheduleType.INFO;

    const schedule = await Effect.runPromise(
      NotificationSchedule.create({
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
      }),
    );
    return schedule;
  };

  const runUseCase = async (input: GetNotificationSchedulesInput) => {
    const program = getNotificationSchedulesUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: NotificationScheduleType) => repo.findByType(type),
        findAllPaginated: (options?: {
          filter?: import("@mirai-app/domain").NotificationScheduleFilter;
          pagination?: import("@mirai-app/domain").PaginationOptions;
        }) => repo.findAllPaginated(options),
        findActive: (now?: Date) => repo.findActive(now),
        findUpcoming: (days?: number, now?: Date) =>
          repo.findUpcoming(days, now),
        update: (schedule: NotificationSchedule) => repo.update(schedule),
        delete: (id: string) => repo.delete(id),
        deleteMany: (ids: string[]) => repo.deleteMany(ids),
        exists: (id: string) => repo.exists(id),
        count: (
          filter?: import("@mirai-app/domain").NotificationScheduleFilter,
        ) => repo.count(filter),
        updateLastRun: (id: string, lastRun: Date) =>
          repo.updateLastRun(id, lastRun),
        toggleActive: (id: string) => repo.toggleActive(id),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          repo.bulkToggleActive(ids, isActive),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          repo.getExecutionHistory(scheduleId, limit),
        countExecutions: (scheduleId: string) =>
          repo.countExecutions(scheduleId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return empty list when no schedules exist", async () => {
      const input: GetNotificationSchedulesInput = {};

      const result = await runUseCase(input);

      expect(result.schedules).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should return list of schedules", async () => {
      const schedule1 = await createValidSchedule({
        id: "schedule-1",
        name: "Schedule One",
        notificationType: NotificationScheduleType.INFO,
      });
      const schedule2 = await createValidSchedule({
        id: "schedule-2",
        name: "Schedule Two",
        notificationType: NotificationScheduleType.REMINDER,
      });
      await Effect.runPromise(repo.create(schedule1));
      await Effect.runPromise(repo.create(schedule2));

      const input: GetNotificationSchedulesInput = {};

      const result = await runUseCase(input);

      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.schedules[0].name).toBe("Schedule One");
      expect(result.schedules[1].name).toBe("Schedule Two");
    });

    it("should support pagination", async () => {
      for (let i = 1; i <= 5; i++) {
        const schedule = await createValidSchedule({
          id: `schedule-${i}`,
          name: `Schedule ${i}`,
        });
        await Effect.runPromise(repo.create(schedule));
      }

      const input: GetNotificationSchedulesInput = {
        pagination: { limit: 2, offset: 0 },
      };

      const result = await runUseCase(input);

      expect(result.schedules).toHaveLength(2);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should include computed fields in output", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-1",
        name: "Test Schedule",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: GetNotificationSchedulesInput = {};

      const result = await runUseCase(input);

      expect(result.schedules[0].formattedTime).toBe("09:00");
      expect(typeof result.schedules[0].isCurrentlyActive).toBe("boolean");
      expect(typeof result.schedules[0].isExpired).toBe("boolean");
      expect(typeof result.schedules[0].isUpcoming).toBe("boolean");
    });
  });
});
