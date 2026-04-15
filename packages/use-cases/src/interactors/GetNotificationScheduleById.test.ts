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
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] getNotificationScheduleByIdUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleGateway();
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

  const runUseCase = async (input: GetNotificationScheduleByIdInput) => {
    const program = getNotificationScheduleByIdUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: NotificationScheduleType) => repo.findByType(type),
        findAll: (options?: {
          filter?: import("@mirai-app/domain").NotificationScheduleFilter;
          pagination?: import("@mirai-app/domain").PaginationOptions;
        }) => repo.findAll(options),
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
    it("should return schedule when found", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
        name: "Daily Reminder",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: GetNotificationScheduleByIdInput = {
        id: "schedule-456",
      };

      const result = await runUseCase(input);

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
          create: (schedule: NotificationSchedule) => repo.create(schedule),
          findById: () => Effect.succeed(null),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByName: (name: string) => repo.findByName(name),
          findByTripIdAndName: (tripId: string, name: string) =>
            repo.findByTripIdAndName(tripId, name),
          findByType: (type: NotificationScheduleType) => repo.findByType(type),
          findAll: (options?: {
            filter?: import("@mirai-app/domain").NotificationScheduleFilter;
            pagination?: import("@mirai-app/domain").PaginationOptions;
          }) => repo.findAll(options),
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetScheduleNotFoundError);
      }
    });
  });
});
