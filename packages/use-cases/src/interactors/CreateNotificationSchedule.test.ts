import { describe, it, expect, beforeEach } from "bun:test";
import {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./CreateNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createNotificationScheduleUseCase (Effect)", () => {
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

  const createValidInput = (
    overrides?: Partial<CreateNotificationScheduleInput>,
  ): CreateNotificationScheduleInput => ({
    name: overrides?.name ?? "Test Schedule",
    tripId: overrides?.tripId ?? null,
    notificationType:
      overrides?.notificationType ?? NotificationScheduleType.INFO,
    notificationTitle: overrides?.notificationTitle ?? null,
    notificationBody: overrides?.notificationBody ?? null,
    notificationUrl: overrides?.notificationUrl ?? null,
    startDate: overrides?.startDate ?? getFutureDate(2),
    endDate: overrides?.endDate ?? getFutureDate(10),
    hour: overrides?.hour ?? 9,
    minute: overrides?.minute ?? 0,
    isActive: overrides?.isActive ?? true,
    createdById: overrides?.createdById ?? "user-123",
  });

  const createValidSchedule = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string | null;
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
      tripId: overrides?.tripId ?? null,
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
  const runUseCase = async (input: CreateNotificationScheduleInput) => {
    const program = createNotificationScheduleUseCase(input).pipe(
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
    it("should create schedule with valid input", async () => {
      const input = createValidInput({
        name: "Daily Reminder",
        notificationType: NotificationScheduleType.REMINDER,
        notificationTitle: "Test Title",
        notificationBody: "Test Body",
      });

      const result = await runUseCase(input);

      expect(result.name).toBe("Daily Reminder");
      expect(result.notificationType).toBe("REMINDER");
      expect(result.notificationTitle).toBe("Test Title");
      expect(result.notificationBody).toBe("Test Body");
      expect(result.isActive).toBe(true);

      // Verify it was stored
      const stored = await repo.findById(result.id);
      expect(stored).not.toBeNull();
      expect(stored?.name).toBe("Daily Reminder");
    });

    it("should create schedule without tripId", async () => {
      const input = createValidInput({
        tripId: null,
      });

      const result = await runUseCase(input);

      expect(result.tripId).toBeNull();
    });

    it("should create INFO type schedule without notification content", async () => {
      const input = createValidInput({
        notificationType: NotificationScheduleType.INFO,
        notificationTitle: null,
        notificationBody: null,
      });

      const result = await runUseCase(input);

      expect(result.notificationType).toBe("INFO");
      expect(result.notificationTitle).toBeNull();
      expect(result.notificationBody).toBeNull();
    });

    it("should fail when schedule with same name exists for trip", async () => {
      // First, create an existing schedule
      const existing = createValidSchedule({
        id: "existing-123",
        name: "Duplicate Schedule",
        tripId: "trip-456",
      });
      await repo.create(existing);

      const input = createValidInput({
        name: "Duplicate Schedule",
        tripId: "trip-456",
      });

      const program = createNotificationScheduleUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DuplicateScheduleNameError);
        expect(either.left.message).toContain("Duplicate Schedule");
      }
    });

    it("should fail when validation fails for empty name", async () => {
      const input = createValidInput({
        name: "",
      });

      const program = createNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          create: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.create(schedule)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByName: (name: string) =>
            Effect.promise(() => repo.findByName(name)),
          findByTripIdAndName: () => Effect.succeed(null),
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
        expect(either.left).toBeInstanceOf(ScheduleValidationError);
      }
    });

    it("should fail when non-INFO type requires notification content", async () => {
      const input = createValidInput({
        notificationType: NotificationScheduleType.REMINDER,
        notificationTitle: null,
        notificationBody: null,
      });

      const program = createNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          create: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.create(schedule)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByName: (name: string) =>
            Effect.promise(() => repo.findByName(name)),
          findByTripIdAndName: () => Effect.succeed(null),
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
        expect(either.left).toBeInstanceOf(ScheduleValidationError);
      }
    });
  });
});
