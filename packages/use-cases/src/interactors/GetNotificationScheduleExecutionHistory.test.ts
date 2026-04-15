import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  getNotificationScheduleExecutionHistoryUseCase,
  type GetNotificationScheduleExecutionHistoryInput,
  ScheduleNotFoundError,
} from "./GetNotificationScheduleExecutionHistory";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";
import type {
  NotificationSchedule,
  NotificationScheduleExecutionRecord,
} from "@mirai-app/domain";

describe("[UNIT] getNotificationScheduleExecutionHistoryUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleGateway();
  });

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

  const createMockHistory = (
    overrides?: Partial<NotificationScheduleExecutionRecord>[],
  ): NotificationScheduleExecutionRecord[] =>
    overrides?.map((o, i) => ({
      id: o?.id ?? `exec-${i + 1}`,
      executedAt: o?.executedAt ?? new Date(`2024-01-0${i + 1}T09:00:00Z`),
      notification: o?.notification ?? {
        id: `notif-${i + 1}`,
        title: `Test ${i + 1}`,
        body: `Body ${i + 1}`,
        createdAt: new Date(`2024-01-0${i + 1}T09:00:00Z`),
      },
    })) ?? [];

  const runUseCase = async (
    input: GetNotificationScheduleExecutionHistoryInput,
    mockHistory?: NotificationScheduleExecutionRecord[],
  ) => {
    const history = mockHistory ?? createMockHistory();
    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) => repo.exists(id),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.succeed(history),
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: string) => repo.findByType(type as any),
        findAll: (options?: any) => repo.findAll(options),
        findActive: (now?: Date) => repo.findActive(now),
        findUpcoming: (days?: number, now?: Date) =>
          repo.findUpcoming(days, now),
        update: (schedule: NotificationSchedule) => repo.update(schedule),
        delete: (id: string) => repo.delete(id),
        deleteMany: (ids: string[]) => repo.deleteMany(ids),
        count: (filter?: any) => repo.count(filter),
        updateLastRun: (id: string, lastRun: Date) =>
          repo.updateLastRun(id, lastRun),
        toggleActive: (id: string) => repo.toggleActive(id),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          repo.bulkToggleActive(ids, isActive),
        countExecutions: (scheduleId: string) =>
          repo.countExecutions(scheduleId),
      }),
    );
    return await Effect.runPromise(program);
  };

  const runUseCaseWithLimitCapture = async (
    input: GetNotificationScheduleExecutionHistoryInput,
    captureLimit: (limit: number) => void,
  ) => {
    const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) => repo.exists(id),
        getExecutionHistory: (scheduleId: string, limit: number) => {
          captureLimit(limit);
          return Effect.succeed([]);
        },
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: string) => repo.findByType(type as any),
        findAll: (options?: any) => repo.findAll(options),
        findActive: (now?: Date) => repo.findActive(now),
        findUpcoming: (days?: number, now?: Date) =>
          repo.findUpcoming(days, now),
        update: (schedule: NotificationSchedule) => repo.update(schedule),
        delete: (id: string) => repo.delete(id),
        deleteMany: (ids: string[]) => repo.deleteMany(ids),
        count: (filter?: any) => repo.count(filter),
        updateLastRun: (id: string, lastRun: Date) =>
          repo.updateLastRun(id, lastRun),
        toggleActive: (id: string) => repo.toggleActive(id),
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          repo.bulkToggleActive(ids, isActive),
        countExecutions: (scheduleId: string) =>
          repo.countExecutions(scheduleId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return execution history for schedule", async () => {
      const schedule = createMockSchedule("schedule-123");
      await Effect.runPromise(repo.create(schedule));

      const executionHistory = createMockHistory([
        {
          id: "exec-1",
          notification: {
            id: "notif-1",
            title: "Test 1",
            body: "Body 1",
            createdAt: new Date(),
          },
        },
        {
          id: "exec-2",
          notification: {
            id: "notif-2",
            title: "Test 2",
            body: "Body 2",
            createdAt: new Date(),
          },
        },
      ]);

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input, executionHistory);

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
            Effect.succeed([]),
          create: (schedule: NotificationSchedule) => repo.create(schedule),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByName: (name: string) => repo.findByName(name),
          findByTripIdAndName: (tripId: string, name: string) =>
            repo.findByTripIdAndName(tripId, name),
          findByType: (type: string) => repo.findByType(type as any),
          findAll: (options?: any) => repo.findAll(options),
          findActive: (now?: Date) => repo.findActive(now),
          findUpcoming: (days?: number, now?: Date) =>
            repo.findUpcoming(days, now),
          update: (schedule: NotificationSchedule) => repo.update(schedule),
          delete: (id: string) => repo.delete(id),
          deleteMany: (ids: string[]) => repo.deleteMany(ids),
          count: (filter?: any) => repo.count(filter),
          updateLastRun: (id: string, lastRun: Date) =>
            repo.updateLastRun(id, lastRun),
          toggleActive: (id: string) => repo.toggleActive(id),
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            repo.bulkToggleActive(ids, isActive),
          countExecutions: (scheduleId: string) =>
            repo.countExecutions(scheduleId),
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
      await Effect.runPromise(repo.create(schedule));

      let capturedLimit: number | undefined;
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      await runUseCaseWithLimitCapture(input, (limit) => {
        capturedLimit = limit;
      });

      expect(capturedLimit).toBe(20);
    });

    it("should use custom limit when provided", async () => {
      const schedule = createMockSchedule("schedule-123");
      await Effect.runPromise(repo.create(schedule));

      let capturedLimit: number | undefined;
      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
        limit: 50,
      };

      await runUseCaseWithLimitCapture(input, (limit) => {
        capturedLimit = limit;
      });

      expect(capturedLimit).toBe(50);
    });

    it("should handle empty execution history", async () => {
      const schedule = createMockSchedule("schedule-123");
      await Effect.runPromise(repo.create(schedule));

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input, []);

      expect(result.executions).toEqual([]);
    });

    it("should return execution with notification details", async () => {
      const schedule = createMockSchedule("schedule-123");
      await Effect.runPromise(repo.create(schedule));

      const executionHistory = createMockHistory([
        {
          id: "exec-1",
          notification: {
            id: "notif-1",
            title: "Test 1",
            body: "Body 1",
            createdAt: new Date(),
          },
        },
      ]);

      const input: GetNotificationScheduleExecutionHistoryInput = {
        scheduleId: "schedule-123",
      };

      const result = await runUseCase(input, executionHistory);

      const execution = result.executions[0];
      expect(execution.id).toBe("exec-1");
      expect(execution.executedAt).toBeInstanceOf(Date);
      expect(execution.notification).not.toBeNull();
      expect(execution.notification?.id).toBe("notif-1");
      expect(execution.notification?.title).toBe("Test 1");
    });
  });
});
