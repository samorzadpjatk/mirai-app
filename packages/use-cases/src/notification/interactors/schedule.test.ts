import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import type { NotificationGateway } from "../ports/gateway";
import { NotificationGatewayTag } from "../ports/gateway";
import {
  scheduleNotificationUseCase,
  type ScheduleNotificationInput,
  NotificationNotFoundError,
  NotificationValidationError,
  NotificationStateError,
  NotificationScheduleError,
} from "./schedule";
import {
  NotificationStatus,
  NotificationPriority,
  DatabaseError,
} from "@mirai-app/domain";
import type { NotificationDTO } from "../dto";

/**
 * Mock NotificationGateway for testing
 */
function createMockNotificationGateway(
  options: {
    existingNotification?: NotificationDTO | null;
    shouldFailUpdate?: boolean;
  } = {},
): NotificationGateway {
  const baseNotification: NotificationDTO = {
    id: "notif-123",
    tripId: null,
    title: "Test Notification",
    content: "Test Content",
    type: "INFO" as string,
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    scheduledAt: null,
    sentAt: null,
    createdById: "admin-123",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  };

  return {
    create: (notification: NotificationDTO) => Effect.succeed(notification),

    findById: (id: string) => {
      if (options.existingNotification !== undefined) {
        return Effect.succeed(options.existingNotification);
      }
      if (id === "notif-123") {
        return Effect.succeed(baseNotification);
      }
      return Effect.succeed(null);
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
        items: [],
        total: 0,
        limit: 20,
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
      return Effect.succeed({
        ...notification,
        updatedAt: new Date(),
      });
    },

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

describe("[UNIT] scheduleNotificationUseCase", () => {
  it("should schedule a notification successfully", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "notif-123",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("notif-123");
    expect(result.scheduledFor).toEqual(futureTime);
    expect(result.status).toBe(NotificationStatus.READY);
  });

  it("should fail with NotificationNotFoundError when notification does not exist", async () => {
    const mockGateway = createMockNotificationGateway({
      existingNotification: null,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "nonexistent-123",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationNotFoundError);
    }
  });

  it("should fail with NotificationStateError when notification already sent", async () => {
    const sentNotification: NotificationDTO = {
      id: "sent-notif",
      tripId: null,
      title: "Sent Notification",
      content: "Already sent",
      type: "INFO" as string,
      status: NotificationStatus.SENT,
      priority: NotificationPriority.NORMAL,
      scheduledAt: new Date("2024-12-01"),
      sentAt: new Date("2024-12-01"),
      createdById: "admin-123",
      createdAt: new Date("2024-11-01"),
      updatedAt: new Date("2024-12-01"),
    };

    const mockGateway = createMockNotificationGateway({
      existingNotification: sentNotification,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "sent-notif",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationStateError);
    }
  });

  it("should fail with NotificationStateError when notification cancelled", async () => {
    const cancelledNotification: NotificationDTO = {
      id: "cancelled-notif",
      tripId: null,
      title: "Cancelled Notification",
      content: "Was cancelled",
      type: "INFO" as string,
      status: NotificationStatus.CANCELLED,
      priority: NotificationPriority.NORMAL,
      scheduledAt: null,
      sentAt: null,
      createdById: "admin-123",
      createdAt: new Date("2024-11-01"),
      updatedAt: new Date("2024-12-01"),
    };

    const mockGateway = createMockNotificationGateway({
      existingNotification: cancelledNotification,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "cancelled-notif",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationStateError);
    }
  });

  it("should fail with NotificationValidationError when scheduled time is in the past", async () => {
    const mockGateway = createMockNotificationGateway();
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 2);

    const input: ScheduleNotificationInput = {
      notificationId: "notif-123",
      scheduledFor: pastTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationValidationError);
      if (either.left._tag === "NotificationValidationError") {
        expect(either.left.field).toBe("scheduledFor");
      }
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockNotificationGateway({
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "notif-123",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(NotificationScheduleError);
    }
  });

  it("should schedule failed notification and update status to READY", async () => {
    const failedNotification: NotificationDTO = {
      id: "failed-notif",
      tripId: null,
      title: "Failed Notification",
      content: "Previously failed",
      type: "INFO" as string,
      status: NotificationStatus.FAILED,
      priority: NotificationPriority.HIGH,
      scheduledAt: null,
      sentAt: null,
      createdById: "admin-123",
      createdAt: new Date("2024-11-01"),
      updatedAt: new Date("2024-11-01"),
    };

    const mockGateway = createMockNotificationGateway({
      existingNotification: failedNotification,
    });
    const mockLayer = Layer.succeed(NotificationGatewayTag, mockGateway);

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const input: ScheduleNotificationInput = {
      notificationId: "failed-notif",
      scheduledFor: futureTime,
    };

    const program = scheduleNotificationUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.status).toBe(NotificationStatus.READY);
  });
});
