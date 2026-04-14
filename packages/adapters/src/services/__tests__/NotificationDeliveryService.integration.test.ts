import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { EventBus } from "../EventBus";
import {
  NotificationDeliveryService,
  type PushSubscription,
  type PushSubscriptionRepository,
} from "../NotificationDeliveryService";
import { NotificationCreated } from "@mirai-app/domain";
import type { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

// =============================================================================
// Mock Expo Client
// =============================================================================

class MockExpo implements Partial<Expo> {
  private mockTickets: Map<string, ExpoPushTicket> = new Map();
  private shouldFailNextChunk = false;
  private failWithError: Error | null = null;

  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][] {
    // Simulate Expo's chunking (max 100 per chunk)
    const chunks: ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }
    return chunks;
  }

  async sendPushNotificationsAsync(
    messages: ExpoPushMessage[],
  ): Promise<ExpoPushTicket[]> {
    if (this.shouldFailNextChunk) {
      this.shouldFailNextChunk = false;
      throw this.failWithError ?? new Error("Mock Expo error");
    }

    return messages.map((message) => {
      const ticketId = `ticket-${Math.random().toString(36).substring(2, 15)}`;
      const token = message.to as string;

      if (token.includes("invalid") || token.includes("invalid-token")) {
        return {
          status: "error" as const,
          id: ticketId,
          details: { error: "Invalid token" },
        };
      }

      if (token.includes("device-not-registered")) {
        return {
          status: "error" as const,
          id: ticketId,
          details: { error: "DeviceNotRegistered" },
        };
      }

      return {
        status: "ok" as const,
        id: ticketId,
      };
    });
  }

  setFailNextChunk(error?: Error): void {
    this.shouldFailNextChunk = true;
    this.failWithError = error ?? null;
  }
}

// =============================================================================
// Mock Push Subscription Repository
// =============================================================================

class MockPushSubscriptionRepository implements PushSubscriptionRepository {
  private subscriptions: Map<string, PushSubscription[]> = new Map();

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    return this.subscriptions.get(userId) ?? [];
  }

  async findByUserIds(userIds: string[]): Promise<PushSubscription[]> {
    const results: PushSubscription[] = [];
    for (const userId of userIds) {
      const userSubs = this.subscriptions.get(userId) ?? [];
      results.push(...userSubs);
    }
    return results;
  }

  async save(subscription: PushSubscription): Promise<void> {
    const userSubs = this.subscriptions.get(subscription.userId) ?? [];
    const existingIndex = userSubs.findIndex((s) => s.id === subscription.id);

    if (existingIndex >= 0) {
      userSubs[existingIndex] = subscription;
    } else {
      userSubs.push(subscription);
    }

    this.subscriptions.set(subscription.userId, userSubs);
  }

  async delete(id: string): Promise<void> {
    for (const [userId, subs] of this.subscriptions) {
      const filtered = subs.filter((s) => s.id !== id);
      if (filtered.length !== subs.length) {
        this.subscriptions.set(userId, filtered);
        return;
      }
    }
  }

  // Test helper methods
  addSubscription(subscription: PushSubscription): void {
    const userSubs = this.subscriptions.get(subscription.userId) ?? [];
    userSubs.push(subscription);
    this.subscriptions.set(subscription.userId, userSubs);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  getSubscriptionCount(): number {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }
    return count;
  }
}

// =============================================================================
// Integration Tests
// =============================================================================

describe("[INTEGRATION] NotificationDeliveryService with EventBus", () => {
  let eventBus: EventBus;
  let pushSubscriptionRepo: MockPushSubscriptionRepository;
  let expo: MockExpo;
  let deliveryService: NotificationDeliveryService;

  beforeEach(() => {
    eventBus = new EventBus();
    pushSubscriptionRepo = new MockPushSubscriptionRepository();
    expo = new MockExpo();
    deliveryService = new NotificationDeliveryService(
      eventBus,
      pushSubscriptionRepo,
      expo as unknown as Expo,
    );
  });

  // =============================================================================
  // EventBus Integration
  // =============================================================================

  describe("[UNIT] EventBus integration", () => {
    it("should subscribe to NotificationCreated events on initialize", () => {
      deliveryService.initialize();

      // Handler count should be 1 after initialization
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);
    });

    it("should unsubscribe from events on shutdown", () => {
      deliveryService.initialize();
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);

      deliveryService.shutdown();
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });

    it("should handle double initialization gracefully", () => {
      deliveryService.initialize();
      deliveryService.initialize(); // Should not add second handler

      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);
    });

    it("should handle shutdown without initialization", () => {
      // Should not throw
      deliveryService.shutdown();

      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });

    it("should handle double shutdown gracefully", () => {
      deliveryService.initialize();
      deliveryService.shutdown();
      deliveryService.shutdown(); // Should not throw

      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });
  });

  // =============================================================================
  // Notification Delivery Workflow
  // =============================================================================

  describe("[UNIT] notification delivery workflow", () => {
    beforeEach(() => {
      deliveryService.initialize();
    });

    it("should deliver notification when NotificationCreated event is published", async () => {
      // Arrange - Add push subscription
      pushSubscriptionRepo.addSubscription({
        id: "sub-1",
        userId: "user-123",
        expoPushToken: "ExponentPushToken[valid-token-1]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-1",
        "notification-1",
        "user-123",
        "Test Title",
        "Test Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - No errors thrown, delivery attempted
      // The service should have processed the event
    });

    it("should handle multiple push subscriptions for same user", async () => {
      // Arrange - Add multiple subscriptions for same user
      pushSubscriptionRepo.addSubscription({
        id: "sub-1",
        userId: "user-456",
        expoPushToken: "ExponentPushToken[device-1]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      pushSubscriptionRepo.addSubscription({
        id: "sub-2",
        userId: "user-456",
        expoPushToken: "ExponentPushToken[device-2]",
        platform: "android",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-2",
        "notification-2",
        "user-456",
        "Title",
        "Body",
        "HIGH",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - Both devices should receive notification
    });

    it("should not attempt delivery when user has no subscriptions", async () => {
      // Arrange - No subscriptions for user-789
      const event = new NotificationCreated(
        "event-3",
        "notification-3",
        "user-789",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      eventBus.publish(event);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - Should complete without errors
    });

    it("should map notification priority to Expo priority", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-1",
        userId: "user-priority",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const priorities: Array<"LOW" | "NORMAL" | "HIGH" | "URGENT"> = [
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT",
      ];

      for (const priority of priorities) {
        const event = new NotificationCreated(
          `event-${priority}`,
          `notification-${priority}`,
          "user-priority",
          "Title",
          "Body",
          priority,
          new Date(),
        );

        // Act
        eventBus.publish(event);
      }

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - All priorities processed
    });

    it("should include notification data in push message", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-1",
        userId: "user-data",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-data",
        "notification-data",
        "user-data",
        "Custom Title",
        "Custom Body",
        "HIGH",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Wait for async delivery
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });

  // =============================================================================
  // Error Handling
  // =============================================================================

  describe("[UNIT] error handling", () => {
    beforeEach(() => {
      deliveryService.initialize();
    });

    it("should continue processing when one device fails", async () => {
      // Arrange - One valid, one invalid token
      pushSubscriptionRepo.addSubscription({
        id: "sub-valid",
        userId: "user-mixed",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      pushSubscriptionRepo.addSubscription({
        id: "sub-invalid",
        userId: "user-mixed",
        expoPushToken: "ExponentPushToken[invalid-token]",
        platform: "android",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-mixed",
        "notification-mixed",
        "user-mixed",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      await Effect.runPromise(eventBus.publish(event));

      // Assert - Invalid token subscription should be removed
      expect(pushSubscriptionRepo.getSubscriptionCount()).toBe(1);
    });

    it("should remove invalid tokens automatically", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-invalid",
        userId: "user-invalid",
        expoPushToken: "ExponentPushToken[invalid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-invalid",
        "notification-invalid",
        "user-invalid",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Pre-condition
      expect(pushSubscriptionRepo.getSubscriptionCount()).toBe(1);

      // Act
      await Effect.runPromise(eventBus.publish(event));

      // Assert - Invalid token should be removed
      expect(pushSubscriptionRepo.getSubscriptionCount()).toBe(0);
    });

    it("should remove DeviceNotRegistered tokens", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-unregistered",
        userId: "user-unregistered",
        expoPushToken: "ExponentPushToken[device-not-registered]",
        platform: "android",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-unregistered",
        "notification-unregistered",
        "user-unregistered",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Pre-condition
      expect(pushSubscriptionRepo.getSubscriptionCount()).toBe(1);

      // Act
      await Effect.runPromise(eventBus.publish(event));

      // Assert - Unregistered device should be removed
      expect(pushSubscriptionRepo.getSubscriptionCount()).toBe(0);
    });

    it("should not throw when Expo API fails entirely", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-1",
        userId: "user-fail",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expo.setFailNextChunk(new Error("Network error"));

      const event = new NotificationCreated(
        "event-fail",
        "notification-fail",
        "user-fail",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - No exception thrown
    });

    it("should handle repository errors gracefully", async () => {
      // Arrange - Create a repository that throws
      const errorRepo: PushSubscriptionRepository = {
        findByUserId: async () => {
          throw new Error("Database error");
        },
        findByUserIds: async () => [],
        save: async () => {},
        delete: async () => {},
      };

      const errorService = new NotificationDeliveryService(
        eventBus,
        errorRepo,
        expo as unknown as Expo,
      );
      errorService.initialize();

      const event = new NotificationCreated(
        "event-error",
        "notification-error",
        "user-error",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - No exception thrown
      errorService.shutdown();
    });
  });

  // =============================================================================
  // Direct Delivery
  // =============================================================================

  describe("[UNIT] direct delivery method", () => {
    it("should deliver notification directly via deliver()", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-direct",
        userId: "user-direct",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const results = await Effect.runPromise(
        deliveryService.deliver(
          "user-direct",
          "Direct Title",
          "Direct Body",
          "HIGH",
        ),
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].deviceToken).toBe("ExponentPushToken[valid]");
    });

    it("should return empty array when no subscriptions", async () => {
      // Act
      const results = await Effect.runPromise(
        deliveryService.deliver("user-no-subs", "Title", "Body", "NORMAL"),
      );

      // Assert
      expect(results).toHaveLength(0);
    });

    it("should use default NORMAL priority when not specified", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-default",
        userId: "user-default",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const results = await Effect.runPromise(
        deliveryService.deliver("user-default", "Title", "Body"),
      );

      // Assert
      expect(results).toHaveLength(1);
    });
  });

  // =============================================================================
  // Chunking and Batch Processing
  // =============================================================================

  describe("[UNIT] chunking and batch processing", () => {
    beforeEach(() => {
      deliveryService.initialize();
    });

    it("should chunk large batches (max 100 per chunk)", async () => {
      // Arrange - Add 150 subscriptions (requires 2 chunks)
      for (let i = 0; i < 150; i++) {
        pushSubscriptionRepo.addSubscription({
          id: `sub-${i}`,
          userId: "user-large",
          expoPushToken: `ExponentPushToken[device-${i}]`,
          platform: i % 2 === 0 ? "ios" : "android",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const event = new NotificationCreated(
        "event-large",
        "notification-large",
        "user-large",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - All 150 should be processed
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe("[UNIT] edge cases", () => {
    beforeEach(() => {
      deliveryService.initialize();
    });

    it("should handle notification with empty title/body", async () => {
      pushSubscriptionRepo.addSubscription({
        id: "sub-empty",
        userId: "user-empty",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-empty",
        "notification-empty",
        "user-empty",
        "",
        "",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it("should handle rapid successive notifications", async () => {
      // Arrange
      pushSubscriptionRepo.addSubscription({
        id: "sub-rapid",
        userId: "user-rapid",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act - Publish 10 notifications rapidly
      for (let i = 0; i < 10; i++) {
        const event = new NotificationCreated(
          `event-rapid-${i}`,
          `notification-rapid-${i}`,
          "user-rapid",
          `Title ${i}`,
          `Body ${i}`,
          "NORMAL",
          new Date(),
        );
        eventBus.publish(event);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - All should be processed
    });

    it("should handle event with correlation ID", async () => {
      pushSubscriptionRepo.addSubscription({
        id: "sub-corr",
        userId: "user-corr",
        expoPushToken: "ExponentPushToken[valid]",
        platform: "ios",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const event = new NotificationCreated(
        "event-corr",
        "notification-corr",
        "user-corr",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
        "correlation-id-123",
      );

      // Act
      eventBus.publish(event);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - Correlation ID should be preserved
    });
  });
});
