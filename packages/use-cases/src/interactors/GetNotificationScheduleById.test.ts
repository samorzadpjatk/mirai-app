import { describe, it, expect, mock } from "bun:test";
import {
  GetNotificationScheduleByIdUseCase,
  type GetNotificationScheduleByIdInput,
} from "./GetNotificationScheduleById";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] GetNotificationScheduleByIdUseCase", () => {
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
      isActive: boolean;
    }>,
  ): NotificationSchedule => {
    const result = NotificationSchedule.create({
      id: overrides?.id ?? "schedule-123",
      name: overrides?.name ?? "Test Schedule",
      tripId: null,
      notificationType: NotificationScheduleType.DAILY_REMINDER,
      notificationTitle: "Test Title",
      notificationBody: "Test Body",
      notificationUrl: null,
      startDate: getFutureDate(1),
      endDate: getFutureDate(30),
      hour: 9,
      minute: 0,
      isActive: overrides?.isActive ?? true,
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
    it("should return schedule when found", async () => {
      const mockSchedule = createValidSchedule({
        id: "schedule-456",
        name: "Morning Reminder",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSchedule)),
      });

      const useCase = new GetNotificationScheduleByIdUseCase(mockRepo);
      const input: GetNotificationScheduleByIdInput = {
        id: "schedule-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("schedule-456");
        expect(result.value.name).toBe("Morning Reminder");
        expect(result.value.isActive).toBe(true);
        expect(result.value.isCurrentlyActive).toBeDefined();
        expect(result.value.isExpired).toBeDefined();
        expect(result.value.isUpcoming).toBeDefined();
        expect(result.value.formattedTime).toBeDefined();
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("schedule-456");
    });

    it("should return error when schedule not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new GetNotificationScheduleByIdUseCase(mockRepo);
      const input: GetNotificationScheduleByIdInput = {
        id: "non-existent",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetNotificationScheduleByIdUseCase(mockRepo);
      const input: GetNotificationScheduleByIdInput = {
        id: "schedule-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
