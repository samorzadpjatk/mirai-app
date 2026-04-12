import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import {
  bulkDeleteNotificationSchedulesUseCase,
  type BulkDeleteNotificationSchedulesInput,
  BulkDeleteValidationError,
} from "./BulkDeleteNotificationSchedules";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";
import type { NotificationSchedule } from "@mirai-app/domain";

describe("[UNIT] bulkDeleteNotificationSchedulesUseCase (Effect)", () => {
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
  const runUseCase = async (input: BulkDeleteNotificationSchedulesInput) => {
    const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        deleteMany: (ids: string[]) =>
          Effect.promise(() => repo.deleteMany(ids)),
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
        count: (filter?: any) => Effect.promise(() => repo.count(filter)),
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
    it("should delete multiple schedules successfully", async () => {
      // Create schedules first
      const schedule1 = createMockSchedule("schedule-1");
      const schedule2 = createMockSchedule("schedule-2");
      await repo.create(schedule1);
      await repo.create(schedule2);

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.requestedCount).toBe(2);
      expect(result.deletedCount).toBe(2);
    });

    it("should fail when no IDs provided", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: [],
      };

      const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
        Effect.provideService(NotificationScheduleRepositoryTag, {
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          deleteMany: (ids: string[]) =>
            Effect.promise(() => repo.deleteMany(ids)),
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
          count: (filter?: any) => Effect.promise(() => repo.count(filter)),
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
        expect(either.left).toBeInstanceOf(BulkDeleteValidationError);
        expect(either.left.message).toBe("At least one ID must be provided");
      }
    });

    it("should identify not found IDs", async () => {
      // Create only one schedule
      const schedule1 = createMockSchedule("schedule-1");
      await repo.create(schedule1);

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
      };

      const result = await runUseCase(input);

      expect(result.notFoundIds).toContain("schedule-2");
      expect(result.deletedCount).toBe(1);
      expect(result.requestedCount).toBe(3);
    });

    it("should handle all IDs not found", async () => {
      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      const result = await runUseCase(input);

      expect(result.deletedCount).toBe(0);
      expect(result.notFoundIds).toEqual(["schedule-1", "schedule-2"]);
    });

    it("should delete only existing schedules", async () => {
      // Create only schedule-1
      const schedule1 = createMockSchedule("schedule-1");
      await repo.create(schedule1);

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1", "schedule-2"],
      };

      await runUseCase(input);

      // Verify only schedule-1 was deleted
      const remaining = await repo.findById("schedule-1");
      expect(remaining).toBeNull();
    });

    it("should handle single ID deletion", async () => {
      const schedule1 = createMockSchedule("schedule-1");
      await repo.create(schedule1);

      const input: BulkDeleteNotificationSchedulesInput = {
        ids: ["schedule-1"],
      };

      const result = await runUseCase(input);

      expect(result.deletedCount).toBe(1);
      expect(result.requestedCount).toBe(1);
      expect(result.notFoundIds).toBeUndefined();
    });
  });
});
