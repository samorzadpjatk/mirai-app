import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteNotificationUseCase,
  type DeleteNotificationInput,
  NotificationNotFoundError,
  NotificationAlreadySentError,
} from "./delete";
import {
  NotificationGatewayTag,
  type NotificationGateway,
} from "../ports/gateway";
import type { NotificationDTO } from "../dto";
import {
  NotificationStatus,
  NotificationPriority,
  DatabaseError,
} from "@mirai-app/domain";

/**
 * Mock NotificationGateway for testing
 */
function createMockNotificationGateway(
  notifications: NotificationDTO[] = [],
): NotificationGateway {
  const notificationMap = new Map<string, NotificationDTO>(
    notifications.map((n) => [n.id, n]),
  );

  return {
    create: (notification: NotificationDTO) => {
      notificationMap.set(notification.id, notification);
      return Effect.succeed(notification);
    },

    findById: (id: string) => {
      const notification = notificationMap.get(id);
      return Effect.succeed(notification ?? null);
    },

    findByTripId: () => Effect.succeed([]),

    findByStatus: () => Effect.succeed([]),

    findByTripIdAndStatus: () => Effect.succeed([]),

    findByPriority: () => Effect.succeed([]),

    findReadyToSend: () => Effect.succeed([]),

    findOverdue: () => Effect.succeed([]),

    findByCreatedById: () => Effect.succeed([]),

    findAll: () =>
      Effect.succeed({
        items: Array.from(notificationMap.values()),
        total: notificationMap.size,
        limit: notificationMap.size,
        offset: 0,
        hasMore: false,
      }),

    update: (notification: NotificationDTO) => Effect.succeed(notification),

    delete: (id: string) => {
      notificationMap.delete(id);
      return Effect.succeed(void 0);
    },

    exists: (id: string) => Effect.succeed(notificationMap.has(id)),

    countByStatus: () => Effect.succeed(0),

    countPendingByTripId: () => Effect.succeed(0),

    findByUserIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findUnreadByUserIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findManyConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findActiveConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByNotificationIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findExecutionsConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findDeliveriesByNotificationIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findDeliveriesByUserIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
  };
}

// Helper to create a mock NotificationDTO
function createMockNotification(
  id: string,
  status: NotificationStatus = NotificationStatus.DRAFT,
): NotificationDTO {
  return {
    id,
    tripId: null,
    title: "Test Notification",
    content: "Test content",
    type: "GENERAL",
    status,
    priority: NotificationPriority.NORMAL,
    scheduledAt: null,
    sentAt: status === NotificationStatus.SENT ? new Date() : null,
    createdById: "admin-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("[UNIT] deleteNotificationUseCase", () => {
  it("should delete a notification successfully", async () => {
    const draftNotification = createMockNotification(
      "notif-123",
      NotificationStatus.DRAFT,
    );
    const mockGateway = createMockNotificationGateway([draftNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "notif-123",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedNotificationId).toBe("notif-123");

    // Verify it was deleted
    const exists = await Effect.runPromise(
      mockGateway.exists("notif-123").pipe(Effect.provide(mockLayer)),
    );
    expect(exists).toBe(false);
  });

  it("should fail with NotificationNotFoundError for non-existent notification", async () => {
    const mockGateway = createMockNotificationGateway([]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "non-existent",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationNotFoundError);
      expect(either.left.notificationId).toBe("non-existent");
    }
  });

  it("should fail with NotificationAlreadySentError for sent notifications", async () => {
    const sentNotification = createMockNotification(
      "notif-456",
      NotificationStatus.SENT,
    );
    const mockGateway = createMockNotificationGateway([sentNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "notif-456",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationAlreadySentError);
      expect(either.left.notificationId).toBe("notif-456");
    }
  });

  it("should delete a READY notification", async () => {
    const readyNotification = createMockNotification(
      "notif-789",
      NotificationStatus.READY,
    );
    const mockGateway = createMockNotificationGateway([readyNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "notif-789",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedNotificationId).toBe("notif-789");
  });

  it("should delete a FAILED notification", async () => {
    const failedNotification = createMockNotification(
      "notif-fail",
      NotificationStatus.FAILED,
    );
    const mockGateway = createMockNotificationGateway([failedNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "notif-fail",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedNotificationId).toBe("notif-fail");
  });

  it("should delete a CANCELLED notification", async () => {
    const cancelledNotification = createMockNotification(
      "notif-cancel",
      NotificationStatus.CANCELLED,
    );
    const mockGateway = createMockNotificationGateway([cancelledNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: DeleteNotificationInput = {
      notificationId: "notif-cancel",
    };

    const program = deleteNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedNotificationId).toBe("notif-cancel");
  });
});
