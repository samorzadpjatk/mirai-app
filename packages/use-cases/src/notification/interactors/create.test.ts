import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createNotificationUseCase,
  type CreateNotificationInput,
  NotificationCreationError,
  NotificationRepositoryError,
} from "./create";
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
import type { NotificationId } from "@mirai-app/domain";

/**
 * Mock NotificationGateway for testing
 */
function createMockNotificationGateway(
  options: {
    shouldFailCreate?: boolean;
  } = {},
): NotificationGateway {
  const notificationMap = new Map<string, NotificationDTO>();

  return {
    create: (notification: NotificationDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      notificationMap.set(notification.id, notification);
      return Effect.succeed(notification);
    },

    findById: () => Effect.succeed(null),

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

describe("[UNIT] createNotificationUseCase", () => {
  it("should create a notification successfully", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Test Notification",
      body: "This is a test notification",
      createdById: "admin-123",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.title).toBe("Test Notification");
    expect(result.body).toBe("This is a test notification");
    expect(result.createdById).toBe("admin-123");
    expect(result.status).toBe(NotificationStatus.DRAFT);
    expect(result.priority).toBe(NotificationPriority.NORMAL);
    expect(result.tripId).toBeNull();
    expect(result.url).toBeNull();
    expect(result.scheduledFor).toBeNull();
    expect(result.sentAt).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create notification with custom status and priority", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Urgent Notification",
      body: "This is urgent",
      createdById: "admin-456",
      status: NotificationStatus.READY,
      priority: NotificationPriority.HIGH,
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe(NotificationStatus.READY);
    expect(result.priority).toBe(NotificationPriority.HIGH);
  });

  it("should create notification with trip association", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Trip Update",
      body: "Your trip has been updated",
      createdById: "admin-789",
      tripId: "trip-123",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.tripId).toBe("trip-123");
  });

  it("should create notification with URL", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Clickable Notification",
      body: "Click to learn more",
      createdById: "admin-abc",
      url: "https://example.com/details",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.url).toBe("https://example.com/details");
  });

  it("should create notification with scheduled time", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const scheduledTime = new Date("2024-12-31T23:59:59");
    const input: CreateNotificationInput = {
      title: "Scheduled Notification",
      body: "This will be sent later",
      createdById: "admin-def",
      scheduledFor: scheduledTime,
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.scheduledFor).toEqual(scheduledTime);
  });

  it("should fail with NotificationCreationError for empty title", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "",
      body: "This has no title",
      createdById: "admin-ghi",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationCreationError);
    }
  });

  it("should fail with NotificationCreationError for empty body", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Title Only",
      body: "",
      createdById: "admin-jkl",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationCreationError);
    }
  });

  it("should fail with NotificationCreationError for title exceeding max length", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "a".repeat(256),
      body: "This title is too long",
      createdById: "admin-mno",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationCreationError);
    }
  });

  it("should fail with NotificationCreationError for body exceeding max length", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Valid Title",
      body: "a".repeat(2001),
      createdById: "admin-pqr",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationCreationError);
    }
  });

  it("should handle repository errors gracefully", async () => {
    const mockGateway = createMockNotificationGateway({
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Valid Title",
      body: "Valid body content",
      createdById: "admin-stu",
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationRepositoryError);
    }
  });

  it("should create notification with LOW priority", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Low Priority",
      body: "Not urgent",
      createdById: "admin-vwx",
      priority: NotificationPriority.LOW,
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.priority).toBe(NotificationPriority.LOW);
  });

  it("should create notification with CANCELLED status", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: CreateNotificationInput = {
      title: "Cancelled Notification",
      body: "This was cancelled",
      createdById: "admin-yz",
      status: NotificationStatus.CANCELLED,
    };

    const program = createNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe(NotificationStatus.CANCELLED);
  });
});
