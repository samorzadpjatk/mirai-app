import { describe, it, expect, mock } from "bun:test";
import { Effect, Either } from "effect";
import {
  getNotificationUseCase,
  NotificationNotFoundError,
} from "./GetNotification";
import type { GetNotificationInput } from "./GetNotification";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";

describe("[UNIT] getNotificationUseCase (Effect)", () => {
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

  const createMockRepo = (overrides?: {
    findById?: () => Effect.Effect<Notification | null, never, never>;
  }) => ({
    create: () => Effect.succeed(createValidNotification()),
    findById: overrides?.findById ?? (() => Effect.succeed(null)),
    findByTripId: () => Effect.succeed([]),
    findByStatus: () => Effect.succeed([]),
    findByTripIdAndStatus: () => Effect.succeed([]),
    findByPriority: () => Effect.succeed([]),
    findReadyToSend: () => Effect.succeed([]),
    findOverdue: () => Effect.succeed([]),
    findByCreatedById: () => Effect.succeed([]),
    findAll: () => Effect.succeed([]),
    update: () => Effect.succeed(createValidNotification()),
    delete: () => Effect.succeed(void 0),
    exists: () => Effect.succeed(true),
    countByStatus: () => Effect.succeed(1),
    countPendingByTripId: () => Effect.succeed(0),
  });

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

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockNotification),
      });

      const input: GetNotificationInput = {
        notificationId: "notification-456",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.id).toBe("notification-456");
      expect(result.title).toBe("Trip Reminder");
      expect(result.body).toBe("Don't forget to pack your bags!");
      expect(result.status).toBe("READY");
      expect(result.priority).toBe("HIGH");
      expect(result.createdById).toBe("admin-123");
      expect(result.isReadyToSend).toBe(true);
      expect(result.isSent).toBe(false);
      expect(result.isScheduled).toBe(false);
    });

    it("should return error when notification not found", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(null),
      });

      const input: GetNotificationInput = {
        notificationId: "non-existent-id",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationNotFoundError);
      }
    });

    it("should return sent notification with correct isSent flag", async () => {
      // Arrange
      const draftNotification = createValidNotification({
        id: "notification-sent",
        title: "Sent Notification",
        status: NotificationStatus.READY,
      });
      const markResult = draftNotification.markAsSent();
      if (markResult.kind === "err") {
        throw new Error("Failed to mark notification as sent");
      }
      const sentNotification = markResult.value;

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(sentNotification),
      });

      const input: GetNotificationInput = {
        notificationId: "notification-sent",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.status).toBe("SENT");
      expect(result.isSent).toBe(true);
      expect(result.isReadyToSend).toBe(false);
    });

    it("should return notification with trip association", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-trip",
        title: "Trip Update",
        tripId: "trip-abc",
      });

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockNotification),
      });

      const input: GetNotificationInput = {
        notificationId: "notification-trip",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.tripId).toBe("trip-abc");
    });

    it("should return DRAFT notification correctly", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-draft",
        title: "Draft Notification",
        status: NotificationStatus.DRAFT,
      });

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockNotification),
      });

      const input: GetNotificationInput = {
        notificationId: "notification-draft",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.status).toBe("DRAFT");
      expect(result.isSent).toBe(false);
      expect(result.isReadyToSend).toBe(false);
    });

    it("should return URGENT priority notification correctly", async () => {
      // Arrange
      const mockNotification = createValidNotification({
        id: "notification-urgent",
        title: "URGENT: Action Required",
        priority: NotificationPriority.URGENT,
      });

      const mockRepo = createMockRepo({
        findById: () => Effect.succeed(mockNotification),
      });

      const input: GetNotificationInput = {
        notificationId: "notification-urgent",
      };

      const program = getNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, mockRepo),
      );

      // Act
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.priority).toBe("URGENT");
    });
  });
});
