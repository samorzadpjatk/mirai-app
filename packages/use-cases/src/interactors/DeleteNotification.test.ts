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
import { InMemoryNotificationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteNotificationUseCase (Effect)", () => {
  let repo: InMemoryNotificationRepository;

  beforeEach(() => {
    repo = new InMemoryNotificationRepository();
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
    return await repo.create(notification);
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteNotificationInput) => {
    const program = deleteNotificationUseCase(input).pipe(
      Effect.provideService(NotificationRepositoryTag, {
        create: (notification: Notification) =>
          Effect.promise(() => repo.create(notification)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByStatus: (status: NotificationStatus) =>
          Effect.promise(() => repo.findByStatus(status)),
        findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
          Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
        findByPriority: (priority) =>
          Effect.promise(() => repo.findByPriority(priority)),
        findReadyToSend: () => Effect.promise(() => repo.findReadyToSend()),
        findOverdue: () => Effect.promise(() => repo.findOverdue()),
        findByCreatedById: (createdById: string) =>
          Effect.promise(() => repo.findByCreatedById(createdById)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (notification: Notification) =>
          Effect.promise(() => repo.update(notification)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        countByStatus: (status: NotificationStatus) =>
          Effect.promise(() => repo.countByStatus(status)),
        countPendingByTripId: (tripId: string) =>
          Effect.promise(() => repo.countPendingByTripId(tripId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
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
      const stored = await repo.findById(notification.id);
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
      const stored = await repo.findById(notification.id);
      expect(stored).toBeNull();
    });

    it("should fail when notification not found", async () => {
      const input: DeleteNotificationInput = {
        notificationId: "non-existent-id",
      };

      // Act
      const program = deleteNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) =>
            Effect.promise(() => repo.create(notification)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: NotificationStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByPriority: (priority) =>
            Effect.promise(() => repo.findByPriority(priority)),
          findReadyToSend: () => Effect.promise(() => repo.findReadyToSend()),
          findOverdue: () => Effect.promise(() => repo.findOverdue()),
          findByCreatedById: (createdById: string) =>
            Effect.promise(() => repo.findByCreatedById(createdById)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (notification: Notification) =>
            Effect.promise(() => repo.update(notification)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByStatus: (status: NotificationStatus) =>
            Effect.promise(() => repo.countByStatus(status)),
          countPendingByTripId: (tripId: string) =>
            Effect.promise(() => repo.countPendingByTripId(tripId)),
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
      await repo.update(notification);

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const program = deleteNotificationUseCase(input).pipe(
        Effect.provideService(NotificationRepositoryTag, {
          create: (notification: Notification) =>
            Effect.promise(() => repo.create(notification)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: NotificationStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: NotificationStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByPriority: (priority) =>
            Effect.promise(() => repo.findByPriority(priority)),
          findReadyToSend: () => Effect.promise(() => repo.findReadyToSend()),
          findOverdue: () => Effect.promise(() => repo.findOverdue()),
          findByCreatedById: (createdById: string) =>
            Effect.promise(() => repo.findByCreatedById(createdById)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (notification: Notification) =>
            Effect.promise(() => repo.update(notification)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByStatus: (status: NotificationStatus) =>
            Effect.promise(() => repo.countByStatus(status)),
          countPendingByTripId: (tripId: string) =>
            Effect.promise(() => repo.countPendingByTripId(tripId)),
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
      const stored = await repo.findById(notification.id);
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
      await repo.update(notification);

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify notification was deleted
      const stored = await repo.findById(notification.id);
      expect(stored).toBeNull();
    });

    it("should allow deletion of CANCELLED notification", async () => {
      // Create a CANCELLED notification
      let notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      notification = await Effect.runPromise(notification.cancel());
      await repo.update(notification);

      const input: DeleteNotificationInput = {
        notificationId: notification.id,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);

      // Verify notification was deleted
      const stored = await repo.findById(notification.id);
      expect(stored).toBeNull();
    });
  });
});
