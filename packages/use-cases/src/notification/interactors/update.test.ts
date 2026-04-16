import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateNotificationUseCase,
  type UpdateNotificationInput,
  NotificationNotFoundError,
  NotificationValidationError,
  NotificationUpdateError,
} from "./update";
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
  options: {
    shouldFailUpdate?: boolean;
  } = {},
): NotificationGateway {
  const notificationMap = new Map(notifications.map((n) => [n.id, n]));

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

    update: (notification: NotificationDTO) => {
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
      notificationMap.set(notification.id, notification);
      return Effect.succeed(notification);
    },

    delete: () => Effect.succeed(void 0),

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

function createMockNotificationDTO(
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  const now = new Date();
  return {
    id: overrides.id ?? "notification-123",
    tripId: overrides.tripId ?? null,
    title: overrides.title ?? "Test Notification",
    content: overrides.content ?? "Test content",
    type: overrides.type ?? "GENERAL",
    status: overrides.status ?? NotificationStatus.DRAFT,
    priority: overrides.priority ?? NotificationPriority.NORMAL,
    scheduledAt: overrides.scheduledAt ?? null,
    sentAt: overrides.sentAt ?? null,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe("[UNIT] updateNotificationUseCase", () => {
  it("should update notification title successfully", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-123",
      title: "Old Title",
      content: "Test content",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-123",
      title: "New Title",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.title).toBe("New Title");
    expect(result.body).toBe("Test content");
    expect(result.id).toBe("notif-123");
  });

  it("should update notification body successfully", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-456",
      title: "Test Title",
      content: "Old content",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-456",
      body: "New content",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.body).toBe("New content");
    expect(result.title).toBe("Test Title");
  });

  it("should update notification status successfully", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-789",
      status: NotificationStatus.DRAFT,
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-789",
      status: NotificationStatus.READY,
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe(NotificationStatus.READY);
  });

  it("should update notification priority successfully", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-abc",
      priority: NotificationPriority.NORMAL,
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-abc",
      priority: NotificationPriority.HIGH,
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.priority).toBe(NotificationPriority.HIGH);
  });

  it("should preserve url as null since interactor does not handle URL updates", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-url",
      title: "Test",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-url",
      url: "https://example.com/updated", // This is passed but interactor doesn't use it
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    // The interactor's toOutput always returns null for url
    expect(result.url).toBe(null);
  });

  it("should update multiple fields at once", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-def",
      title: "Old Title",
      content: "Old content",
      status: NotificationStatus.DRAFT,
      priority: NotificationPriority.LOW,
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-def",
      title: "New Title",
      body: "New content",
      status: NotificationStatus.READY,
      priority: NotificationPriority.HIGH,
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.title).toBe("New Title");
    expect(result.body).toBe("New content");
    expect(result.status).toBe(NotificationStatus.READY);
    expect(result.priority).toBe(NotificationPriority.HIGH);
  });

  it("should fail with NotificationNotFoundError for non-existent notification", async () => {
    const mockGateway = createMockNotificationGateway([]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "non-existent",
      title: "New Title",
    };

    const program = updateNotificationUseCase(input).pipe(
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

  it("should fail with NotificationValidationError for empty title", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-ghi",
      title: "Valid Title",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-ghi",
      title: "",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationValidationError);
      if (either.left instanceof NotificationValidationError) {
        expect(either.left.message).toBe("Title cannot be empty");
      }
    }
  });

  it("should fail with NotificationValidationError for whitespace-only title", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-jkl",
      title: "Valid Title",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-jkl",
      title: "   ",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationValidationError);
    }
  });

  it("should fail with NotificationValidationError for empty body", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-mno",
      content: "Valid content",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-mno",
      body: "",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationValidationError);
      if (either.left instanceof NotificationValidationError) {
        expect(either.left.message).toBe("Body cannot be empty");
      }
    }
  });

  it("should fail with NotificationValidationError for whitespace-only body", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-pqr",
      content: "Valid content",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-pqr",
      body: "   ",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationValidationError);
    }
  });

  it("should handle database errors during update", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-db-error",
      title: "Test Title",
    });
    const mockGateway = createMockNotificationGateway([existingNotification], {
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-db-error",
      title: "New Title",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationUpdateError);
    }
  });

  it("should trim title when updating", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-trim",
      title: "Old Title",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-trim",
      title: "  New Title  ",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.title).toBe("New Title");
  });

  it("should trim body when updating", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-trim-body",
      content: "Old content",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-trim-body",
      body: "  New content  ",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.body).toBe("New content");
  });

  it("should update updatedAt timestamp", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-timestamp",
      updatedAt: new Date("2024-01-01"),
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-timestamp",
      title: "Updated Title",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt.getTime()).toBeGreaterThan(
      new Date("2024-01-01").getTime(),
    );
  });

  it("should return notification with all properties", async () => {
    const existingNotification = createMockNotificationDTO({
      id: "notif-full",
      title: "Full Test",
      content: "Full content",
      tripId: "trip-123",
      status: NotificationStatus.SENT,
      priority: NotificationPriority.HIGH,
      scheduledAt: null,
      sentAt: new Date(),
      createdById: "admin-123",
    });
    const mockGateway = createMockNotificationGateway([existingNotification]);
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const input: UpdateNotificationInput = {
      notificationId: "notif-full",
      title: "Updated",
    };

    const program = updateNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("body");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("createdById");
    expect(result).toHaveProperty("tripId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("priority");
    expect(result).toHaveProperty("scheduledFor");
    expect(result).toHaveProperty("sentAt");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
  });
});
