import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetActiveNotificationSchedulesUseCase } from "./GetActiveNotificationSchedules";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationSchedule } from "@mirai-app/domain";

// Mock NotificationSchedule domain object
const createMockSchedule = (
  overrides?: Partial<NotificationSchedule>,
): NotificationSchedule =>
  ({
    id: "schedule-123",
    name: "Test Schedule",
    tripId: "trip-123",
    notificationType: "reminder",
    notificationTitle: "Test Title",
    notificationBody: "Test Body",
    notificationUrl: "https://example.com",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    hour: 9,
    minute: 0,
    isActive: true,
    createdById: "user-123",
    lastRun: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isCurrentlyActive: (now: Date) => true,
    isExpired: (now: Date) => false,
    isUpcoming: (now: Date) => false,
    getFormattedTime: () => "09:00",
    ...overrides,
  }) as NotificationSchedule;

describe("[UNIT] GetActiveNotificationSchedulesUseCase", () => {
  let useCase: GetActiveNotificationSchedulesUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findActive: mock(() => Promise.resolve([])),
    } as unknown as NotificationScheduleRepository;

    useCase = new GetActiveNotificationSchedulesUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should return empty list when no active schedules", async () => {
      const result = await useCase.execute();

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toEqual([]);
      }
    });

    it("should return active schedules", async () => {
      const mockSchedules = [
        createMockSchedule({ id: "schedule-1", name: "Active 1" }),
        createMockSchedule({ id: "schedule-2", name: "Active 2" }),
      ];

      mockRepository.findActive = mock(() => Promise.resolve(mockSchedules));

      const result = await useCase.execute();

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe("schedule-1");
        expect(result.value[1].id).toBe("schedule-2");
      }
    });

    it("should calculate isCurrentlyActive as true", async () => {
      const mockSchedule = createMockSchedule({
        isCurrentlyActive: (now: Date) => true,
        isExpired: (now: Date) => false,
        isUpcoming: (now: Date) => false,
      });

      mockRepository.findActive = mock(() => Promise.resolve([mockSchedule]));

      const result = await useCase.execute();

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value[0].isCurrentlyActive).toBe(true);
        expect(result.value[0].isExpired).toBe(false);
        expect(result.value[0].isUpcoming).toBe(false);
      }
    });

    it("should map all schedule fields correctly", async () => {
      const mockSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Active Schedule",
        tripId: "trip-456",
        notificationType: "daily_reminder",
        notificationTitle: "Daily Reminder",
        notificationBody: "Check in!",
        notificationUrl: null,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
        hour: 10,
        minute: 0,
        isActive: true,
        createdById: "user-456",
      });

      mockRepository.findActive = mock(() => Promise.resolve([mockSchedule]));

      const result = await useCase.execute();

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const schedule = result.value[0];
        expect(schedule.id).toBe("schedule-123");
        expect(schedule.name).toBe("Active Schedule");
        expect(schedule.tripId).toBe("trip-456");
        expect(schedule.notificationType).toBe("daily_reminder");
        expect(schedule.notificationTitle).toBe("Daily Reminder");
        expect(schedule.notificationBody).toBe("Check in!");
        expect(schedule.notificationUrl).toBeNull();
        expect(schedule.hour).toBe(10);
        expect(schedule.minute).toBe(0);
        expect(schedule.isActive).toBe(true);
        expect(schedule.createdById).toBe("user-456");
      }
    });

    it("should handle schedule with null tripId", async () => {
      const mockSchedule = createMockSchedule({
        tripId: null,
      });

      mockRepository.findActive = mock(() => Promise.resolve([mockSchedule]));

      const result = await useCase.execute();

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value[0].tripId).toBeNull();
      }
    });

    it("should call findActive without parameters", async () => {
      await useCase.execute();

      expect(mockRepository.findActive).toHaveBeenCalledWith();
    });
  });
});
