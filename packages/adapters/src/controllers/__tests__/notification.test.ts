import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { NotificationController } from "../notification";
import type { NotificationRepository } from "@mirai-app/use-cases";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
  StateTransitionError,
} from "@mirai-app/domain";

// Valid UUIDs for testing
const TEST_NOTIFICATION_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_TRIP_ID = "550e8400-e29b-41d4-a716-446655440002";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440003";

// Mock Notification
const createMockNotification = (
  overrides?: Partial<Notification>,
): Notification => {
  // Create base mock to capture canTransitionTo in closure
  const baseMock = {
    id: TEST_NOTIFICATION_ID,
    title: "Test Notification",
    body: "Test body",
    url: null,
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    tripId: TEST_TRIP_ID,
    createdById: TEST_USER_ID,
    scheduledFor: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    isSent: () => false,
    isScheduled: () => false,
    isReadyToSend: () => true,
    isDraft: () => baseMock.status === NotificationStatus.DRAFT,
    isCancelled: () => baseMock.status === NotificationStatus.CANCELLED,
    canTransitionTo: () => true,
    updateContent: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Notification);
    },
    updatePriority: function (p: NotificationPriority) {
      return { ...this, priority: p };
    },
    updateStatus: function (s: NotificationStatus) {
      // Check if transition is valid using canTransitionTo
      const self = this as Notification & {
        canTransitionTo: (s: NotificationStatus) => boolean;
      };
      if (!self.canTransitionTo(s)) {
        return Effect.fail(
          new StateTransitionError(
            `Cannot transition from ${self.status} to ${s}`,
            { from: self.status, to: s },
          ),
        );
      }
      return Effect.succeed({ ...this, status: s } as Notification);
    },
    schedule: function (date: Date) {
      return Effect.succeed({ ...this, scheduledFor: date } as Notification);
    },
    unschedule: function () {
      return { ...this, scheduledFor: null };
    },
  };

  // Apply overrides
  const merged = { ...baseMock, ...overrides } as unknown as Notification;
  return merged;
};

describe("[UNIT] NotificationController", () => {
  let controller: NotificationController;
  let mockNotificationRepository: NotificationRepository;

  beforeEach(() => {
    mockNotificationRepository = {
      findById: mock(() => Effect.succeed(createMockNotification())),
      findByTripId: mock(() => Effect.succeed([createMockNotification()])),
      findAll: mock(() => Effect.succeed([createMockNotification()])),
      findByStatus: mock(() => Effect.succeed([createMockNotification()])),
      findByPriority: mock(() => Effect.succeed([createMockNotification()])),
      findReadyToSend: mock(() => Effect.succeed([createMockNotification()])),
      findOverdue: mock(() => Effect.succeed([])),
      create: mock((n: Notification) => Effect.succeed(n)),
      update: mock((n: Notification) => Effect.succeed(n)),
      delete: mock(() => Effect.succeed(void 0)),
      exists: mock(() => Effect.succeed(true)),
      findByTripIdAndStatus: mock(() =>
        Effect.succeed([createMockNotification()]),
      ),
      findByCreatedById: mock(() => Effect.succeed([createMockNotification()])),
      countByStatus: mock(() => Effect.succeed(1)),
      countPendingByTripId: mock(() => Effect.succeed(0)),
    } as unknown as NotificationRepository;

    controller = new NotificationController(mockNotificationRepository);
  });

  describe("getById", () => {
    it("should return notification by ID", async () => {
      const result = await controller.getById({ id: TEST_NOTIFICATION_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_NOTIFICATION_ID);
        expect(result.data.title).toBe("Test Notification");
      }
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TEST_NOTIFICATION_ID });

      expect(result.success).toBe(false);
    });

    it("should return error for invalid UUID", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });
  });

  describe("getByTripId", () => {
    it("should return notifications for trip", async () => {
      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

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
        createdById: TEST_USER_ID,
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
        createdById: TEST_USER_ID,
      });

      expect(result.success).toBe(false);
    });

    it("should return error for empty body", async () => {
      const result = await controller.create({
        title: "Test",
        body: "",
        createdById: TEST_USER_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update notification", async () => {
      const input = {
        notificationId: TEST_NOTIFICATION_ID,
        title: "Updated Title",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.update({
        notificationId: TEST_NOTIFICATION_ID,
        title: "Updated",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateStatus", () => {
    it("should update notification status", async () => {
      const input = {
        notificationId: TEST_NOTIFICATION_ID,
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
        Effect.succeed(
          createMockNotification({ canTransitionTo: () => false }),
        ),
      );

      const result = await controller.updateStatus({
        notificationId: TEST_NOTIFICATION_ID,
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
      const result = await controller.delete({ id: TEST_NOTIFICATION_ID });

      expect(result.success).toBe(true);
    });

    it("should return error when notification not found", async () => {
      mockNotificationRepository.exists = mock(() => Effect.succeed(false));

      const result = await controller.delete({ id: TEST_NOTIFICATION_ID });

      expect(result.success).toBe(false);
    });
  });
});
