import { describe, it, expect, beforeEach } from "bun:test";
import {
  createNotificationUseCase,
  type CreateNotificationInput,
  NotificationCreationError,
  NotificationRepositoryError,
} from "./CreateNotification";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import { InMemoryNotificationGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] createNotificationUseCase (Effect)", () => {
  let repo: InMemoryNotificationGateway;

  beforeEach(() => {
    repo = new InMemoryNotificationGateway();
  });

  // Helper to create a valid notification input
  const createValidInput = (): CreateNotificationInput => ({
    title: "Test Notification",
    body: "This is a test notification body",
    createdById: "admin-123",
  });

  // Helper to run use case with repository
  const runUseCase = async (input: CreateNotificationInput) => {
    const program = createNotificationUseCase(input).pipe(
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

  describe("[UNIT] execute", () => {
    it("should create notification with valid input", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.title).toBe("Test Notification");
      expect(result.body).toBe("This is a test notification body");
      expect(result.createdById).toBe("admin-123");
      expect(result.status).toBe("DRAFT");
      expect(result.priority).toBe("NORMAL");
      expect(result.url).toBeNull();
      expect(result.tripId).toBeNull();
      expect(result.scheduledFor).toBeNull();
      expect(result.sentAt).toBeNull();

      // Verify notification was actually stored
      const stored = Effect.runSync(repo.findByCreatedById("admin-123"));
      expect(stored).toHaveLength(1);
      expect(stored[0]?.title).toBe("Test Notification");
    });

    it("should create notification with custom status and priority", async () => {
      // Arrange
      const input: CreateNotificationInput = {
        title: "Urgent Alert",
        body: "This is an urgent message",
        createdById: "admin-456",
        status: NotificationStatus.READY,
        priority: NotificationPriority.URGENT,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("READY");
      expect(result.priority).toBe("URGENT");

      // Verify stored notification
      const stored = Effect.runSync(
        repo.findByStatus(NotificationStatus.READY),
      );
      expect(stored).toHaveLength(1);
      expect(stored[0]?.priority).toBe(NotificationPriority.URGENT);
    });

    it("should create notification with trip association", async () => {
      // Arrange
      const input: CreateNotificationInput = {
        title: "Trip Update",
        body: "Your trip has been updated",
        createdById: "admin-789",
        tripId: "trip-abc",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.tripId).toBe("trip-abc");

      // Verify stored notification
      const stored = Effect.runSync(repo.findByTripId("trip-abc"));
      expect(stored).toHaveLength(1);
      expect(stored[0]?.title).toBe("Trip Update");
    });

    it("should create notification with URL", async () => {
      // Arrange
      const input: CreateNotificationInput = {
        title: "Click Here",
        body: "Check out this link!",
        createdById: "admin-456",
        url: "https://example.com/trip/123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.url).toBe("https://example.com/trip/123");
    });

    it("should create notification with schedule", async () => {
      // Arrange
      const scheduledFor = new Date(Date.now() + 3600000); // 1 hour from now
      const input: CreateNotificationInput = {
        title: "Scheduled Message",
        body: "This will be sent later",
        createdById: "admin-456",
        scheduledFor,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.scheduledFor).toEqual(scheduledFor);
    });

    it("should fail when title is empty", async () => {
      const input: CreateNotificationInput = {
        title: "", // Empty title
        body: "This is a test body",
        createdById: "admin-123",
      };

      // Act
      const program = createNotificationUseCase(input).pipe(
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

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(NotificationCreationError);
        expect(either.left.message).toContain("title");
      }

      // Verify no notification was stored
      const stored = Effect.runSync(repo.findAll());
      expect(stored).toHaveLength(0);
    });

    it("should fail when body is empty", async () => {
      const input: CreateNotificationInput = {
        title: "Test Title",
        body: "", // Empty body
        createdById: "admin-123",
      };

      // Act
      const program = createNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationCreationError);
        expect(either.left.message).toContain("body");
      }

      // Verify no notification was stored
      const stored = Effect.runSync(repo.findAll());
      expect(stored).toHaveLength(0);
    });

    it("should fail when createdById is empty", async () => {
      const input: CreateNotificationInput = {
        title: "Test Title",
        body: "Test body",
        createdById: "", // Empty createdById
      };

      // Act
      const program = createNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationCreationError);
        expect(either.left.message).toContain("createdById");
      }

      // Verify no notification was stored
      const stored = Effect.runSync(repo.findAll());
      expect(stored).toHaveLength(0);
    });

    it("should fail when scheduledFor is in the past", async () => {
      const input: CreateNotificationInput = {
        title: "Test Title",
        body: "Test body",
        createdById: "admin-123",
        scheduledFor: new Date(Date.now() - 3600000), // 1 hour ago
      };

      // Act
      const program = createNotificationUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(NotificationCreationError);
        expect(either.left.message).toContain("scheduledFor");
      }

      // Verify no notification was stored
      const stored = Effect.runSync(repo.findAll());
      expect(stored).toHaveLength(0);
    });

    it("should create HIGH priority notification", async () => {
      const input: CreateNotificationInput = {
        title: "High Priority",
        body: "Important message",
        createdById: "admin-123",
        priority: NotificationPriority.HIGH,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.priority).toBe("HIGH");

      // Verify stored notification
      const stored = Effect.runSync(
        repo.findByPriority(NotificationPriority.HIGH),
      );
      expect(stored).toHaveLength(1);
    });

    it("should use DRAFT as default status when not provided", async () => {
      const input: CreateNotificationInput = {
        title: "Default Status Test",
        body: "Testing default status",
        createdById: "admin-123",
        // status not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.status).toBe("DRAFT");
    });

    it("should use NORMAL as default priority when not provided", async () => {
      const input: CreateNotificationInput = {
        title: "Default Priority Test",
        body: "Testing default priority",
        createdById: "admin-123",
        // priority not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.priority).toBe("NORMAL");
    });
  });
});
