import { describe, it, expect, mock, beforeEach } from "bun:test";
import { NotificationController } from "../notification";
import type { NotificationRepository } from "@mirai-app/use-cases";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";

// Mock Notification
const createMockNotification = (
  overrides?: Partial<Notification>,
): Notification =>
  ({
    id: "notif-123",
    title: "Test Notification",
    body: "Test body",
    url: null,
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    tripId: "trip-123",
    createdById: "user-123",
    scheduledFor: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isSent: () => false,
    isScheduled: () => false,
    isReadyToSend: () => true,
    canTransitionTo: () => true,
    updateContent: function (props: unknown) {
      return { kind: "ok", value: { ...this, ...props } };
    },
    updatePriority: function (p: NotificationPriority) {
      return { ...this, priority: p };
    },
    updateStatus: function (s: NotificationStatus) {
      return { kind: "ok", value: { ...this, status: s } };
    },
    schedule: function (date: Date) {
      return { kind: "ok", value: { ...this, scheduledFor: date } };
    },
    unschedule: function () {
      return { ...this, scheduledFor: null };
    },
    ...overrides,
  }) as unknown as Notification;

describe("[UNIT] NotificationController", () => {
  let controller: NotificationController;
  let mockNotificationRepository: NotificationRepository;

  beforeEach(() => {
    mockNotificationRepository = {
      findById: mock(() => Promise.resolve(createMockNotification())),
      findByTripId: mock(() => Promise.resolve([createMockNotification()])),
      findAll: mock(() => Promise.resolve([createMockNotification()])),
      findByStatus: mock(() => Promise.resolve([createMockNotification()])),
      findByPriority: mock(() => Promise.resolve([createMockNotification()])),
      findReadyToSend: mock(() => Promise.resolve([createMockNotification()])),
      findOverdue: mock(() => Promise.resolve([])),
      create: mock((n: Notification) => Promise.resolve(n)),
      update: mock((n: Notification) => Promise.resolve(n)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
    } as unknown as NotificationRepository;

    controller = new NotificationController(mockNotificationRepository);
  });

  describe("getById", () => {
    it("should return notification by ID", async () => {
      const result = await controller.getById({ id: "notif-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("notif-123");
        expect(result.data.title).toBe("Test Notification");
      }
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "notif-123" });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid UUID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTripId", () => {
    it("should return notifications for trip", async () => {
      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("create", () => {
    it("should create notification with valid input", async () => {
      const input = {
        title: "New Notification",
        body: "New body",
        createdById: "user-123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New Notification");
        expect(result.data.status).toBe("DRAFT");
      }
    });

    it("should return error for empty title", async () => {
      const result = await controller.create({
        title: "",
        body: "Test body",
        createdById: "user-123",
      });

      expect(result.success).toBe(false);
    });

    it("should return error for empty body", async () => {
      const result = await controller.create({
        title: "Test",
        body: "",
        createdById: "user-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update notification", async () => {
      const input = {
        notificationId: "notif-123",
        title: "Updated Title",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.update({
        notificationId: "notif-123",
        title: "Updated",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateStatus", () => {
    it("should update notification status", async () => {
      const input = {
        notificationId: "notif-123",
        newStatus: "SENT",
      };

      const result = await controller.updateStatus(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.newStatus).toBe("SENT");
      }
    });

    it("should return error for invalid status transition", async () => {
      mockNotificationRepository.findById = mock(() =>
        Promise.resolve(
          createMockNotification({ canTransitionTo: () => false }),
        ),
      );

      const result = await controller.updateStatus({
        notificationId: "notif-123",
        newStatus: "SENT",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
    it("should return paginated list", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("listByStatus", () => {
    it("should return notifications by status", async () => {
      const result = await controller.listByStatus({
        status: "DRAFT",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("listByPriority", () => {
    it("should return notifications by priority", async () => {
      const result = await controller.listByPriority({
        priority: "HIGH",
        limit: 10,
        offset: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("findReadyToSend", () => {
    it("should return ready notifications", async () => {
      const result = await controller.findReadyToSend();

      expect(result.success).toBe(true);
    });
  });

  describe("findOverdue", () => {
    it("should return overdue notifications", async () => {
      const result = await controller.findOverdue();

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete notification", async () => {
      const result = await controller.delete({ id: "notif-123" });

      expect(result.success).toBe(true);
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.exists = mock(() => Promise.resolve(false));

      const result = await controller.delete({ id: "notif-123" });

      expect(result.success).toBe(false);
    });
  });
});
