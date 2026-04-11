import { describe, it, expect, mock, beforeEach } from "bun:test";
import { NotificationScheduleController } from "../notification-schedule";
import type { NotificationScheduleRepository } from "@mirai-app/use-cases";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";

// Mock NotificationSchedule
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
    notificationUrl: null,
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
    duplicate: function () {
      return { kind: "ok", value: { ...this, id: "new-id" } };
    },
    ...overrides,
  }) as unknown as NotificationSchedule;

describe("[UNIT] NotificationScheduleController", () => {
  let controller: NotificationScheduleController;
  let mockRepository: NotificationScheduleRepository;

  beforeEach(() => {
    mockRepository = {
      findAll: mock(() =>
        Promise.resolve({
          items: [createMockSchedule()],
          pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
        }),
      ),
      findById: mock(() => Promise.resolve(createMockSchedule())),
      findActive: mock(() => Promise.resolve([createMockSchedule()])),
      findUpcoming: mock(() => Promise.resolve([createMockSchedule()])),
      create: mock((s: NotificationSchedule) => Promise.resolve(s)),
      update: mock((s: NotificationSchedule) => Promise.resolve(s)),
      delete: mock(() => Promise.resolve()),
      deleteMany: mock(() => Promise.resolve(1)),
      toggleActive: mock((id: string) => Promise.resolve(createMockSchedule())),
      bulkToggleActive: mock(() => Promise.resolve(2)),
      updateLastRun: mock((id: string, lastRun: Date) =>
        Promise.resolve(createMockSchedule()),
      ),
      getExecutionHistory: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(1)),
      exists: mock(() => Promise.resolve(true)),
    } as unknown as NotificationScheduleRepository;

    controller = new NotificationScheduleController(mockRepository);
  });

  describe("getAll", () => {
    it("should return schedules with pagination", async () => {
      const result = await controller.getAll({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
      }
    });

    it("should support filtering", async () => {
      const result = await controller.getAll({
        filter: { tripId: "trip-123", isActive: true },
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return schedule by ID", async () => {
      const result = await controller.getById({ id: "schedule-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("schedule-123");
      }
    });

    it("should return error for invalid ID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });
  });

  describe("create", () => {
    it("should create schedule with valid input", async () => {
      const input = {
        name: "New Schedule",
        notificationType: NotificationScheduleType.REMINDER,
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-06-30"),
        hour: 10,
        minute: 30,
        createdById: "user-123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Schedule");
      }
    });

    it("should return error for invalid hour", async () => {
      const result = await controller.create({
        name: "Test",
        notificationType: NotificationScheduleType.REMINDER,
        startDate: new Date(),
        endDate: new Date(),
        hour: 25, // Invalid
        minute: 0,
        createdById: "user-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update schedule", async () => {
      const input = {
        id: "schedule-123",
        name: "Updated Schedule",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete schedule", async () => {
      const result = await controller.delete({ id: "schedule-123" });

      expect(result.success).toBe(true);
    });
  });

  describe("bulkDelete", () => {
    it("should delete multiple schedules", async () => {
      const input = {
        ids: ["schedule-1", "schedule-2", "schedule-3"],
      };

      const result = await controller.bulkDelete(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deletedCount).toBe(1);
      }
    });
  });

  describe("toggleActive", () => {
    it("should toggle schedule active status", async () => {
      const result = await controller.toggleActive({ id: "schedule-123" });

      expect(result.success).toBe(true);
    });
  });

  describe("bulkToggleActive", () => {
    it("should toggle multiple schedules", async () => {
      const input = {
        ids: ["schedule-1", "schedule-2"],
        isActive: true,
      };

      const result = await controller.bulkToggleActive(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(2);
      }
    });
  });

  describe("duplicate", () => {
    it("should duplicate schedule", async () => {
      const input = {
        id: "schedule-123",
        newCreatedById: "user-456",
      };

      const result = await controller.duplicate(input);

      expect(result.success).toBe(true);
    });
  });

  describe("getActive", () => {
    it("should return active schedules", async () => {
      const result = await controller.getActive();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.schedules).toHaveLength(1);
      }
    });
  });

  describe("getUpcoming", () => {
    it("should return upcoming schedules", async () => {
      const result = await controller.getUpcoming({ days: 7 });

      expect(result.success).toBe(true);
    });
  });
});
