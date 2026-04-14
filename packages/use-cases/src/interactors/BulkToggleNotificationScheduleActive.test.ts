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
          repo.bulkToggleActive(ids, isActive),
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
        exists: (id: string) => repo.exists(id),
        count: (filter?: any) => repo.count(filter),
        updateLastRun: (id: string, lastRun: Date) =>
          repo.updateLastRun(id, lastRun),
        toggleActive: (id: string) => repo.toggleActive(id),
        getExecutionHistory: (scheduleId: string, limit: number) =>
          repo.getExecutionHistory(scheduleId, limit),
        countExecutions: (scheduleId: string) =>
          repo.countExecutions(scheduleId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should activate multiple schedules", async () => {
      // Create schedules first
      Effect.runSync(repo.create(createMockSchedule("schedule-1", false)));
      Effect.runSync(repo.create(createMockSchedule("schedule-2", false)));
      Effect.runSync(repo.create(createMockSchedule("schedule-3", false)));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
        isActive: true,
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
    });

    it("should deactivate multiple schedules", async () => {
      Effect.runSync(repo.create(createMockSchedule("schedule-1", true)));
      Effect.runSync(repo.create(createMockSchedule("schedule-2", true)));

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
            repo.bulkToggleActive(ids, isActive),
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
          exists: (id: string) => repo.exists(id),
          count: (filter?: any) => repo.count(filter),
          updateLastRun: (id: string, lastRun: Date) =>
            repo.updateLastRun(id, lastRun),
          toggleActive: (id: string) => repo.toggleActive(id),
          getExecutionHistory: (scheduleId: string, limit: number) =>
            repo.getExecutionHistory(scheduleId, limit),
          countExecutions: (scheduleId: string) =>
            repo.countExecutions(scheduleId),
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
      Effect.runSync(repo.create(createMockSchedule("schedule-1", true)));
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
      Effect.runSync(repo.create(createMockSchedule("schedule-1", false)));

      const input: BulkToggleNotificationScheduleActiveInput = {
        ids: ["schedule-1"],
        isActive: true,
      };

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
    });
  });
});
