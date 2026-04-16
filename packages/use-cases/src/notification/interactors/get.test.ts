import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getNotificationUseCase,
  type GetNotificationInput,
  NotificationNotFoundError,
} from "./get";
import {
  NotificationGatewayTag,
  type NotificationGateway,
} from "../ports/gateway";
import type { NotificationDTO } from "../dto";
import {
  DatabaseError,
  NotificationStatus,
  NotificationPriority,
  NotificationScheduleType,
} from "@mirai-app/domain";

/**
 * Mock NotificationGateway for testing
 */
function createMockNotificationGateway(
  notifications: NotificationDTO[] = [],
  options: {
    shouldFailFind?: boolean;
  } = {},
): NotificationGateway {
  const notificationMap = new Map(notifications.map((n) => [n.id, n]));

  return {
    create: (notification: NotificationDTO) => {
      notificationMap.set(notification.id, notification);
      return Effect.succeed(notification);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
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

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

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

function createMockNotificationDTO(
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "notification-123",
    tripId: overrides.tripId ?? null,
    title: overrides.title ?? "Test Notification",
    content: overrides.content ?? "Test content",
    type: overrides.type ?? NotificationScheduleType.INFO,
    status: overrides.status ?? NotificationStatus.DRAFT,
    priority: overrides.priority ?? NotificationPriority.NORMAL,
    scheduledAt: overrides.scheduledAt ?? null,
    sentAt: overrides.sentAt ?? null,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] getNotificationUseCase", () => {
  it("should return notification when found by ID", async () => {
    const mockNotification = createMockNotificationDTO({
      id: "notification-456",
      title: "Welcome Message",
      content: "Welcome to the trip!",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    const mockGateway = createMockNotificationGateway([mockNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = { notificationId: "notification-456" };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("notification-456");
    expect(result.title).toBe("Welcome Message");
    expect(result.body).toBe("Welcome to the trip!");
    expect(result.status).toBe("SENT");
    expect(result.isSent).toBe(true);
  });

  it("should fail with NotificationNotFoundError when notification not found", async () => {
    const mockGateway = createMockNotificationGateway([]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = { notificationId: "non-existent" };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationNotFoundError);
      if (either.left instanceof NotificationNotFoundError) {
        expect(either.left.notificationId).toBe("non-existent");
      }
    }
  });

  it("should handle database errors", async () => {
    const mockGateway = createMockNotificationGateway([], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = { notificationId: "notification-123" };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return correct status for scheduled notification", async () => {
    const mockNotification = createMockNotificationDTO({
      id: "notification-scheduled",
      status: NotificationStatus.READY,
      scheduledAt: new Date(Date.now() + 86400000),
    });
    const mockGateway = createMockNotificationGateway([mockNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = {
      notificationId: "notification-scheduled",
    };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.isScheduled).toBe(true);
    expect(result.isSent).toBe(false);
  });

  it("should return notification with null tripId", async () => {
    const mockNotification = createMockNotificationDTO({
      id: "notification-no-trip",
      tripId: null,
    });
    const mockGateway = createMockNotificationGateway([mockNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = {
      notificationId: "notification-no-trip",
    };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.tripId).toBeNull();
  });

  it("should return notification with URL", async () => {
    const mockNotification = createMockNotificationDTO({
      id: "notification-url",
      title: "Click here",
      content: "Visit this link",
    });
    const mockGateway = createMockNotificationGateway([mockNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = { notificationId: "notification-url" };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.url).toBeDefined();
    expect(result.priority).toBeDefined();
    expect(result.createdById).toBeDefined();
  });

  it("should return all notification properties", async () => {
    const mockNotification = createMockNotificationDTO({
      id: "notification-full",
      title: "Full Notification",
      content: "Complete content",
      priority: NotificationPriority.HIGH,
    });
    const mockGateway = createMockNotificationGateway([mockNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: GetNotificationInput = { notificationId: "notification-full" };
    const program = getNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("body");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("priority");
    expect(result).toHaveProperty("tripId");
    expect(result).toHaveProperty("createdById");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("isSent");
    expect(result).toHaveProperty("isScheduled");
    expect(result).toHaveProperty("isReadyToSend");
  });
});
