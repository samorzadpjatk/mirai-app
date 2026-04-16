import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  duplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
  DuplicateScheduleNotFoundError,
} from "./duplicate";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters";

describe("[UNIT] duplicateNotificationScheduleUseCase (Effect)", () => {
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

  const runUseCase = async (input: DuplicateNotificationScheduleInput) => {
    const program = duplicateNotificationScheduleUseCase(input).pipe(
      Effect.provideService(NotificationScheduleGatewayTag, {
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
    it("should duplicate a schedule with default options", async () => {
      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          id: "schedule-123",
          name: "Original Schedule",
          tripId: null,
          notificationType: NotificationScheduleType.INFO,
          startDate: getFutureDate(2),
          endDate: getFutureDate(10),
          hour: 9,
          minute: 0,
          createdById: "user-123",
        }),
      );
      await Effect.runPromise(repo.create(schedule));

      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(15),
      };

      const result = await runUseCase(input);

      expect(result.schedule).toBeDefined();
      expect(result.schedule.name).toContain("Original Schedule");
    });

    it("should return error when original schedule not found", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "nonexistent",
        newCreatedById: "user-456",
      };

      const program = duplicateNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleGatewayTag, {
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
        expect(either.left).toBeInstanceOf(DuplicateScheduleNotFoundError);
      }
    });

    it("should duplicate with custom name", async () => {
      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          id: "schedule-123",
          name: "Original Schedule",
          tripId: null,
          notificationType: NotificationScheduleType.INFO,
          startDate: getFutureDate(2),
          endDate: getFutureDate(10),
          hour: 9,
          minute: 0,
          createdById: "user-123",
        }),
      );
      await Effect.runPromise(repo.create(schedule));

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
      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          id: "schedule-123",
          name: "Original Schedule",
          tripId: null,
          notificationType: NotificationScheduleType.INFO,
          startDate: getFutureDate(2),
          endDate: getFutureDate(10),
          hour: 9,
          minute: 0,
          createdById: "user-123",
        }),
      );
      await Effect.runPromise(repo.create(schedule));

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
