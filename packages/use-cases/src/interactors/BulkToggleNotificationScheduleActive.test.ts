import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  bulkToggleNotificationScheduleActiveUseCase,
  type BulkToggleNotificationScheduleActiveInput,
  BulkToggleValidationError,
} from "./BulkToggleNotificationScheduleActive";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";
import type { NotificationSchedule } from "@mirai-app/domain";

describe("[UNIT] bulkToggleNotificationScheduleActiveUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleRepository();
  });

  // Helper to create mock notification schedule
  const createMockSchedule = (
    id: string,
    isActive = true,
  ): NotificationSchedule =>
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
      isActive,
      createdById: "user-123",
      lastRun: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      isCurrentlyActive: () => isActive,
      isExpired: () => false,
      isUpcoming: () => false,
      getFormattedTime: () => "09:00",
    }) as NotificationSchedule;

  // Helper to run use case with repository
  const runUseCase = async (
    input: BulkToggleNotificationScheduleActiveInput,
  ) => {
    const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        bulkToggleActive: (ids: string[], isActive: boolean) =>
          Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
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
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        count: (filter?: any) => Effect.promise(() => repo.count(filter)),
        updateLastRun: (id: string, lastRun: Date) =>
          Effect.promise(() => repo.updateLastRun(id, lastRun)),
        toggleActive: (id: string) =>
          Effect.promise(() => repo.toggleActive(id)),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
        countExecutions: (scheduleId: string) =>
          Effect.promise(() => repo.countExecutions(scheduleId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should activate multiple schedules", async () => {
      // Create schedules first
      await repo.create(createMockSchedule("schedule-1", false));
      await repo.create(createMockSchedule("schedule-2", false));
      await repo.create(createMockSchedule("schedule-3", false));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: true,
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
    });

    it("should deactivate multiple schedules", async () => {
      await repo.create(createMockSchedule("schedule-1", true));
      await repo.create(createMockSchedule("schedule-2", true));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2"],
        isActive: false,
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });

    it("should fail when no IDs provided", async () => {
      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: [],
        isActive: true,
      };

      const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          bulkToggleActive: (ids: string[], isActive: boolean) =>
            Effect.promise(() => repo.bulkToggleActive(ids, isActive)),
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
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          count: (filter?: any) => Effect.promise(() => repo.count(filter)),
          updateLastRun: (id: string, lastRun: Date) =>
            Effect.promise(() => repo.updateLastRun(id, lastRun)),
          toggleActive: (id: string) =>
            Effect.promise(() => repo.toggleActive(id)),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            Effect.promise(() => repo.getExecutionHistory(scheduleId, limit)),
          countExecutions: (scheduleId: string) =>
            Effect.promise(() => repo.countExecutions(scheduleId)),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(BulkToggleValidationError);
        expect(either.left.message).toBe("At least one ID must be provided");
      }
    });

    it("should handle partial updates", async () => {
      await repo.create(createMockSchedule("schedule-1", true));
      // Don't create schedule-2 and schedule-3

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: false,
      };

      const result = await runUseCase(input);

      // Only 1 was actually updated (since only 1 existed)
      expect(result.success).toBe(true);
    });

    it("should handle single ID", async () => {
      await repo.create(createMockSchedule("schedule-1", false));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1"],
        isActive: true,
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
    });
  });
});
