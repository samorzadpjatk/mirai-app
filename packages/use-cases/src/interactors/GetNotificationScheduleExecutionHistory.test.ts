import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  ScheduleNotFoundError,
} from "./GetNotificationScheduleExecutionHistory";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";
import type { NotificationSchedule } from "@mirai-app/domain";

describe("[UNIT] getNotificationScheduleExecutionHistoryUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleRepository();
  });

  // Helper to create mock notification schedule
  const createMockSchedule = (id: string): NotificationSchedule =>
    ({
      id,
      name: `Schedule ${id}`,
      tripId: "trip-123",
      notificationType: "reminder",
      notificationTitle: "Test",
      notificationBody: "Test",
      notificationUrl: null,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      hour: 9,
      minute: 0,
      isActive: true,
      createdById: "user-123",
      lastRun: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      isCurrentlyActive: () => true,
      isExpired: () => false,
      isUpcoming: () => false,
      getFormattedTime: () => "09:00",
    }) as NotificationSchedule;

  // Helper to run use case with repository
  const runUseCase = async (
    input: GetNotificationScheduleExecutionHistoryInput,
  ) => {
    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
        create: (schedule: NotificationSchedule) =>
          Effect.promise(() => repo.create(schedule)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByName: (name: string) =>
          Effect.promise(() => repo.findByName(name)),
        findByTripIdAndName: (tripId: string, name: string) =>
          Effect.promise(() => repo.findByTripIdAndName(tripId, name)),
        findByType: (type: string) =>
          Effect.promise(() => repo.findByType(type as any)),
        findAll: (options?: any) => Effect.promise(() => repo.findAll(options)),
        findActive: (now?: Date) => Effect.promise(() => repo.findActive(now)),
        findUpcoming: (days?: number, now?: Date) =>
          Effect.promise(() => repo.findUpcoming(days, now)),
        update: (schedule: NotificationSchedule) =>
          Effect.promise(() => repo.update(schedule)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => repo.deleteMany(ids)),
        count: (filter?: any) => Effect.promise(() => repo.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => repo.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => repo.toggleActive(id)),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => repo.countExecutions(scheduleId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should return execution history for schedule", async () => {
      // Create schedule first
      const schedule = createMockSchedule("schedule-123");
      await repo.create(schedule);

      // Add execution history manually to repo
      const executionHistory = [
        {
          id: "exec-1",
          executedAt: new Date("2024-01-01T09:00:00"),
          notification: {
            id: "notif-1",
            title: "Test 1",
            body: "Body 1",
            createdAt: new Date("2024-01-01T09:00:00"),
          },
        },
        {
          id: "exec-2",
          executedAt: new Date("2024-01-02T09:00:00"),
          notification: {
            id: "notif-2",
            title: "Test 2",
            body: "Body 2",
            createdAt: new Date("2024-01-02T09:00:00"),
          },
        },
      ];

      // Mock the getExecutionHistory method
      repo.getExecutionHistory = async () => executionHistory;

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input);

      expect(result.executions).toHaveLength(2);
      expect(result.executions[0].id).toBe("exec-1");
      expect(result.executions[1].id).toBe("exec-2");
    });

    it("should return error when schedule not found", async () => {
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "nonexistent",
      };

      const program = getNotificationScheduleExecutionHistoryUseCase(
        input,
      ).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          exists: () => Effect.succeed(false),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
          create: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.create(schedule)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByName: (name: string) =>
            Effect.promise(() => repo.findByName(name)),
          findByTripIdAndName: (tripId: string, name: string) =>
            Effect.promise(() => repo.findByTripIdAndName(tripId, name)),
          findByType: (type: string) =>
            Effect.promise(() => repo.findByType(type as any)),
          findAll: (options?: any) =>
            Effect.promise(() => repo.findAll(options)),
          findActive: (now?: Date) =>
            Effect.promise(() => repo.findActive(now)),
          findUpcoming: (days?: number, now?: Date) =>
            Effect.promise(() => repo.findUpcoming(days, now)),
          update: (schedule: NotificationSchedule) =>
            Effect.promise(() => repo.update(schedule)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          deleteMany: (ids: string[]) =>
            Effect.promise(() => repo.deleteMany(ids)),
          count: (filter?: any) => Effect.promise(() => repo.count(filter)),
          updateLastRun: (id: string, lastRun: Date) =>
            Effect.promise(() => repo.updateLastRun(id, lastRun)),
          toggleActive: (id: string) =>
            Effect.promise(() => repo.toggleActive(id)),
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
          countExecutions: (scheduleId: string) =>
            Effect.promise(() => repo.countExecutions(scheduleId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ScheduleNotFoundError);
      }
    });

    it("should use default limit of 20", async () => {
      const schedule = createMockSchedule("schedule-123");
      await repo.create(schedule);

      // Mock to capture the limit parameter
      let capturedLimit: number | undefined;
      repo.getExecutionHistory = async (_scheduleId: string, limit: number) => {
        capturedLimit = limit;
        return [];
      };

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      await runUseCase(input);

      expect(capturedLimit).toBe(20);
    });

    it("should use custom limit when provided", async () => {
      const schedule = createMockSchedule("schedule-123");
      await repo.create(schedule);

      // Mock to capture the limit parameter
      let capturedLimit: number | undefined;
      repo.getExecutionHistory = async (_scheduleId: string, limit: number) => {
        capturedLimit = limit;
        return [];
      };

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
        limit: 50,
      };

      await runUseCase(input);

      expect(capturedLimit).toBe(50);
    });

    it("should handle empty execution history", async () => {
      const schedule = createMockSchedule("schedule-123");
      await repo.create(schedule);

      repo.getExecutionHistory = async () => [];

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input);

      expect(result.executions).toEqual([]);
    });

    it("should return execution with notification details", async () => {
      const schedule = createMockSchedule("schedule-123");
      await repo.create(schedule);

      const executionHistory = [
        {
          id: "exec-1",
          executedAt: new Date("2024-01-01T09:00:00"),
          notification: {
            id: "notif-1",
            title: "Test 1",
            body: "Body 1",
            createdAt: new Date("2024-01-01T09:00:00"),
          },
        },
      ];

      repo.getExecutionHistory = async () => executionHistory;

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input);

      const execution = result.executions[0];
      expect(execution.id).toBe("exec-1");
      expect(execution.executedAt).toBeInstanceOf(Date);
      expect(execution.notification).not.toBeNull();
      expect(execution.notification?.id).toBe("notif-1");
      expect(execution.notification?.title).toBe("Test 1");
    });
  });
});
