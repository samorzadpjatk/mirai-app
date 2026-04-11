import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  DuplicateNotificationScheduleUseCase,
  type DuplicateNotificationScheduleInput,
} from "./DuplicateNotificationSchedule";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationSchedule } from "@mirai-app/domain";

// Mock NotificationSchedule domain object
const createMockSchedule = (
  overrides?: Partial<NotificationSchedule>,
): NotificationSchedule =>
  ({
    id: "schedule-123",
    name: "Original Schedule",
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
    duplicate: function () {
      return {
        kind: "ok",
        value: {
          ...this,
          id: "schedule-new",
          name: "Copy of Original Schedule",
          createdById: "user-456",
        },
      };
    },
    isCurrentlyActive: () => true,
    isExpired: () => false,
    isUpcoming: () => false,
    getFormattedTime: () => "09:00",
    ...overrides,
  }) as unknown as NotificationSchedule;

describe("[UNIT] DuplicateNotificationScheduleUseCase", () => {
  let useCase: DuplicateNotificationScheduleUseCase;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findById: mock(() => Promise.resolve(createMockSchedule())),
      create: mock((schedule: NotificationSchedule) =>
        Promise.resolve(schedule),
      ),
    } as unknown as NotificationScheduleRepository;

    useCase = new DuplicateNotificationScheduleUseCase(mockRepository);
  });

  describe("execute", () => {
    it("should duplicate a schedule with default options", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.schedule).toBeDefined();
      }
    });

    it("should return error when original schedule not found", async () => {
      mockRepository.findById = mock(() => Promise.resolve(null));

      const input: DuplicateNotificationScheduleInput = {
        id: "nonexistent",
        newCreatedById: "user-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification schedule not found");
      }
    });

    it("should duplicate with custom name", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        name: "My Custom Name",
        newCreatedById: "user-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
    });

    it("should duplicate with custom dates", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
        newCreatedById: "user-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
    });

    it("should persist duplicated schedule", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-456",
      };

      await useCase.execute(input);

      expect(mockRepository.create).toHaveBeenCalled();
    });

    it("should call findById with correct id", async () => {
      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-456",
        newCreatedById: "user-789",
      };

      await useCase.execute(input);

      expect(mockRepository.findById).toHaveBeenCalledWith("schedule-456");
    });

    it("should pass newCreatedById to duplicate method", async () => {
      const mockSchedule = createMockSchedule({
        duplicate: function (props: { newCreatedById: string }) {
          return {
            kind: "ok",
            value: { ...this, createdById: props.newCreatedById },
          };
        },
      });
      mockRepository.findById = mock(() => Promise.resolve(mockSchedule));

      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-new",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
    });

    it("should return error when duplicate fails", async () => {
      const mockSchedule = createMockSchedule({
        duplicate: function () {
          return { kind: "err", error: "Invalid schedule data" };
        },
      });
      mockRepository.findById = mock(() => Promise.resolve(mockSchedule));

      const input: DuplicateNotificationScheduleInput = {
        id: "schedule-123",
        newCreatedById: "user-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Invalid schedule data");
      }
    });
  });
});
