import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteNotificationUseCase,
  type DeleteNotificationInput,
  NotificationNotFoundError,
  NotificationAlreadySentError,
} from "./DeleteNotification";
import { Notification, NotificationStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import { InMemoryNotificationGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] deleteNotificationUseCase (Effect)", () => {
  let repo: InMemoryNotificationGateway;

  beforeEach(() => {
    repo = new InMemoryNotificationGateway();
  });

  // Helper to create and save a notification
  const createAndSaveNotification = async (
    status: NotificationStatus = NotificationStatus.DRAFT,
  ): Promise<Notification> => {
    const notification = await Effect.runPromise(
      Notification.create({
        title: "Test Notification",
        body: "Test body content",
        createdById: "admin-123",
        status,
      }),
    );
    return Effect.runSync(repo.create(notification));
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteNotificationInput) => {
    const program = deleteNotificationUseCase(input).pipe(
      Effect.provideService(NotificationRepositoryTag, {
        create: (notification: Notification) => repo.create(notification),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByStatus: (status: NotificationStatus) => repo.findByStatus(status),
        findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
          repo.findByTripIdAndStatus(tripId, status),
        findByPriority: (priority) => repo.findByPriority(priority),
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

  describe("[UNIT] execute", () => {
    it("should delete notification successfully", async () => {
      // Arrange
      const notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedNotificationId).toBe(notification.id);

      // Verify notification was deleted
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored).toBeNull();
    });

    it("should delete READY notification", async () => {
      // Arrange
      const notification = await createAndSaveNotification(
        NotificationStatus.READY,
      );
      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify notification was deleted
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored).toBeNull();
    });

    it("should fail when notification not found", async () => {
      const input: DeleteNotificationInput = {
        notificationId: "non-existent-id",
      };

      // Act
      const program = deleteNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority) => repo.findByPriority(priority),
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

    it("should fail when notification has already been sent", async () => {
      // Create and mark as sent
      let notification = await createAndSaveNotification(
        NotificationStatus.READY,
      );
      notification = await Effect.runPromise(notification.markAsSent());
      Effect.runSync(repo.update(notification));

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const program = deleteNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) => repo.create(notification),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: NotificationStatus) =>
            repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByPriority: (priority) => repo.findByPriority(priority),
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
        expect(either.left).toBeInstanceOf(NotificationAlreadySentError);
        expect(either.left.notificationId).toBe(notification.id);
      }

      // Verify notification was not deleted
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored).not.toBeNull();
    });

    it("should allow deletion of FAILED notification", async () => {
      // Create a FAILED notification
      let notification = await createAndSaveNotification(
        NotificationStatus.READY,
      );
      notification = await Effect.runPromise(
        notification.markAsFailed("Test failure"),
      );
      Effect.runSync(repo.update(notification));

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify notification was deleted
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored).toBeNull();
    });

    it("should allow deletion of CANCELLED notification", async () => {
      // Create a CANCELLED notification
      let notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      notification = await Effect.runPromise(notification.cancel());
      Effect.runSync(repo.update(notification));

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify notification was deleted
      const stored = Effect.runSync(repo.findById(notification.id));
      expect(stored).toBeNull();
    });
  });
});
