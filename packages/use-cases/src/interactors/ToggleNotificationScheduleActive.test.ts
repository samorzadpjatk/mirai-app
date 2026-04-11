import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  ToggleNotificationScheduleActiveUseCase,
  type ToggleNotificationScheduleActiveInput,
} from "./ToggleNotificationScheduleActive";
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
    updatedAt: new Date("2024-01-02"),
    isCurrentlyActive: (now: Date) => true,
    isExpired: (now: Date) => false,
    isUpcoming: (now: Date) => false,
    getFormattedTime: () => "09:00",
    ...overrides,
  }) as NotificationSchedule;

describe("[UNIT] ToggleNotificationScheduleActiveUseCase", () => {
  let useCase: ToggleNotificationScheduleActiveUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findById: mock(() => Promise.resolve(createMockSchedule())),
      toggleActive: mock(() =>
        Promise.resolve(createMockSchedule({ isActive: false })),
      ),
    } as unknown as NotificationScheduleRepository;

    useCase = new ToggleNotificationScheduleActiveUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should toggle schedule from active to inactive", async () => {
      const input: ToggleNotificationScheduleActiveInput = {
        id: "schedule-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("schedule-123");
        expect(result.value.isActive).toBe(false);
      }
    });

    it("should toggle schedule from inactive to active", async () => {
      mockRepository.findById = mock(() =>
        Promise.resolve(createMockSchedule({ isActive: false })),
      );
      mockRepository.toggleActive = mock(() =>
        Promise.resolve(createMockSchedule({ isActive: true })),
      );

      const input: ToggleNotificationScheduleActiveInput = {
        id: "schedule-123",
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(true);
      }
    });

    it("should return error when schedule not found", async () => {
      mockRepository.findById = mock(() => Promise.resolve(null));

      const input: ToggleNotificationScheduleActiveInput = {
        id: "nonexistent",
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
      expect(mockRepository.toggleActive).not.toHaveBeenCalled();
    });

    it("should call findById before toggle", async () => {
      const input: ToggleNotificationScheduleActiveInput = {
        id: "schedule-456",
      };

      await useCase.execute(input);

      expect(mockRepository.findById).toHaveBeenCalledWith("schedule-456");
      expect(mockRepository.toggleActive).toHaveBeenCalledWith("schedule-456");
    });

    it("should return updated schedule with correct fields", async () => {
      const toggledSchedule = createMockSchedule({
        id: "schedule-123",
        name: "Updated Schedule",
        isActive: false,
        updatedAt: new Date("2024-01-03"),
      });
      mockRepository.toggleActive = mock(() =>
        Promise.resolve(toggledSchedule),
      );

      const input: ToggleNotificationScheduleActiveInput = {
        id: "schedule-123",
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("schedule-123");
        expect(result.value.name).toBe("Updated Schedule");
        expect(result.value.isActive).toBe(false);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should calculate status flags based on current time", async () => {
      const toggledSchedule = createMockSchedule({
        isActive: false,
        isCurrentlyActive: (now: Date) => false,
        isExpired: (now: Date) => false,
        isUpcoming: (now: Date) => true,
      });
      mockRepository.toggleActive = mock(() =>
        Promise.resolve(toggledSchedule),
      );

      const input: ToggleNotificationScheduleActiveInput = {
        id: "schedule-123",
      };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isCurrentlyActive).toBe(false);
        expect(result.value.isExpired).toBe(false);
        expect(result.value.isUpcoming).toBe(true);
      }
    });
  });
});
