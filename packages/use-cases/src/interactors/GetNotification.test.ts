import { describe, it, expect, mock } from "bun:test";
import { GetNotificationUseCase } from "./GetNotification";
import type { GetNotificationInput } from "./GetNotification";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@repo/domain";
import type { NotificationRepository } from "../ports/NotificationRepository";

describe("[UNIT] GetNotificationUseCase", () => {
  // Helper to create a valid notification
  const createValidNotification = (
    overrides?: Partial<{
      id: string;
      title: string;
      body: string;
      status: NotificationStatus;
      priority: NotificationPriority;
      tripId: string | null;
    }>,
  ): Notification => {
    const result = Notification.create({
      id: overrides?.id ?? "notification-123",
      title: overrides?.title ?? "Test Notification",
      body: overrides?.body ?? "This is a test notification body",
      createdById: "admin-123",
      tripId: overrides?.tripId ?? null,
      status: overrides?.status ?? NotificationStatus.DRAFT,
      priority: overrides?.priority ?? NotificationPriority.NORMAL,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create notification: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should return notification when found by ID", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-456",
        title: "Trip Reminder",
        body: "Don't forget to pack your bags!",
        status: NotificationStatus.READY,
        priority: NotificationPriority.HIGH,
      });

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(mockNotification)),
        findById: mock(() => Promise.resolve(mockNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-456",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("notification-456");
        expect(result.value.title).toBe("Trip Reminder");
        expect(result.value.body).toBe("Don't forget to pack your bags!");
        expect(result.value.status).toBe("READY");
        expect(result.value.priority).toBe("HIGH");
        expect(result.value.createdById).toBe("admin-123");
        expect(result.value.isReadyToSend).toBe(true);
        expect(result.value.isSent).toBe(false);
        expect(result.value.isScheduled).toBe(false);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("notification-456");
    });

    it("should return error when notification not found", async () => {
      // Arrange
      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve({} as Notification)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({} as Notification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByStatus: mock(() => Promise.resolve(0)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "non-existent-id",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("should return sent notification with correct isSent flag", async () => {
      // Arrange
      const draftNotification = createValidNotification({
        id: "notification-sent",
        title: "Sent Notification",
        status: NotificationStatus.READY,
      });
      const sentNotification = draftNotification.markAsSent();

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(draftNotification)),
        findById: mock(() => Promise.resolve(sentNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(sentNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-sent",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("SENT");
        expect(result.value.isSent).toBe(true);
        expect(result.value.isReadyToSend).toBe(false);
      }
    });

    it("should return notification with trip association", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-trip",
        title: "Trip Update",
        tripId: "trip-abc",
      });

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(mockNotification)),
        findById: mock(() => Promise.resolve(mockNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-trip",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.tripId).toBe("trip-abc");
      }
    });

    it("should return notification with URL", async () => {
      // Arrange
      const result = Notification.create({
        id: "notification-url",
        title: "Click Here",
        body: "Check out this link!",
        url: "https://example.com/trip/123",
        createdById: "admin-456",
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create notification: ${result.error}`);
      }
      const mockNotification = result.value;

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(mockNotification)),
        findById: mock(() => Promise.resolve(mockNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-url",
      };

      // Act
      const result2 = await useCase.execute(input);

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.url).toBe("https://example.com/trip/123");
      }
    });

    it("should return DRAFT notification correctly", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-draft",
        title: "Draft Notification",
        status: NotificationStatus.DRAFT,
      });

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(mockNotification)),
        findById: mock(() => Promise.resolve(mockNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-draft",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("DRAFT");
        expect(result.value.isSent).toBe(false);
        expect(result.value.isReadyToSend).toBe(false);
      }
    });

    it("should return URGENT priority notification correctly", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-urgent",
        title: "URGENT: Action Required",
        priority: NotificationPriority.URGENT,
      });

      const mockRepo: NotificationRepository = {
        create: mock(() => Promise.resolve(mockNotification)),
        findById: mock(() => Promise.resolve(mockNotification)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByPriority: mock(() => Promise.resolve([])),
        findReadyToSend: mock(() => Promise.resolve([])),
        findOverdue: mock(() => Promise.resolve([])),
        findByCreatedById: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockNotification)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByStatus: mock(() => Promise.resolve(1)),
        countPendingByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new GetNotificationUseCase(mockRepo);
      const input: GetNotificationInput = {
        notificationId: "notification-urgent",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.priority).toBe("URGENT");
      }
    });
  });
});
