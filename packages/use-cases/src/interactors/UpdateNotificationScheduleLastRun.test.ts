import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  UpdateNotificationScheduleLastRunUseCase,
  type UpdateNotificationScheduleLastRunInput,
} from "./UpdateNotificationScheduleLastRun";
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
    isCurrentlyActive: () => true,
    isExpired: () => false,
    isUpcoming: () => false,
    getFormattedTime: () => "09:00",
    ...overrides,
  }) as NotificationSchedule;

describe("[UNIT] UpdateNotificationScheduleLastRunUseCase", () => {
  let useCase: UpdateNotificationScheduleLastRunUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findById: mock(() => Promise.resolve(createMockSchedule())),
      updateLastRun: mock((id: string, lastRun: Date) =>
        Promise.resolve(createMockSchedule({ id, lastRun })),
      ),
    } as unknown as NotificationScheduleRepository;

    useCase = new UpdateNotificationScheduleLastRunUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should update lastRun timestamp", async () => {
      const newLastRun = new Date("2024-06-15T09:00:00");
      const input: UpdateNotificationScheduleLastRunInput = {
        id: "schedule-123",
        lastRun: newLastRun,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("schedule-123");
      }
    });

    it("should return error when schedule not found", async () => {
      mockRepository.findById = mock(() => Promise.resolve(null));

      const input: UpdateNotificationScheduleLastRunInput = {
        id: "nonexistent",
        lastRun: new Date(),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
    });

    it("should call updateLastRun with correct parameters", async () => {
      const lastRun = new Date("2024-06-15T10:30:00");
      const input: UpdateNotificationScheduleLastRunInput = {
        id: "schedule-456",
        lastRun,
      };

      await useCase.execute(input);

      expect(mockRepository.updateLastRun).toHaveBeenCalledWith(
        "schedule-456",
        lastRun,
      );
    });

    it("should call findById before updating", async () => {
      const input: UpdateNotificationScheduleLastRunInput = {
        id: "schedule-789",
        lastRun: new Date(),
      };

      await useCase.execute(input);

      expect(mockRepository.findById).toHaveBeenCalledWith("schedule-789");
    });

    it("should not call updateLastRun if schedule not found", async () => {
      mockRepository.findById = mock(() => Promise.resolve(null));

      const input: UpdateNotificationScheduleLastRunInput = {
        id: "nonexistent",
        lastRun: new Date(),
      };

      await useCase.execute(input);

      expect(mockRepository.updateLastRun).not.toHaveBeenCalled();
    });

    it("should return full schedule output", async () => {
      const updatedSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Updated Schedule",
        lastRun: new Date("2024-06-15T09:00:00"),
      });
      mockRepository.updateLastRun = mock(() =>
        Promise.resolve(updatedSchedule),
      );

      const input: UpdateNotificationScheduleLastRunInput = {
        id: "schedule-123",
        lastRun: new Date("2024-06-15T09:00:00"),
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("schedule-123");
        expect(result.value.name).toBe("Updated Schedule");
        expect(result.value.lastRun).toBeInstanceOf(Date);
      }
    });
  });
});
