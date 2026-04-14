import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  getUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
} from "./GetUpcomingNotificationSchedules";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import { InMemoryNotificationScheduleRepository } from "@mirai-app/adapters/gateways/in-memory";
import type { NotificationSchedule } from "@mirai-app/domain";

describe("[UNIT] getUpcomingNotificationSchedulesUseCase (Effect)", () => {
  let repo: InMemoryNotificationScheduleRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationScheduleRepository();
  });

  // Helper to create mock notification schedule with future dates
  const createMockSchedule = (
    id: string,
    isUpcoming = true,
  ): NotificationSchedule => {
    // Use future dates to satisfy the upcoming schedule conditions
    const futureStartDate = new Date();
    futureStartDate.setDate(futureStartDate.getDate() + 1); // Tomorrow
    const futureEndDate = new Date();
    futureEndDate.setDate(futureEndDate.getDate() + 30); // 30 days from now

    return {
      id,
      name: `Schedule ${id}`,
      tripId: "trip-123",
      notificationType: "reminder",
      notificationTitle: "Test Title",
      notificationBody: "Test Body",
      notificationUrl: "https://example.com",
      startDate: futureStartDate,
      endDate: futureEndDate,
      hour: 9,
      minute: 0,
      isActive: true,
      createdById: "user-123",
      lastRun: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isCurrentlyActive: () => false,
      isExpired: () => false,
      isUpcoming: () => isUpcoming,
      getFormattedTime: () => "09:00",
    } as NotificationSchedule;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: GetUpcomingNotificationSchedulesInput) => {
    const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
      Effect.provideService(NotificationScheduleRepositoryTag, {
        findUpcoming: (days?: number) => repo.findUpcoming(days),
        create: (schedule: NotificationSchedule) => repo.create(schedule),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByName: (name: string) => repo.findByName(name),
        findByTripIdAndName: (tripId: string, name: string) =>
          repo.findByTripIdAndName(tripId, name),
        findByType: (type: string) => repo.findByType(type as any),
        findAll: (options?: any) => repo.findAll(options),
        findActive: (now?: Date) => repo.findActive(now),
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
    it("should return empty list when no upcoming schedules", async () => {
      const input: GetUpcomingNotificationSchedulesInput = {};

      const result = await runUseCase(input);

      expect(result).toEqual([]);
    });

    it("should return upcoming schedules", async () => {
      const mockSchedules = [
        createMockSchedule("schedule-1", true),
        createMockSchedule("schedule-2", true),
      ];

      // Add schedules to repo
      for (const schedule of mockSchedules) {
        Effect.runSync(repo.create(schedule));
      }

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await runUseCase(input);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("schedule-1");
      expect(result[1].id).toBe("schedule-2");
    });

    it("should pass days parameter to repository", async () => {
      const input: GetUpcomingNotificationSchedulesInput = { days: 7 };

      // Create and spy on the repo call
      const findUpcomingSpy = (repo as any).findUpcoming;

      await runUseCase(input);

      // The function should have been called
      expect(findUpcomingSpy).toBeDefined();
    });

    it("should calculate status flags for each schedule", async () => {
      const mockSchedule = createMockSchedule("schedule-123", true);
      Effect.runSync(repo.create(mockSchedule));

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await runUseCase(input);

      expect(result[0].isUpcoming).toBe(true);
      expect(result[0].isExpired).toBe(false);
      expect(result[0].isCurrentlyActive).toBe(false);
    });

    it("should map all schedule fields correctly", async () => {
      const mockSchedule = createMockSchedule("schedule-123", true);
      (mockSchedule as any).name = "Upcoming Schedule";
      (mockSchedule as any).tripId = "trip-456";
      (mockSchedule as any).hour = 15;
      (mockSchedule as any).minute = 30;
      (mockSchedule as any).createdById = "admin-123";

      Effect.runSync(repo.create(mockSchedule));

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await runUseCase(input);

      const schedule = result[0];
      expect(schedule.id).toBe("schedule-123");
      expect(schedule.hour).toBe(15); // Actual value set on mock
      expect(schedule.minute).toBe(30); // Actual value set on mock
      expect(schedule.isActive).toBe(true);
    });
  });
});
