import { describe, it, expect, beforeEach } from "bun:test";
import {
  createNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
  DuplicateScheduleNameError,
  ScheduleValidationError,
} from "./create";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters";

describe("[UNIT] createNotificationScheduleUseCase (Effect)", () => {
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

  const createValidSchedule = async (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string | null;
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
      }),
    );
    return schedule;
  };

  const runUseCase = async (input: CreateNotificationScheduleInput) => {
    const program = createNotificationScheduleUseCase(input).pipe(
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

      const stored = await Effect.runPromise(repo.findById(result.id));
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
      const existing = await createValidSchedule({
        id: "existing-123",
        name: "Duplicate Schedule",
        tripId: "trip-456",
      });
      await Effect.runPromise(repo.create(existing));

      const input = createValidInput({
        name: "Duplicate Schedule",
        tripId: "trip-456",
      });

      const program = createNotificationScheduleUseCase(input).pipe(
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

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DuplicateScheduleNameError);
        expect(either.left.name).toBe("Duplicate Schedule");
      }
    });

    it("should fail when validation fails for empty name", async () => {
      const input = createValidInput({
        name: "",
      });

      const program = createNotificationScheduleUseCase(input).pipe(
        Effect.provideService(NotificationScheduleGatewayTag, {
          create: (schedule: NotificationSchedule) => repo.create(schedule),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByName: (name: string) => repo.findByName(name),
          findByTripIdAndName: () => Effect.succeed(null),
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
        Effect.provideService(NotificationScheduleGatewayTag, {
          create: (schedule: NotificationSchedule) => repo.create(schedule),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByName: (name: string) => repo.findByName(name),
          findByTripIdAndName: () => Effect.succeed(null),
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
        expect(either.left).toBeInstanceOf(ScheduleValidationError);
      }
    });
  });
});
