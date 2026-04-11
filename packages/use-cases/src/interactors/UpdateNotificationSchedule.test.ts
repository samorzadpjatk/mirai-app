import { describe, it, expect, mock } from "bun:test";
import {
  UpdateNotificationScheduleUseCase,
  type UpdateNotificationScheduleInput,
} from "./UpdateNotificationSchedule";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

describe("[UNIT] UpdateNotificationScheduleUseCase", () => {
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
    countExecutions: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should update schedule successfully", async () => {
      const existingSchedule = createValidSchedule({
        id: "schedule-456",
        name: "Old Name",
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSchedule)),
        update: mock(() => Promise.resolve(existingSchedule)),
      });

      const useCase = new UpdateNotificationScheduleUseCase(mockRepo);
      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "New Name",
        notificationTitle: "Updated Title",
        notificationBody: "Updated Body",
        hour: 14,
        minute: 30,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.findById).toHaveBeenCalledWith("schedule-456");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should return error when schedule not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new UpdateNotificationScheduleUseCase(mockRepo);
      const input: UpdateNotificationScheduleInput = {
        id: "non-existent",
        name: "New Name",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should update schedule dates", async () => {
      const existingSchedule = createValidSchedule({ id: "schedule-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSchedule)),
        update: mock(() => Promise.resolve(existingSchedule)),
      });

      const useCase = new UpdateNotificationScheduleUseCase(mockRepo);
      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        startDate: getFutureDate(5),
        endDate: getFutureDate(60),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should activate/deactivate schedule", async () => {
      const existingSchedule = createValidSchedule({
        id: "schedule-456",
        isActive: true,
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSchedule)),
        update: mock(() => Promise.resolve(existingSchedule)),
      });

      const useCase = new UpdateNotificationScheduleUseCase(mockRepo);
      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        isActive: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const existingSchedule = createValidSchedule({ id: "schedule-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSchedule)),
        update: mock(() => Promise.reject(new Error("Update failed"))),
      });

      const useCase = new UpdateNotificationScheduleUseCase(mockRepo);
      const input: UpdateNotificationScheduleInput = {
        id: "schedule-456",
        name: "New Name",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Update failed");
    });
  });
});
