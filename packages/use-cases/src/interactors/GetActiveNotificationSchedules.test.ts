import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { getActiveNotificationSchedulesUseCase } from "./GetActiveNotificationSchedules";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";
import type { NotificationSchedule } from "@mirai-app/domain";

describe("[UNIT] getActiveNotificationSchedulesUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleGateway;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleGateway();
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
      notificationTitle: "Test Title",
      notificationBody: "Test Body",
      notificationUrl: "https://example.com",
      // Use dates that bracket the current time for "active" schedules
      startDate: new Date("2020-01-01"),
      endDate: new Date("2099-12-31"),
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
  const runUseCase = async () => {
    const program = getActiveNotificationSchedulesUseCase().pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findActive: (now?: Date) => repo.findActive(now),
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: string) => repo.findByType(type as any),
        findAll: (options?: any) => repo.findAll(options),
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
    it("should return empty list when no active schedules", async () => {
      const result = await runUseCase();

      expect(result).toEqual([]);
    });

    it("should return active schedules", async () => {
      const mockSchedules = [
        createMockSchedule("schedule-1", true),
        createMockSchedule("schedule-2", true),
      ];

      // Add schedules to repo
      for (const schedule of mockSchedules) {
        Effect.runSync(repo.create(schedule));
      }

      const result = await runUseCase();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("schedule-1");
      expect(result[1].id).toBe("schedule-2");
    });

    it("should calculate isCurrentlyActive as true", async () => {
      const mockSchedule = createMockSchedule("schedule-123", true);
      Effect.runSync(repo.create(mockSchedule));

      const result = await runUseCase();

      expect(result[0].isCurrentlyActive).toBe(true);
      expect(result[0].isExpired).toBe(false);
      expect(result[0].isUpcoming).toBe(false);
    });

    it("should map all schedule fields correctly", async () => {
      const mockSchedule = createMockSchedule("schedule-123", true);
      mockSchedule.name = "Active Schedule";
      mockSchedule.tripId = "trip-456";
      mockSchedule.notificationType = "daily_reminder";
      mockSchedule.notificationTitle = "Daily Reminder";
      mockSchedule.notificationBody = "Check in!";
      mockSchedule.notificationUrl = null;
      mockSchedule.hour = 10;
      mockSchedule.minute = 0;
      mockSchedule.createdById = "user-456";

      Effect.runSync(repo.create(mockSchedule));

      const result = await runUseCase();

      const schedule = result[0];
      expect(schedule.id).toBe("schedule-123");
      expect(schedule.name).toBe("Active Schedule");
      expect(schedule.tripId).toBe("trip-456");
      expect(schedule.notificationType).toBe("daily_reminder");
      expect(schedule.isActive).toBe(true);
      expect(schedule.createdById).toBe("user-456");
    });

    it("should handle schedule with null tripId", async () => {
      const mockSchedule = createMockSchedule("schedule-123", true);
      (mockSchedule as any).tripId = null;

      Effect.runSync(repo.create(mockSchedule));

      const result = await runUseCase();

      expect(result[0].tripId).toBeNull();
    });
  });
});
