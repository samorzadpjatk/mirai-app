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

  const createValidSchedule = async (
    overrides?: Partial<{ id: string; name: string; isActive: boolean }>,
  ): Promise<NotificationSchedule> => {
    const schedule = await Effect.runPromise(
      NotificationSchedule.create({
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
      }),
    );
    return schedule;
  };

  const runUseCase = async (input: UpdateNotificationScheduleInput) => {
    const program = updateNotificationScheduleUseCase(input).pipe(
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

  describe("execute", () => {
    it("should update schedule name", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
        name: "Old Name",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "New Name",
      };

      const result = await runUseCase(input);

      expect(result.name).toBe("New Name");

      const stored = await Effect.runPromise(repo.findById("schedule-456"));
      expect(stored?.name).toBe("New Name");
    });

    it("should update schedule dates", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(60),
      };

      const result = await runUseCase(input);

      expect(result.startDate.getDate()).toBe(getFutureDate(5).getDate());
      expect(result.endDate.getDate()).toBe(getFutureDate(60).getDate());
    });

    it("should update schedule time", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        hour: 14,
        minute: 30,
      };

      const result = await runUseCase(input);

      expect(result.hour).toBe(14);
      expect(result.minute).toBe(30);
      expect(result.formattedTime).toBe("14:30");
    });

    it("should update schedule active status", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
        isActive: true,
      });
      await Effect.runPromise(repo.create(schedule));

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        isActive: false,
      };

      const result = await runUseCase(input);

      expect(result.isActive).toBe(false);
    });

    it("should return error when schedule not found", async () => {
      const input: UpdateNotificationScheduleInput = {
        id: "non-existent",
        name: "New Name",
      };

      const program = updateNotificationScheduleUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UpdateScheduleNotFoundError);
      }
    });

    it("should fail when validation fails for empty name", async () => {
      const schedule = await createValidSchedule({
        id: "schedule-456",
      });
      await Effect.runPromise(repo.create(schedule));

      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "",
      };

      const program = updateNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          create: (schedule: NotificationSchedule) => repo.create(schedule),
          findById: () => Effect.succeed(schedule),
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
        expect(either.left).toBeInstanceOf(UpdateScheduleValidationError);
      }
    });
  });
});
