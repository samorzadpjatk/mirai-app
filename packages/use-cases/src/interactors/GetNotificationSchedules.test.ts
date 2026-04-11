import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetNotificationSchedulesUseCase,
  type GetNotificationSchedulesInput,
} from "./GetNotificationSchedules";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationSchedule, PaginatedResult } from "@mirai-app/domain";

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

describe("[UNIT] GetNotificationSchedulesUseCase", () => {
  let useCase: GetNotificationSchedulesUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: mock(() =>
        Promise.resolve({
          items: [],
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      ),
    } as unknown as NotificationScheduleRepository;

    useCase = new GetNotificationSchedulesUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should return empty list when no schedules", async () => {
      const input: GetNotificationSchedulesInput = {};

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedules).toEqual([]);
        expect(result.value.pagination.total).toBe(0);
      }
    });

    it("should return schedules with pagination", async () => {
      const mockSchedules = [
        createMockSchedule({ id: "schedule-1" }),
        createMockSchedule({ id: "schedule-2", name: "Another Schedule" }),
      ];

      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: mockSchedules,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedules).toHaveLength(2);
        expect(result.value.pagination.total).toBe(2);
      }
    });

    it("should pass filter to repository", async () => {
      const filter = { tripId: "trip-123", isActive: true };
      const input: GetNotificationSchedulesInput = { filter };

      await useCase.execute(input);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        filter,
      });
    });

    it("should pass pagination to repository", async () => {
      const pagination = { limit: 10, offset: 20 };
      const input: GetNotificationSchedulesInput = { pagination };

      await useCase.execute(input);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        pagination,
      });
    });

    it("should map schedule fields correctly", async () => {
      const mockSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Daily Reminder",
        tripId: "trip-456",
        notificationType: "challenge_reminder",
        notificationTitle: "Challenge Time!",
        notificationBody: "Don't forget to submit!",
        notificationUrl: "https://app.example.com/challenge",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
        hour: 14,
        minute: 30,
        isActive: true,
        createdById: "admin-123",
        lastRun: new Date("2024-06-15"),
      });

      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: [mockSchedule],
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const schedule = result.value.schedules[0];
        expect(schedule.id).toBe("schedule-123");
        expect(schedule.name).toBe("Daily Reminder");
        expect(schedule.tripId).toBe("trip-456");
        expect(schedule.notificationType).toBe("challenge_reminder");
        expect(schedule.notificationTitle).toBe("Challenge Time!");
        expect(schedule.notificationBody).toBe("Don't forget to submit!");
        expect(schedule.notificationUrl).toBe(
          "https://app.example.com/challenge",
        );
        expect(schedule.hour).toBe(14);
        expect(schedule.minute).toBe(30);
        expect(schedule.isActive).toBe(true);
        expect(schedule.createdById).toBe("admin-123");
        expect(schedule.formattedTime).toBe("09:00"); // from mock
      }
    });

    it("should calculate status flags based on current time", async () => {
      const now = new Date("2024-06-15");
      const mockSchedule = createMockSchedule({
        isCurrentlyActive: (d: Date) => true,
        isExpired: (d: Date) => false,
        isUpcoming: (d: Date) => false,
      });

      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: [mockSchedule],
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedules[0].isCurrentlyActive).toBe(true);
        expect(result.value.schedules[0].isExpired).toBe(false);
        expect(result.value.schedules[0].isUpcoming).toBe(false);
      }
    });

    it("should handle null tripId", async () => {
      const mockSchedule = createMockSchedule({
        tripId: null,
      });

      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: [mockSchedule],
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedules[0].tripId).toBeNull();
      }
    });

    it("should handle null lastRun", async () => {
      const mockSchedule = createMockSchedule({
        lastRun: null,
      });

      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: [mockSchedule],
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedules[0].lastRun).toBeNull();
      }
    });

    it("should handle hasMore pagination flag", async () => {
      mockRepository.findAll = mock(() =>
        Promise.resolve({
          items: [createMockSchedule()],
          pagination: {
            total: 100,
            limit: 20,
            offset: 0,
            hasMore: true,
          },
        } as PaginatedResult<NotificationSchedule>),
      );

      const input: GetNotificationSchedulesInput = {};
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.pagination.hasMore).toBe(true);
      }
    });
  });
});
