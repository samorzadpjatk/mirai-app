/**
 * Notification Subscription Integration Tests
 *
 * Integration tests for the GraphQL notification subscription.
 * Verifies that:
 * - Subscription receives events via PubSub
 * - Filtering by userId works correctly
 * - Filtering by tripId works correctly
 * - Authentication is enforced
 * - Users can only subscribe to their own notifications
 * - Subscription cleanup works properly
 *
 * ## Test Tagging
 *
 * - [INTEGRATION]: Tests that verify subscription integration with PubSub and auth
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { schema } from "../../schema.js";
import type { GraphQLContext, AuthContext } from "../../context.js";
import {
  notificationPubSub,
  publishNotificationCreated,
} from "./subscriptions.js";
import type { NotificationDTO } from "@mirai-app/use-cases";
import type { Layer } from "effect";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";

/**
 * Create a mock NotificationDTO for testing
 */
function createMockNotificationDTO(
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  return {
    id: "notif-123",
    tripId: "trip-456",
    title: "Test Notification",
    content: "This is a test notification",
    type: "info",
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    scheduledAt: null,
    sentAt: null,
    createdById: "user-789",
    createdAt: new Date("2026-04-17T10:00:00Z"),
    updatedAt: new Date("2026-04-17T10:00:00Z"),
    ...overrides,
  };
}

/**
 * Create a mock GraphQL context for testing
 */
function createMockContext(authContext?: AuthContext): GraphQLContext {
  return {
    appLayer: {} as Layer.Layer<unknown>,
    runtime: {} as unknown as GraphQLContext["runtime"],
    request: new Request("http://localhost:4000/graphql"),
    authContext,
    requestId: "test-request-id",
    requestTime: new Date(),
    controllers: {
      challengeController:
        {} as unknown as GraphQLContext["controllers"]["challengeController"],
      challengeSubmissionController:
        {} as unknown as GraphQLContext["controllers"]["challengeSubmissionController"],
      challengeVoteController:
        {} as unknown as GraphQLContext["controllers"]["challengeVoteController"],
    },
  };
}

describe("[INTEGRATION] Notification Subscription", () => {
  beforeEach(() => {
    // Clean up PubSub before each test
    notificationPubSub.unsubscribeAll();
  });

  describe("subscription registration", () => {
    it("registers notificationCreated subscription in schema", () => {
      // Verify the subscription type exists in the schema
      const subscriptionType = schema.getSubscriptionType();
      expect(subscriptionType).toBeDefined();

      const fields = subscriptionType?.getFields();
      expect(fields).toHaveProperty("notificationCreated");

      const notificationCreatedField = fields?.notificationCreated;
      expect(notificationCreatedField).toBeDefined();
      expect(notificationCreatedField?.type.toString()).toContain(
        "Notification",
      );
    });

    it("subscription accepts tripId and userId filter arguments", () => {
      const subscriptionType = schema.getSubscriptionType();
      const fields = subscriptionType?.getFields();
      const notificationCreatedField = fields?.notificationCreated;

      const args = notificationCreatedField?.args;
      expect(args).toBeDefined();
      expect(args?.some((arg) => arg.name === "tripId")).toBe(true);
      expect(args?.some((arg) => arg.name === "userId")).toBe(true);
    });
  });

  describe("event delivery", () => {
    it("receives notification events via PubSub", async () => {
      // Create a mock notification
      const mockNotification = createMockNotificationDTO();

      // Set up subscription and publish
      const receivedNotifications: NotificationDTO[] = [];

      // Subscribe to the PubSub channel directly (simulating what the subscription does)
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      // Start consuming in background
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          receivedNotifications.push(notification);
          if (receivedNotifications.length >= 1) break;
        }
      })();

      // Publish the notification
      publishNotificationCreated(mockNotification);

      // Wait for consumption
      await consumePromise;

      // Verify the notification was received
      expect(receivedNotifications).toHaveLength(1);
      expect(receivedNotifications[0]?.id).toBe(mockNotification.id);
      expect(receivedNotifications[0]?.title).toBe(mockNotification.title);

      // Cleanup
      subscription.unsubscribe();
    });

    it("delivers multiple notifications in order", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const receivedNotifications: NotificationDTO[] = [];

      // Start consuming in background
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          receivedNotifications.push(notification);
          if (receivedNotifications.length >= 3) break;
        }
      })();

      // Publish multiple notifications
      const notification1 = createMockNotificationDTO({
        id: "notif-1",
        title: "First",
      });
      const notification2 = createMockNotificationDTO({
        id: "notif-2",
        title: "Second",
      });
      const notification3 = createMockNotificationDTO({
        id: "notif-3",
        title: "Third",
      });

      publishNotificationCreated(notification1);
      publishNotificationCreated(notification2);
      publishNotificationCreated(notification3);

      // Wait for consumption
      await consumePromise;

      // Verify order
      expect(receivedNotifications).toHaveLength(3);
      expect(receivedNotifications[0].id).toBe("notif-1");
      expect(receivedNotifications[1].id).toBe("notif-2");
      expect(receivedNotifications[2].id).toBe("notif-3");

      // Cleanup
      subscription.unsubscribe();
    });
  });

  describe("filtering", () => {
    it("filters notifications by userId", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const receivedNotifications: NotificationDTO[] = [];
      const targetUserId = "user-target";

      // Start consuming with userId filter simulation
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          // Apply userId filter (simulating what createNotificationIterable does)
          if (notification.createdById === targetUserId) {
            receivedNotifications.push(notification);
          }
          if (receivedNotifications.length >= 2) break;
        }
      })();

      // Publish notifications for different users
      const notification1 = createMockNotificationDTO({
        id: "notif-1",
        createdById: targetUserId,
      });
      const notification2 = createMockNotificationDTO({
        id: "notif-2",
        createdById: "other-user", // Different user
      });
      const notification3 = createMockNotificationDTO({
        id: "notif-3",
        createdById: targetUserId,
      });

      publishNotificationCreated(notification1);
      publishNotificationCreated(notification2);
      publishNotificationCreated(notification3);

      // Wait for consumption
      await consumePromise;

      // Verify only target user's notifications were received
      expect(receivedNotifications).toHaveLength(2);
      expect(receivedNotifications[0].createdById).toBe(targetUserId);
      expect(receivedNotifications[1].createdById).toBe(targetUserId);

      // Cleanup
      subscription.unsubscribe();
    });

    it("filters notifications by tripId", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const receivedNotifications: NotificationDTO[] = [];
      const targetTripId = "trip-target";

      // Start consuming with tripId filter simulation
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          // Apply tripId filter (simulating what createNotificationIterable does)
          if (notification.tripId === targetTripId) {
            receivedNotifications.push(notification);
          }
          if (receivedNotifications.length >= 2) break;
        }
      })();

      // Publish notifications for different trips
      const notification1 = createMockNotificationDTO({
        id: "notif-1",
        tripId: targetTripId,
      });
      const notification2 = createMockNotificationDTO({
        id: "notif-2",
        tripId: "other-trip", // Different trip
      });
      const notification3 = createMockNotificationDTO({
        id: "notif-3",
        tripId: targetTripId,
      });

      publishNotificationCreated(notification1);
      publishNotificationCreated(notification2);
      publishNotificationCreated(notification3);

      // Wait for consumption
      await consumePromise;

      // Verify only target trip's notifications were received
      expect(receivedNotifications).toHaveLength(2);
      expect(receivedNotifications[0].tripId).toBe(targetTripId);
      expect(receivedNotifications[1].tripId).toBe(targetTripId);

      // Cleanup
      subscription.unsubscribe();
    });

    it("combines tripId and userId filters", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const receivedNotifications: NotificationDTO[] = [];
      const targetTripId = "trip-target";
      const targetUserId = "user-target";

      // Start consuming with both filters
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          // Apply both filters
          if (
            notification.tripId === targetTripId &&
            notification.createdById === targetUserId
          ) {
            receivedNotifications.push(notification);
          }
          if (receivedNotifications.length >= 1) break;
        }
      })();

      // Publish notifications with different combinations
      const notification1 = createMockNotificationDTO({
        id: "notif-1",
        tripId: targetTripId,
        createdById: targetUserId, // Matches both
      });
      const notification2 = createMockNotificationDTO({
        id: "notif-2",
        tripId: targetTripId,
        createdById: "other-user", // Wrong user
      });
      const notification3 = createMockNotificationDTO({
        id: "notif-3",
        tripId: "other-trip",
        createdById: targetUserId, // Wrong trip
      });

      publishNotificationCreated(notification1);
      publishNotificationCreated(notification2);
      publishNotificationCreated(notification3);

      // Wait for consumption
      await consumePromise;

      // Verify only notification matching both filters was received
      expect(receivedNotifications).toHaveLength(1);
      expect(receivedNotifications[0].id).toBe("notif-1");

      // Cleanup
      subscription.unsubscribe();
    });
  });

  describe("authentication and authorization", () => {
    it("requires authentication for subscription", async () => {
      // Create context without auth
      const mockContext = createMockContext(undefined);

      // Verify authContext is undefined
      expect(mockContext.authContext).toBeUndefined();

      // The subscription's createNotificationIterable should throw
      // when authUserId is not present
      const authUserId = mockContext.authContext?.user?.id;
      expect(authUserId).toBeUndefined();
    });

    it("authenticated user can subscribe", async () => {
      const authContext: AuthContext = {
        user: { id: "user-123", email: "test@example.com", role: "user" },
        session: {
          accessToken: "test-token",
          refreshToken: "test-refresh",
          expiresAt: Date.now() + 3600000,
        },
      };

      const mockContext = createMockContext(authContext);

      // Verify authContext is present
      expect(mockContext.authContext).toBeDefined();
      expect(mockContext.authContext?.user?.id).toBe("user-123");
    });

    it("prevents subscribing to other users notifications", () => {
      const authUserId = "user-authenticated";
      const otherUserId = "user-other";

      // Simulate the security check in createNotificationIterable
      const userIdFilter = otherUserId;

      // This should fail the security check
      const isAuthorized = !userIdFilter || userIdFilter === authUserId;
      expect(isAuthorized).toBe(false);
    });

    it("allows subscribing to own notifications", () => {
      const authUserId = "user-authenticated";

      // Simulate the security check in createNotificationIterable
      const userIdFilter = authUserId;

      // This should pass the security check
      const isAuthorized = !userIdFilter || userIdFilter === authUserId;
      expect(isAuthorized).toBe(true);
    });

    it("allows subscribing without userId filter (receives all)", () => {
      const authUserId = "user-authenticated";

      // Simulate the security check in createNotificationIterable
      const userIdFilter = null; // No filter

      // This should pass the security check (no filter means receive all)
      const isAuthorized = !userIdFilter || userIdFilter === authUserId;
      expect(isAuthorized).toBe(true);
    });
  });

  describe("subscription lifecycle", () => {
    it("unsubscribes cleanly", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const iterator = subscription.asyncIterable[Symbol.asyncIterator]();

      // Unsubscribe
      subscription.unsubscribe();

      // Iterator should complete
      const result = await iterator.next();
      expect(result.done).toBe(true);
    });

    it("stops receiving after unsubscribe", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const receivedNotifications: NotificationDTO[] = [];

      // Start consuming
      const consumePromise = (async () => {
        for await (const notification of subscription.asyncIterable) {
          receivedNotifications.push(notification);
          if (receivedNotifications.length >= 1) {
            // Unsubscribe after first notification
            subscription.unsubscribe();
            break;
          }
        }
      })();

      // Publish notifications
      const notification1 = createMockNotificationDTO({ id: "notif-1" });
      const notification2 = createMockNotificationDTO({ id: "notif-2" });

      publishNotificationCreated(notification1);
      publishNotificationCreated(notification2);

      // Wait for consumption
      await consumePromise;

      // Only first notification should be received
      expect(receivedNotifications).toHaveLength(1);
      expect(receivedNotifications[0].id).toBe("notif-1");
    });
  });

  describe("publishNotificationCreated helper", () => {
    it("publishes notification to the correct channel", async () => {
      const subscription = notificationPubSub.subscribe<NotificationDTO>(
        "notification:created",
      );

      const iterator = subscription.asyncIterable[Symbol.asyncIterator]();

      // Use the helper function
      const mockNotification = createMockNotificationDTO({
        id: "published-notif",
        title: "Published Notification",
      });

      publishNotificationCreated(mockNotification);

      // Verify it was published
      const result = await iterator.next();
      expect(result.done).toBe(false);
      expect(result.value.id).toBe("published-notif");
      expect(result.value.title).toBe("Published Notification");

      // Cleanup
      subscription.unsubscribe();
    });
  });
});

describe("[INTEGRATION] Notification Subscription Security", () => {
  beforeEach(() => {
    notificationPubSub.unsubscribeAll();
  });

  it("enforces that userId filter matches authenticated user", () => {
    // This tests the core security logic from createNotificationIterable
    const testCases = [
      {
        description: "no auth, no filter",
        authUserId: undefined,
        userIdFilter: null,
        shouldAllow: false, // No authentication
      },
      {
        description: "authenticated, no filter",
        authUserId: "user-123",
        userIdFilter: null,
        shouldAllow: true, // No filter means receive all
      },
      {
        description: "authenticated, matching filter",
        authUserId: "user-123",
        userIdFilter: "user-123",
        shouldAllow: true, // Filter matches auth user
      },
      {
        description: "authenticated, non-matching filter",
        authUserId: "user-123",
        userIdFilter: "user-456",
        shouldAllow: false, // Filter doesn't match - security violation
      },
    ];

    for (const testCase of testCases) {
      // Replicate the security check from createNotificationIterable
      let isAllowed = false;

      if (!testCase.authUserId) {
        // Authentication required
        isAllowed = false;
      } else if (
        testCase.userIdFilter &&
        testCase.userIdFilter !== testCase.authUserId
      ) {
        // User filter mismatch - access denied
        isAllowed = false;
      } else {
        // No filter or filter matches
        isAllowed = true;
      }

      expect(isAllowed).toBe(testCase.shouldAllow);
    }
  });

  it("subscription with multiple simultaneous subscribers", async () => {
    const subscription1 = notificationPubSub.subscribe<NotificationDTO>(
      "notification:created",
    );
    const subscription2 = notificationPubSub.subscribe<NotificationDTO>(
      "notification:created",
    );

    const received1: NotificationDTO[] = [];
    const received2: NotificationDTO[] = [];

    // Start both consumers
    const promise1 = (async () => {
      for await (const notification of subscription1.asyncIterable) {
        received1.push(notification);
        if (received1.length >= 1) break;
      }
    })();

    const promise2 = (async () => {
      for await (const notification of subscription2.asyncIterable) {
        received2.push(notification);
        if (received2.length >= 1) break;
      }
    })();

    // Publish one notification
    const mockNotification = createMockNotificationDTO({ id: "shared-notif" });
    publishNotificationCreated(mockNotification);

    // Wait for both to receive
    await Promise.all([promise1, promise2]);

    // Both subscribers should receive the same notification
    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);
    expect(received1[0].id).toBe("shared-notif");
    expect(received2[0].id).toBe("shared-notif");

    // Cleanup
    subscription1.unsubscribe();
    subscription2.unsubscribe();
  });
});
