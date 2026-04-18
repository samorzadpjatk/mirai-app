import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer, Schedule } from "effect";
import { NotificationSendHandler } from "./NotificationSendHandler";
import {
  PushSubscriptionPortTag,
  NotificationDeliveryPortTag,
  NotificationServicePortTag,
} from "../ports/NotificationPort";
import type {
  IPushSubscriptionPort,
  INotificationDeliveryPort,
  NotificationDelivery,
  PushSubscription,
  INotificationServicePort,
  NotificationId,
  NotificationDeliveryStats,
  IPortError,
} from "@mirai-app/domain";
import { NotificationCreated } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Mock PushSubscription for testing
 */
const createMockPushSubscription = (
  userId: string,
  token: string
): PushSubscription => ({
  id: `sub-${userId}` as PushSubscription["id"],
  userId: userId as PushSubscription["userId"],
  token,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
});

/**
 * Creates a mock push subscription port
 */
const createMockPushSubscriptionPort = (
  subscriptions: PushSubscription[]
): IPushSubscriptionPort => ({
  findByUserId: (userId) =>
    Effect.succeed(subscriptions.filter((s) => s.userId === userId)),
  findByToken: () => Effect.succeed(null),
  findByUserIdAndToken: () => Effect.succeed(null),
  create: (sub) => Effect.succeed(sub),
  update: (sub) => Effect.succeed(sub),
  delete: () => Effect.succeed(void 0),
  deleteByTokenAndUserId: () => Effect.succeed(0),
  deleteAllByUserId: () => Effect.succeed(0),
  findAll: () => Effect.succeed(subscriptions),
});

/**
 * Creates a mock delivery port that tracks updates
 */
const createMockDeliveryPort = (updates: NotificationDelivery[] = []) => {
  const deliveries: NotificationDelivery[] = [];

  const port: INotificationDeliveryPort = {
    findAll: () =>
      Effect.succeed({
        deliveries: [],
        total: 0,
      }),
    findByNotificationId: () => Effect.succeed(null),
    findFailed: () =>
      Effect.succeed({
        deliveries: [],
        total: 0,
      }),
    getStats: () =>
      Effect.succeed({
        totalRecipients: 0,
        totalSuccess: 0,
        totalFailures: 0,
        totalDeliveries: 0,
        avgFailuresPerDelivery: 0,
        statusBreakdown: {},
        avgSuccessPerDelivery: 0,
        successRate: 0
      } as NotificationDeliveryStats),
    create: (delivery: NotificationDelivery) => {
      deliveries.push(delivery);
      return Effect.succeed(delivery);
    },
    update: (delivery: NotificationDelivery) => {
      updates.push(delivery);
      // Also update the delivery in the deliveries array to track final state
      const index = deliveries.findIndex((d) => d.id === delivery.id);
      if (index !== -1) {
        deliveries[index] = delivery;
      }
      return Effect.succeed(delivery);
    },
  };

  return {
    port,
    getDeliveries: () => deliveries,
    getUpdates: () => updates,
  };
};

/**
 * Type for notification content
 */
interface NotificationContent {
  title: string;
  body: string;
  url: string;
}

/**
 * Creates a mock notification service port
 */
const createMockNotificationServicePort = (
  result: { success: boolean; sent: number; failed: number; total: number },
  shouldFail = false,
  error?: Error
): INotificationServicePort => ({
  sendNotification: () =>
    Effect.succeed({
      success: true,
      notificationId: "test-id" as NotificationId,
      recipientCount: 1,
    }),
  sendMobileNotifications: () => {
    if (shouldFail && error) {
      return Effect.fail(
        error instanceof ApplicationError
          ? error
          : new ApplicationError({ operation: "send", cause: error })
      );
    }
    return Effect.succeed(result);
  },
  sendRankingUpdate: () =>
    Effect.succeed({
      success: true,
      notificationId: "test-id" as NotificationId,
      recipientCount: 1,
    }),
  createCoinsAddedNotification: (): NotificationContent => ({
    title: "Test",
    body: "Test",
    url: "/test",
  }),
  createCoinsRemovedNotification: (): NotificationContent => ({
    title: "Test",
    body: "Test",
    url: "/test",
  }),
  createNewMemberNotification: (): NotificationContent => ({
    title: "Test",
    body: "Test",
    url: "/test",
  }),
});

describe("[UNIT] NotificationSendHandler", () => {
  let handler: NotificationSendHandler;

  beforeEach(() => {
    handler = new NotificationSendHandler();
  });

  it("implements IEventHandler<NotificationCreated>", () => {
    expect(handler.eventTag).toBe("NotificationCreated");
    expect(typeof handler.handle).toBe("function");
  });

  it("fetches push subscriptions for target users", async () => {
    const mockSubscriptions = [
      createMockPushSubscription("user-1", "token-1"),
      createMockPushSubscription("user-2", "token-2"),
    ];

    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getDeliveries } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 2,
      failed: 0,
      total: 2,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-123" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1", "user-2"],
      new Date()
    );

    const program = handler.handle(event).pipe(Effect.provide(mockLayer));

    const result = await Effect.runPromise(Effect.either(program));

    expect(Either.isRight(result)).toBe(true);

    const deliveries = getDeliveries();
    expect(deliveries.length).toBeGreaterThanOrEqual(1);
    // Final state is "success" after handler completes (mock tracks final state)
    expect(deliveries[0]?.status).toBe("success");
    // totalRecipients is the number of subscriptions (2 users x 1 subscription each = 2)
    expect(deliveries[0]?.totalRecipients).toBe(2);
  });

  it("tracks delivery start and completion", async () => {
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 1,
      failed: 0,
      total: 1,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-456" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    const program = handler.handle(event).pipe(Effect.provide(mockLayer));

    await Effect.runPromise(program);

    const updates = getUpdates();
    expect(updates.length).toBeGreaterThanOrEqual(1);

    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate).toBeDefined();
    expect(completionUpdate?.status).toBe("success");
    expect(completionUpdate?.successCount).toBe(1);
    expect(completionUpdate?.failureCount).toBe(0);
  });

  it("sends push notifications and returns Effect<void, never, R>", async () => {
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 1,
      failed: 0,
      total: 1,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-789" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    const effect = handler.handle(event);

    expect(effect).toBeDefined();

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(mockLayer), Effect.either)
    );

    expect(Either.isRight(result)).toBe(true);
  });

  it("handles success with partial failures", async () => {
    const mockSubscriptions = [
      createMockPushSubscription("user-1", "token-1"),
      createMockPushSubscription("user-2", "token-2"),
    ];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 1,
      failed: 1,
      total: 2,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-partial" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1", "user-2"],
      new Date()
    );

    const program = handler.handle(event).pipe(Effect.provide(mockLayer));
    await Effect.runPromise(program);

    const updates = getUpdates();
    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate?.status).toBe("partial_failure");
    expect(completionUpdate?.successCount).toBe(1);
    expect(completionUpdate?.failureCount).toBe(1);
  });

  it("handles complete failure", async () => {
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 0,
      failed: 1,
      total: 1,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-fail" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    const program = handler.handle(event).pipe(Effect.provide(mockLayer));
    await Effect.runPromise(program);

    const updates = getUpdates();
    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate?.status).toBe("failure");
    expect(completionUpdate?.successCount).toBe(0);
    expect(completionUpdate?.failureCount).toBe(1);
  });

  it("handles no push subscriptions gracefully", async () => {
    const mockPushPort = createMockPushSubscriptionPort([]);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-empty" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1", "user-2"],
      new Date()
    );

    const program = handler.handle(event).pipe(Effect.provide(mockLayer));
    await Effect.runPromise(program);

    const updates = getUpdates();
    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate?.status).toBe("success");
    expect(completionUpdate?.successCount).toBe(0);
    expect(completionUpdate?.failureCount).toBe(0);
    expect(completionUpdate?.totalRecipients).toBe(0);
  });

  it("catches all errors internally (Effect<void, never, R>)", async () => {
    const mockPushPort: IPushSubscriptionPort = {
      findByUserId: () =>
        Effect.fail(
          new ApplicationError({
            operation: "findByUserId",
            cause: new Error("Database connection failed"),
          })
        ),
      findByToken: () => Effect.succeed(null),
      findByUserIdAndToken: () => Effect.succeed(null),
      create: (sub) => Effect.succeed(sub),
      update: (sub) => Effect.succeed(sub),
      delete: () => Effect.succeed(void 0),
      deleteByTokenAndUserId: () => Effect.succeed(0),
      deleteAllByUserId: () => Effect.succeed(0),
      findAll: () => Effect.succeed([]),
    };

    const { port: mockDeliveryPort, getDeliveries } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-error" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    const effect = handler.handle(event);

    const result = await Effect.runPromise(
      effect.pipe(Effect.provide(mockLayer), Effect.either)
    );

    expect(Either.isRight(result)).toBe(true);

    const deliveries = getDeliveries();
    const failureDelivery = deliveries.find((d) => d.status === "failure");
    expect(failureDelivery).toBeDefined();
  });

  it("marks delivery as failure on complete handler failure", async () => {
    const mockPushPort: IPushSubscriptionPort = {
      findByUserId: () =>
        Effect.fail(
          new ApplicationError({
            operation: "findByUserId",
            cause: new Error("Critical database error"),
          })
        ),
      findByToken: () => Effect.succeed(null),
      findByUserIdAndToken: () => Effect.succeed(null),
      create: (sub) => Effect.succeed(sub),
      update: (sub) => Effect.succeed(sub),
      delete: () => Effect.succeed(void 0),
      deleteByTokenAndUserId: () => Effect.succeed(0),
      deleteAllByUserId: () => Effect.succeed(0),
      findAll: () => Effect.succeed([]),
    };

    const { port: mockDeliveryPort, getDeliveries } = createMockDeliveryPort();
    const mockServicePort = createMockNotificationServicePort({
      success: true,
      sent: 0,
      failed: 0,
      total: 0,
    });

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-critical" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1", "user-2", "user-3"],
      new Date()
    );

    await Effect.runPromise(
      handler.handle(event).pipe(Effect.provide(mockLayer))
    );

    const deliveries = getDeliveries();
    const failureDelivery = deliveries.find((d) => d.status === "failure");
    expect(failureDelivery).toBeDefined();
    // ApplicationError message is "Application operation failed"
    expect(failureDelivery?.errors).toContain("Application operation failed");
  });
});

describe("[UNIT] NotificationSendHandler Retry Logic", () => {
  let handler: NotificationSendHandler;

  // Set timeout to 10 seconds for retry tests (retry schedule uses 1s, 2s, 4s delays)
  beforeEach(() => {
    // Use a fast schedule for testing (100ms base instead of 1s)
    const testSchedule = Schedule.exponential(100).pipe(
      Schedule.intersect(Schedule.recurs(3))
    );
    handler = new NotificationSendHandler(testSchedule);
  });
  it("retries on transient errors with exponential backoff", async () => {
    let attemptCount = 0;
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort } = createMockDeliveryPort();

    const mockServicePort: INotificationServicePort = {
      sendNotification: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      sendMobileNotifications: () => {
        attemptCount++;
        if (attemptCount < 3) {
          return Effect.fail(
            new ApplicationError({
              operation: "sendMobileNotifications",
              cause: new Error(`Transient error attempt ${attemptCount}`),
            })
          );
        }
        return Effect.succeed({
          success: true,
          sent: 1,
          failed: 0,
          total: 1,
        });
      },
      sendRankingUpdate: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      createCoinsAddedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createCoinsRemovedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createNewMemberNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
    };

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    const event = new NotificationCreated(
      "notif-retry" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    await Effect.runPromise(
      handler.handle(event).pipe(Effect.provide(mockLayer))
    );

    expect(attemptCount).toBe(3);
  });

  it("does not retry on non-retryable errors", async () => {
    let attemptCount = 0;
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();

    const mockServicePort: INotificationServicePort = {
      sendNotification: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      sendMobileNotifications: (_notificationId: NotificationId) => {
        attemptCount++;
        // Return an error with _tag that indicates non-retryable
        return Effect.fail({
          _tag: "DeviceNotRegisteredError",
          token: "invalid-token",
          message: "Invalid token",
        } as IPortError);
      },
      sendRankingUpdate: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      createCoinsAddedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createCoinsRemovedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createNewMemberNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
    };

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    // Create handler with a fast schedule for testing
    const testHandler = new NotificationSendHandler(
      Schedule.exponential(100).pipe(Schedule.intersect(Schedule.recurs(3)))
    );

    const event = new NotificationCreated(
      "notif-no-retry" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    await Effect.runPromise(
      testHandler.handle(event).pipe(Effect.provide(mockLayer))
    );

    expect(attemptCount).toBe(1);

    const updates = getUpdates();
    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate?.status).toBe("failure");
  });

  it("fails after max retries exceeded", async () => {
    let attemptCount = 0;
    const mockSubscriptions = [createMockPushSubscription("user-1", "token-1")];
    const mockPushPort = createMockPushSubscriptionPort(mockSubscriptions);
    const { port: mockDeliveryPort, getUpdates } = createMockDeliveryPort();

    const mockServicePort: INotificationServicePort = {
      sendNotification: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      sendMobileNotifications: () => {
        attemptCount++;
        return Effect.fail(
          new ApplicationError({
            operation: "sendMobileNotifications",
            cause: new Error("Persistent transient error"),
          })
        );
      },
      sendRankingUpdate: () =>
        Effect.succeed({
          success: true,
          notificationId: "test-id" as NotificationId,
          recipientCount: 1,
        }),
      createCoinsAddedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createCoinsRemovedNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
      createNewMemberNotification: (): NotificationContent => ({
        title: "Test",
        body: "Test",
        url: "/test",
      }),
    };

    const mockLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, mockPushPort),
      Layer.succeed(NotificationDeliveryPortTag, mockDeliveryPort),
      Layer.succeed(NotificationServicePortTag, mockServicePort)
    );

    // Create handler with a fast schedule for testing
    const testHandler = new NotificationSendHandler(
      Schedule.exponential(100).pipe(Schedule.intersect(Schedule.recurs(3)))
    );

    const event = new NotificationCreated(
      "notif-max-retry" as NotificationId,
      null,
      "Test Title",
      "Test Body",
      "/test",
      ["user-1"],
      new Date()
    );

    await Effect.runPromise(
      testHandler.handle(event).pipe(Effect.provide(mockLayer))
    );

    // Initial attempt + 3 retries = 4 total attempts
    expect(attemptCount).toBe(4);

    const updates = getUpdates();
    const completionUpdate = updates.find(
      (u) => u.deliveryCompletedAt !== null
    );
    expect(completionUpdate?.status).toBe("failure");
  });
});
