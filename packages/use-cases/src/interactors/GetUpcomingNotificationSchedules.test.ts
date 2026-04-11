import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetUpcomingNotificationSchedulesUseCase,
  type GetUpcomingNotificationSchedulesInput,
} from "./GetUpcomingNotificationSchedules";
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
    isCurrentlyActive: (now: Date) => false,
    isExpired: (now: Date) => false,
    isUpcoming: (now: Date) => true,
    getFormattedTime: () => "09:00",
    ...overrides,
  }) as NotificationSchedule;

describe("[UNIT] GetUpcomingNotificationSchedulesUseCase", () => {
  let useCase: GetUpcomingNotificationSchedulesUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findUpcoming: mock(() => Promise.resolve([])),
    } as unknown as NotificationScheduleRepository;

    useCase = new GetUpcomingNotificationSchedulesUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should return empty list when no upcoming schedules", async () => {
      const input: GetUpcomingNotificationSchedulesInput = {};

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toEqual([]);
      }
    });

    it("should return upcoming schedules", async () => {
      const mockSchedules = [
        createMockSchedule({ id: "schedule-1", name: "Upcoming 1" }),
        createMockSchedule({ id: "schedule-2", name: "Upcoming 2" }),
      ];

      mockRepository.findUpcoming = mock(() => Promise.resolve(mockSchedules));

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe("schedule-1");
        expect(result.value[1].id).toBe("schedule-2");
      }
    });

    it("should pass days parameter to repository", async () => {
      const input: GetUpcomingNotificationSchedulesInput = { days: 7 };

      await useCase.execute(input);

      expect(mockRepository.findUpcoming).toHaveBeenCalledWith(7);
    });

    it("should use undefined days when not provided", async () => {
      const input: GetUpcomingNotificationSchedulesInput = {};

      await useCase.execute(input);

      expect(mockRepository.findUpcoming).toHaveBeenCalledWith(undefined);
    });

    it("should calculate status flags for each schedule", async () => {
      const mockSchedule = createMockSchedule({
        isUpcoming: (now: Date) => true,
        isExpired: (now: Date) => false,
        isCurrentlyActive: (now: Date) => false,
      });

      mockRepository.findUpcoming = mock(() => Promise.resolve([mockSchedule]));

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value[0].isUpcoming).toBe(true);
        expect(result.value[0].isExpired).toBe(false);
        expect(result.value[0].isCurrentlyActive).toBe(false);
      }
    });

    it("should map all schedule fields correctly", async () => {
      const mockSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Upcoming Schedule",
        tripId: "trip-456",
        notificationType: "challenge_reminder",
        notificationTitle: "Reminder!",
        notificationBody: "Don't forget!",
        notificationUrl: "https://example.com/reminder",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
        hour: 15,
        minute: 30,
        isActive: true,
        createdById: "admin-123",
        lastRun: null,
        createdAt: new Date("2024-05-01"),
        updatedAt: new Date("2024-05-15"),
      });

      mockRepository.findUpcoming = mock(() => Promise.resolve([mockSchedule]));

      const input: GetUpcomingNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const schedule = result.value[0];
        expect(schedule.id).toBe("schedule-123");
        expect(schedule.name).toBe("Upcoming Schedule");
        expect(schedule.tripId).toBe("trip-456");
        expect(schedule.notificationType).toBe("challenge_reminder");
        expect(schedule.notificationTitle).toBe("Reminder!");
        expect(schedule.notificationBody).toBe("Don't forget!");
        expect(schedule.notificationUrl).toBe("https://example.com/reminder");
        expect(schedule.hour).toBe(15);
        expect(schedule.minute).toBe(30);
        expect(schedule.isActive).toBe(true);
        expect(schedule.createdById).toBe("admin-123");
        expect(schedule.formattedTime).toBe("09:00");
      }
    });
  });
});
