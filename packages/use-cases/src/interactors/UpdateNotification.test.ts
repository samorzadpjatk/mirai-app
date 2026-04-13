import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateNotificationUseCase,
  type UpdateNotificationInput,
  NotificationNotFoundError,
  NotificationValidationError,
  NotificationStateError,
} from "./UpdateNotification";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import { InMemoryNotificationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateNotificationUseCase (Effect)", () => {
  let repo: InMemoryNotificationRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationRepository();
  });

  // Helper to create and save a notification
  const createAndSaveNotification = async (
    overrides?: Partial<{
      title: string;
      body: string;
      status: NotificationStatus;
      priority: NotificationPriority;
      tripId: string | null;
    }>,
  ): Promise<Notification> => {
    const notification = await Effect.runPromise(
      Notification.create({
        title: overrides?.title ?? "Original Title",
        body: overrides?.body ?? "Original body content",
        createdById: "admin-123",
        tripId: overrides?.tripId ?? null,
        status: overrides?.status ?? NotificationStatus.DRAFT,
        priority: overrides?.priority ?? NotificationPriority.NORMAL,
      }),
    );
    return Effect.runSync(repo.create(notification));
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateNotificationInput) => {
    const program = updateNotificationUseCase(input).pipe(
      Effect.provideService(NotificationRepositoryTag, {
        create: (notification: Notification) => repo.create(notification),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByStatus: (status: NotificationStatus) => repo.findByStatus(status),
        findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
          repo.findByTripIdAndStatus(tripId, status),
        findByPriority: (priority: NotificationPriority) =>
          repo.findByPriority(priority),
        findReadyToSend: () => repo.findReadyToSend(),
        findOverdue: () => repo.findOverdue(),
        findByCreatedById: (createdById: string) =>
          repo.findByCreatedById(createdById),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        update: (notification: Notification) => repo.update(notification),
        delete: (id: string) => repo.delete(id),
        exists: (id: string) => repo.exists(id),
        countByStatus: (status: NotificationStatus) =>
          repo.countByStatus(status),
        countPendingByTripId: (tripId: string) =>
          repo.countPendingByTripId(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should update notification title", async () => {
      // Arrange
      const notification = await createAndSaveNotification();
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        title: "Updated Title",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.title).toBe("Updated Title");
      expect(result.body).toBe("Original body content"); // Unchanged

      // Verify stored notification
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored?.title).toBe("Updated Title");
    });

    it("should update notification body", async () => {
      // Arrange
      const notification = await createAndSaveNotification();
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        body: "Updated body content",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.body).toBe("Updated body content");
      expect(result.title).toBe("Original Title"); // Unchanged
    });

    it("should update notification URL", async () => {
      // Arrange
      const notification = await createAndSaveNotification();
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        url: "https://example.com/updated",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.url).toBe("https://example.com/updated");
    });

    it("should update notification priority", async () => {
      // Arrange
      const notification = await createAndSaveNotification({
        priority: NotificationPriority.NORMAL,
      });
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        priority: NotificationPriority.HIGH,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.priority).toBe("HIGH");

      // Verify stored notification
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored?.priority).toBe(NotificationPriority.HIGH);
    });

    it("should update notification status from DRAFT to READY", async () => {
      // Arrange
      const notification = await createAndSaveNotification({
        status: NotificationStatus.DRAFT,
      });
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        status: NotificationStatus.READY,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("READY");

      // Verify stored notification
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored?.status).toBe(NotificationStatus.READY);
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const notification = await createAndSaveNotification();
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        title: "New Title",
        body: "New Body",
        priority: NotificationPriority.URGENT,
        status: NotificationStatus.READY,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.title).toBe("New Title");
      expect(result.body).toBe("New Body");
      expect(result.priority).toBe("URGENT");
      expect(result.status).toBe("READY");
    });

    it("should fail when notification not found", async () => {
      const input: UpdateNotificationInput = {
        notificationId: "non-existent-id",
        title: "New Title",
      };

      // Act
      const program = updateNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority: NotificationPriority) =>
            repo.findByPriority(priority),
          findReadyToSend: () => repo.findReadyToSend(),
          findOverdue: () => repo.findOverdue(),
          findByCreatedById: (createdById: string) =>
            repo.findByCreatedById(createdById),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (notification: Notification) => repo.update(notification),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByStatus: (status: NotificationStatus) =>
            repo.countByStatus(status),
          countPendingByTripId: (tripId: string) =>
            repo.countPendingByTripId(tripId),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationNotFoundError);
        expect(either.left.notificationId).toBe("non-existent-id");
      }
    });

    it("should fail when updating with empty title", async () => {
      const notification = await createAndSaveNotification();
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        title: "", // Empty title
      };

      // Act
      const program = updateNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority: NotificationPriority) =>
            repo.findByPriority(priority),
          findReadyToSend: () => repo.findReadyToSend(),
          findOverdue: () => repo.findOverdue(),
          findByCreatedById: (createdById: string) =>
            repo.findByCreatedById(createdById),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (notification: Notification) => repo.update(notification),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByStatus: (status: NotificationStatus) =>
            repo.countByStatus(status),
          countPendingByTripId: (tripId: string) =>
            repo.countPendingByTripId(tripId),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationValidationError);
      }

      // Verify notification was not changed
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored?.title).toBe("Original Title");
    });

    it("should fail when updating sent notification content", async () => {
      // Create and mark as sent
      let notification = await createAndSaveNotification({
        status: NotificationStatus.READY,
      });
      notification = await Effect.runPromise(notification.markAsSent());
      Effect.runSync(repo.update(notification));

      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        title: "New Title",
      };

      // Act
      const program = updateNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority: NotificationPriority) =>
            repo.findByPriority(priority),
          findReadyToSend: () => repo.findReadyToSend(),
          findOverdue: () => repo.findOverdue(),
          findByCreatedById: (createdById: string) =>
            repo.findByCreatedById(createdById),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (notification: Notification) => repo.update(notification),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByStatus: (status: NotificationStatus) =>
            repo.countByStatus(status),
          countPendingByTripId: (tripId: string) =>
            repo.countPendingByTripId(tripId),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationStateError);
      }
    });

    it("should fail with invalid status transition", async () => {
      const notification = await createAndSaveNotification({
        status: NotificationStatus.SENT,
      });

      // Try to transition from SENT to DRAFT (invalid)
      const input: UpdateNotificationInput = {
        notificationId: notification.id,
        status: NotificationStatus.DRAFT,
      };

      // Act
      const program = updateNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority: NotificationPriority) =>
            repo.findByPriority(priority),
          findReadyToSend: () => repo.findReadyToSend(),
          findOverdue: () => repo.findOverdue(),
          findByCreatedById: (createdById: string) =>
            repo.findByCreatedById(createdById),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (notification: Notification) => repo.update(notification),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByStatus: (status: NotificationStatus) =>
            repo.countByStatus(status),
          countPendingByTripId: (tripId: string) =>
            repo.countPendingByTripId(tripId),
        }),
      );

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationStateError);
      }
    });
  });
});
