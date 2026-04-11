import { describe, it, expect, mock } from "bun:test";
import {
  DeleteNotificationScheduleUseCase,
  type DeleteNotificationScheduleInput,
} from "./DeleteNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] DeleteNotificationScheduleUseCase", () => {
  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  const createValidSchedule = (
    overrides?: Partial<{
      id: string;
      name: string;
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
    countExecutions: mock(() => Promise.resolve(5)),
    ...overrides,
  });

  describe("execute", () => {
    it("should delete schedule successfully", async () => {
      const mockSchedule = createValidSchedule({
        id: "schedule-456",
        name: "Daily Reminder",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSchedule)),
        countExecutions: mock(() => Promise.resolve(3)),
        delete: mock(() => Promise.resolve()),
      });

      const useCase = new DeleteNotificationScheduleUseCase(mockRepo);
      const input: DeleteNotificationScheduleInput = {
        id: "schedule-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.success).toBe(true);
        expect(result.value.deletedExecutionCount).toBe(3);
        expect(result.value.message).toContain("Daily Reminder");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("schedule-456");
      expect(mockRepo.countExecutions).toHaveBeenCalledWith("schedule-456");
      expect(mockRepo.delete).toHaveBeenCalledWith("schedule-456");
    });

    it("should return error when schedule not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new DeleteNotificationScheduleUseCase(mockRepo);
      const input: DeleteNotificationScheduleInput = {
        id: "non-existent",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const mockSchedule = createValidSchedule({ id: "schedule-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSchedule)),
        countExecutions: mock(() => Promise.reject(new Error("Count failed"))),
      });

      const useCase = new DeleteNotificationScheduleUseCase(mockRepo);
      const input: DeleteNotificationScheduleInput = {
        id: "schedule-456",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Count failed");
    });
  });
});
