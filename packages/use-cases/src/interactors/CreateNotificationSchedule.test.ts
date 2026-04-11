import { describe, it, expect, mock } from "bun:test";
import {
  CreateNotificationScheduleUseCase,
  type CreateNotificationScheduleInput,
} from "./CreateNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] CreateNotificationScheduleUseCase", () => {
  // Helper to get future dates
  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  const createValidSchedule = (
    overrides?: Partial<{
      id: string;
      name: string;
      tripId: string | null;
    }>,
  ): NotificationSchedule => {
    const result = NotificationSchedule.create({
      id: overrides?.id ?? "schedule-123",
      name: overrides?.name ?? "Test Schedule",
      tripId: overrides?.tripId ?? null,
      notificationType: NotificationScheduleType.DAILY_REMINDER,
      notificationTitle: "Test Title",
      notificationBody: "Test Body",
      notificationUrl: null,
      startDate: getFutureDate(1),
      endDate: getFutureDate(30),
      hour: 9,
      minute: 0,
      isActive: true,
      createdById: "user-123",
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test schedule: ${result.error}`);
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<NotificationScheduleRepository>,
  ): NotificationScheduleRepository => ({
    create: mock(() => Promise.resolve(createValidSchedule())),
    findById: mock(() => Promise.resolve(null)),
    findByTripId: mock(() => Promise.resolve([])),
    findByName: mock(() => Promise.resolve(null)),
    findByTripIdAndName: mock(() => Promise.resolve(null)),
    findByType: mock(() => Promise.resolve([])),
    findActive: mock(() => Promise.resolve([])),
    findUpcoming: mock(() => Promise.resolve([])),
    findExpired: mock(() => Promise.resolve([])),
    findByFilter: mock(() =>
      Promise.resolve({
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      }),
    ),
    update: mock(() => Promise.resolve(createValidSchedule())),
    delete: mock(() => Promise.resolve()),
    updateLastRun: mock(() => Promise.resolve(createValidSchedule())),
    toggleActive: mock(() => Promise.resolve(createValidSchedule())),
    duplicate: mock(() => Promise.resolve(createValidSchedule())),
    bulkDelete: mock(() => Promise.resolve()),
    bulkToggleActive: mock(() => Promise.resolve()),
    getExecutionHistory: mock(() => Promise.resolve([])),
    ...overrides,
  });

  describe("execute", () => {
    it("should create notification schedule successfully", async () => {
      const mockSchedule = createValidSchedule({
        id: "schedule-456",
        name: "Daily Reminder",
        tripId: "trip-123",
      });
      const mockRepo = createMockRepo({
        findByTripIdAndName: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockSchedule)),
      });

      const useCase = new CreateNotificationScheduleUseCase(mockRepo);
      const input: CreateNotificationScheduleInput = {
        name: "Daily Reminder",
        tripId: "trip-123",
        notificationType: NotificationScheduleType.DAILY_REMINDER,
        notificationTitle: "Good Morning!",
        notificationBody: "Start your day with this challenge",
        startDate: getFutureDate(1),
        endDate: getFutureDate(30),
        hour: 9,
        minute: 0,
        isActive: true,
        createdById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.findByTripIdAndName).toHaveBeenCalledWith(
        "trip-123",
        "Daily Reminder",
      );
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when schedule with same name exists for trip", async () => {
      const existingSchedule = createValidSchedule({
        id: "existing",
        name: "Daily Reminder",
        tripId: "trip-123",
      });
      const mockRepo = createMockRepo({
        findByTripIdAndName: mock(() => Promise.resolve(existingSchedule)),
      });

      const useCase = new CreateNotificationScheduleUseCase(mockRepo);
      const input: CreateNotificationScheduleInput = {
        name: "Daily Reminder",
        tripId: "trip-123",
        notificationType: NotificationScheduleType.DAILY_REMINDER,
        startDate: getFutureDate(1),
        endDate: getFutureDate(30),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("already exists");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findByTripIdAndName: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new CreateNotificationScheduleUseCase(mockRepo);
      const input: CreateNotificationScheduleInput = {
        name: "Test Schedule",
        tripId: "trip-123",
        notificationType: NotificationScheduleType.DAILY_REMINDER,
        startDate: getFutureDate(1),
        endDate: getFutureDate(30),
        hour: 9,
        minute: 0,
        createdById: "user-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
