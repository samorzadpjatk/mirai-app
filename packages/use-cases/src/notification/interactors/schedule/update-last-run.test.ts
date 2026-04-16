import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  updateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
  UpdateLastRunNotFoundError,
} from "./update-last-run";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters";

describe("[UNIT] updateNotificationScheduleLastRunUseCase (Effect)", () => {
  let gateway: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    gateway = new InMemoryNotificationScheduleGateway();
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
    }>,
  ): Promise<NotificationSchedule> => {
    return await Effect.runPromise(
      NotificationSchedule.create({
        id: overrides?.id ?? "schedule-123",
        name: overrides?.name ?? "Test Schedule",
        tripId: null,
        notificationType: NotificationScheduleType.INFO,
        startDate: getFutureDate(2),
        endDate: getFutureDate(10),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      }),
    );
  };

  // Helper to run use case with gateway
  const runUseCase = async (input: UpdateNotificationScheduleLastRunInput) => {
    const program = updateNotificationScheduleLastRunUseCase(input).pipe(
      Effect.provideService(NotificationScheduleGatewayTag, {
        create: (schedule: NotificationSchedule) => gateway.create(schedule),
        findById: (id: string) => gateway.findById(id),
        findByTripId: (tripId: string) => gateway.findByTripId(tripId),
        findByName: (name: string) => gateway.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          gateway.findByTripIdAndName(tripId, name),
        findByType: (type: NotificationScheduleType) =>
          gateway.findByType(type),
        findAll: (options?: {
          filter?: import("@mirai-app/domain").NotificationScheduleFilter;
          pagination?: import("@mirai-app/domain").PaginationOptions;
        }) => gateway.findAll(options),
        findActive: (now?: Date) => gateway.findActive(now),
        findUpcoming: (days?: number, now?: Date) =>
          gateway.findUpcoming(days, now),
        update: (schedule: NotificationSchedule) => gateway.update(schedule),
        delete: (id: string) => gateway.delete(id),
        deleteMany: (ids: string[]) => gateway.deleteMany(ids),
        exists: (id: string) => gateway.exists(id),
        count: (
          filter?: import("@mirai-app/domain").NotificationScheduleFilter,
        ) => gateway.count(filter),
        updateLastRun: (id: string, lastRun: Date) =>
          gateway.updateLastRun(id, lastRun),
        toggleActive: (id: string) => gateway.toggleActive(id),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          gateway.bulkToggleActive(ids, isActive),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          gateway.getExecutionHistory(scheduleId, limit),
        countExecutions: (scheduleId: string) =>
          gateway.countExecutions(scheduleId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should update lastRun successfully", async () => {
      // Arrange
      const schedule = await createValidSchedule({
        id: "schedule-123",
        name: "Test Schedule",
      });
      Effect.runSync(gateway.create(schedule));

      const lastRun = new Date("2024-06-15T10:30:00Z");
      const input: UpdateNotificationScheduleLastRunInput = {
        id: "schedule-123",
        lastRun,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("schedule-123");
      expect(result.lastRun).toEqual(lastRun);
    });

    it("should return error when schedule not found", async () => {
      const input: UpdateNotificationScheduleLastRunInput = {
        id: "nonexistent",
        lastRun: new Date(),
      };

      const program = updateNotificationScheduleLastRunUseCase(input).pipe(
        Effect.provideService(NotificationScheduleGatewayTag, {
          create: (schedule: NotificationSchedule) => gateway.create(schedule),
          findById: () => Effect.succeed(null),
          findByTripId: (tripId: string) => gateway.findByTripId(tripId),
          findByName: (name: string) => gateway.findByName(name),
          findByTripIdAndName: (tripId: string, name: string) =>
            gateway.findByTripIdAndName(tripId, name),
          findByType: (type: NotificationScheduleType) =>
            gateway.findByType(type),
          findAll: (options?: {
            filter?: import("@mirai-app/domain").NotificationScheduleFilter;
            pagination?: import("@mirai-app/domain").PaginationOptions;
          }) => gateway.findAll(options),
          findActive: (now?: Date) => gateway.findActive(now),
          findUpcoming: (days?: number, now?: Date) =>
            gateway.findUpcoming(days, now),
          update: (schedule: NotificationSchedule) => gateway.update(schedule),
          delete: (id: string) => gateway.delete(id),
          deleteMany: (ids: string[]) => gateway.deleteMany(ids),
          exists: (id: string) => gateway.exists(id),
          count: (
            filter?: import("@mirai-app/domain").NotificationScheduleFilter,
          ) => gateway.count(filter),
          updateLastRun: (id: string, lastRun: Date) =>
            gateway.updateLastRun(id, lastRun),
          toggleActive: (id: string) => gateway.toggleActive(id),
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            gateway.bulkToggleActive(ids, isActive),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            gateway.getExecutionHistory(scheduleId, limit),
          countExecutions: (scheduleId: string) =>
            gateway.countExecutions(scheduleId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateLastRunNotFoundError);
      }
    });
  });
});
