import { describe, it, expect, beforeEach } from "bun:test";
import {
  scheduleNotificationUseCase,
  type ScheduleNotificationInput,
  NotificationNotFoundError,
  NotificationValidationError,
  NotificationStateError,
} from "./ScheduleNotification";
import { Notification, NotificationStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import { InMemoryNotificationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] scheduleNotificationUseCase (Effect)", () => {
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
  const runUseCase = async (input: ScheduleNotificationInput) => {
    const program = scheduleNotificationUseCase(input).pipe(
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
    it("should schedule notification successfully", async () => {
      // Arrange
      const notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      const scheduledFor = new Date(Date.now() + 3600000); // 1 hour from now
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe(notification.id);
      expect(result.scheduledFor).toEqual(scheduledFor);
      expect(result.status).toBe("READY"); // Status should transition to READY

      // Verify stored notification
      const stored = await repo.findById(notification.id);
      expect(stored?.scheduledFor).toEqual(scheduledFor);
      expect(stored?.status).toBe(NotificationStatus.READY);
    });

    it("should schedule notification from DRAFT to READY", async () => {
      // Arrange
      const notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      expect(notification.status).toBe(NotificationStatus.DRAFT);

      const scheduledFor = new Date(Date.now() + 7200000); // 2 hours from now
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("READY");
      expect(result.scheduledFor).toEqual(scheduledFor);

      // Verify stored notification
      const stored = await repo.findById(notification.id);
      expect(stored?.status).toBe(NotificationStatus.READY);
    });

    it("should reschedule already READY notification", async () => {
      // Arrange
      let notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      notification = await Effect.runPromise(
        notification.schedule(new Date(Date.now() + 3600000)),
      );
      notification = await Effect.runPromise(
        notification.updateStatus(NotificationStatus.READY),
      );
      await repo.update(notification);

      const newScheduledFor = new Date(Date.now() + 7200000); // 2 hours from now
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor: newScheduledFor,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.scheduledFor).toEqual(newScheduledFor);
      expect(result.status).toBe("READY");
    });

    it("should fail when notification not found", async () => {
      const scheduledFor = new Date(Date.now() + 3600000);
      const input: ScheduleNotificationInput = {
        notificationId: "non-existent-id",
        scheduledFor,
      };

      // Act
      const program = scheduleNotificationUseCase(input).pipe(
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

      const scheduledFor = new Date(Date.now() + 3600000);
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const program = scheduleNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationStateError);
        expect(either.left.message).toContain("already been sent");
      }
    });

    it("should fail when notification has been cancelled", async () => {
      // Create and cancel
      let notification = await createAndSaveNotification(
        NotificationStatus.DRAFT,
      );
      notification = await Effect.runPromise(notification.cancel());
      await repo.update(notification);

      const scheduledFor = new Date(Date.now() + 3600000);
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const program = scheduleNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationStateError);
        expect(either.left.message).toContain("cancelled");
      }
    });

    it("should fail when scheduled time is in the past", async () => {
      const notification = await createAndSaveNotification();
      const scheduledFor = new Date(Date.now() - 3600000); // 1 hour ago
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const program = scheduleNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationValidationError);
        expect(either.left.message).toContain("future");
      }

      // Verify notification was not changed
      const stored = await repo.findById(notification.id);
      expect(stored?.status).toBe(NotificationStatus.DRAFT);
      expect(stored?.scheduledFor).toBeNull();
    });

    it("should fail when scheduled time is now", async () => {
      const notification = await createAndSaveNotification();
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor: new Date(), // Now
      };

      // Act
      const program = scheduleNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationValidationError);
      }
    });

    it("should allow scheduling FAILED notification", async () => {
      // Create a FAILED notification
      let notification = await createAndSaveNotification(
        NotificationStatus.READY,
      );
      notification = await Effect.runPromise(
        notification.markAsFailed("Test failure"),
      );
      await repo.update(notification);

      const scheduledFor = new Date(Date.now() + 3600000);
      const input: ScheduleNotificationInput = {
        notificationId: notification.id,
        scheduledFor,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("READY");
      expect(result.scheduledFor).toEqual(scheduledFor);

      // Verify stored notification
      const stored = await repo.findById(notification.id);
      expect(stored?.status).toBe(NotificationStatus.READY);
    });
  });
});
