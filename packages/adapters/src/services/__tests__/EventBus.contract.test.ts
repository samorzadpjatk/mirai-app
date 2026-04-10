import { describe, it, expect, beforeEach } from "bun:test";
import { EventBus } from "../EventBus";
import {
  NotificationCreated,
  LocationUpdated,
  UserOnline,
  type AnyDomainEvent,
} from "@mirai-app/domain";

describe("[CONTRACT] EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  // =============================================================================
  // Subscribe/Publish Workflow
  // =============================================================================

  describe("subscribe/publish workflow", () => {
    it("should deliver event to subscribed handler", () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];
      const handler = (event: AnyDomainEvent) => {
        receivedEvents.push(event);
      };

      eventBus.subscribe("NotificationCreated", handler);

      const event = new NotificationCreated(
        "event-1",
        "notification-1",
        "user-1",
        "Test Title",
        "Test Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);
      expect(receivedEvents[0].type).toBe("NotificationCreated");
    });

    it("should not deliver events to unsubscribed handlers", () => {
      // Arrange
      const handlerCalls: string[] = [];

      const sub1 = eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("handler1");
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("handler2");
      });

      // Unsubscribe first handler
      sub1.unsubscribe();

      const event = new NotificationCreated(
        "event-2",
        "notification-2",
        "user-2",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(handlerCalls).toHaveLength(1);
      expect(handlerCalls[0]).toBe("handler2");
    });

    it("should only deliver events matching the subscribed type", () => {
      // Arrange
      const notificationEvents: AnyDomainEvent[] = [];
      const locationEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        notificationEvents.push(event);
      });

      eventBus.subscribe("LocationUpdated", (event) => {
        locationEvents.push(event);
      });

      const notificationEvent = new NotificationCreated(
        "event-3",
        "notification-3",
        "user-3",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(notificationEvent);

      // Assert
      expect(notificationEvents).toHaveLength(1);
      expect(locationEvents).toHaveLength(0);
    });
  });

  // =============================================================================
  // Multiple Subscribers for Same Event
  // =============================================================================

  describe("multiple subscribers for same event", () => {
    it("should deliver to all subscribers of the same event type", () => {
      // Arrange
      const handlerCalls: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber1");
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber2");
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber3");
      });

      const event = new NotificationCreated(
        "event-4",
        "notification-4",
        "user-4",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(handlerCalls).toHaveLength(3);
      expect(handlerCalls).toContain("subscriber1");
      expect(handlerCalls).toContain("subscriber2");
      expect(handlerCalls).toContain("subscriber3");
    });

    it("should maintain subscription order for delivery", () => {
      // Arrange
      const deliveryOrder: number[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        deliveryOrder.push(1);
      });

      eventBus.subscribe("NotificationCreated", () => {
        deliveryOrder.push(2);
      });

      eventBus.subscribe("NotificationCreated", () => {
        deliveryOrder.push(3);
      });

      const event = new NotificationCreated(
        "event-5",
        "notification-5",
        "user-5",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(deliveryOrder).toEqual([1, 2, 3]);
    });

    it("should allow selective unsubscription without affecting others", () => {
      // Arrange
      const activeHandlers: string[] = [];

      const sub1 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler1");
      });

      const sub2 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler2");
      });

      const sub3 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler3");
      });

      // Unsubscribe middle handler
      sub2.unsubscribe();

      const event = new NotificationCreated(
        "event-6",
        "notification-6",
        "user-6",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(activeHandlers).toHaveLength(2);
      expect(activeHandlers).toContain("handler1");
      expect(activeHandlers).not.toContain("handler2");
      expect(activeHandlers).toContain("handler3");
    });
  });

  // =============================================================================
  // Wildcard Subscription (subscribeAll)
  // =============================================================================

  describe("wildcard subscription (subscribeAll)", () => {
    it("should receive all events regardless of type", () => {
      // Arrange
      const allEvents: AnyDomainEvent[] = [];

      eventBus.subscribeAll((event) => {
        allEvents.push(event);
      });

      const notificationEvent = new NotificationCreated(
        "event-7",
        "notification-7",
        "user-7",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      const locationEvent = new LocationUpdated(
        "event-8",
        "user-8",
        40.7128,
        -74.006,
        10,
        null,
        null,
        new Date(),
      );

      const userOnlineEvent = new UserOnline("event-9", "user-9", new Date());

      // Act
      eventBus.publish(notificationEvent);
      eventBus.publish(locationEvent);
      eventBus.publish(userOnlineEvent);

      // Assert
      expect(allEvents).toHaveLength(3);
      expect(allEvents[0].type).toBe("NotificationCreated");
      expect(allEvents[1].type).toBe("LocationUpdated");
      expect(allEvents[2].type).toBe("UserOnline");
    });

    it("should receive events in addition to typed subscribers", () => {
      // Arrange
      const typedEvents: AnyDomainEvent[] = [];
      const allEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        typedEvents.push(event);
      });

      eventBus.subscribeAll((event) => {
        allEvents.push(event);
      });

      const event = new NotificationCreated(
        "event-10",
        "notification-10",
        "user-10",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(typedEvents).toHaveLength(1);
      expect(allEvents).toHaveLength(1);
      expect(typedEvents[0]).toBe(event);
      expect(allEvents[0]).toBe(event);
    });

    it("should allow unsubscribing from wildcard without affecting typed subscriptions", () => {
      // Arrange
      const typedEvents: AnyDomainEvent[] = [];
      const wildcardEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        typedEvents.push(event);
      });

      const wildcardSub = eventBus.subscribeAll((event) => {
        wildcardEvents.push(event);
      });

      const event1 = new NotificationCreated(
        "event-11",
        "notification-11",
        "user-11",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Publish before unsubscribe
      eventBus.publish(event1);

      // Assert - Both should receive
      expect(typedEvents).toHaveLength(1);
      expect(wildcardEvents).toHaveLength(1);

      // Unsubscribe wildcard
      wildcardSub.unsubscribe();

      const event2 = new NotificationCreated(
        "event-12",
        "notification-12",
        "user-12",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Publish after unsubscribe
      eventBus.publish(event2);

      // Assert - Only typed should receive
      expect(typedEvents).toHaveLength(2);
      expect(wildcardEvents).toHaveLength(1);
    });
  });

  // =============================================================================
  // Unsubscribe Functionality
  // =============================================================================

  describe("unsubscribe functionality", () => {
    it("should stop receiving events after unsubscribe", () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      const subscription = eventBus.subscribe(
        "NotificationCreated",
        (event) => {
          events.push(event);
        },
      );

      const event1 = new NotificationCreated(
        "event-13",
        "notification-13",
        "user-13",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Publish and unsubscribe
      eventBus.publish(event1);
      subscription.unsubscribe();

      const event2 = new NotificationCreated(
        "event-14",
        "notification-14",
        "user-14",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      eventBus.publish(event2);

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event1);
    });

    it("should clean up empty handler sets after unsubscribe", () => {
      // Arrange
      const subscription = eventBus.subscribe("NotificationCreated", () => {});

      // Pre-condition: handler should exist
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);

      // Act
      subscription.unsubscribe();

      // Assert: handler set should be cleaned up
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });

    it("should allow multiple subscribe/unsubscribe cycles", () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      // Subscribe and publish
      const sub1 = eventBus.subscribe("NotificationCreated", (event) => {
        events.push(event);
      });

      const event1 = new NotificationCreated(
        "event-15",
        "notification-15",
        "user-15",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );
      eventBus.publish(event1);
      expect(events).toHaveLength(1);

      // Unsubscribe
      sub1.unsubscribe();

      // Publish again (should not receive)
      const event2 = new NotificationCreated(
        "event-16",
        "notification-16",
        "user-16",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );
      eventBus.publish(event2);
      expect(events).toHaveLength(1);

      // Re-subscribe
      const sub2 = eventBus.subscribe("NotificationCreated", (event) => {
        events.push(event);
      });

      // Publish again (should receive)
      const event3 = new NotificationCreated(
        "event-17",
        "notification-17",
        "user-17",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );
      eventBus.publish(event3);
      expect(events).toHaveLength(2);

      // Cleanup
      sub2.unsubscribe();
    });

    it("should safely handle unsubscribe of already-unsubscribed handler", () => {
      // Arrange
      const subscription = eventBus.subscribe("NotificationCreated", () => {});

      // Act - Unsubscribe twice (should not throw)
      subscription.unsubscribe();
      subscription.unsubscribe(); // Should be safe

      // Assert
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });
  });

  // =============================================================================
  // Error Isolation
  // =============================================================================

  describe("error isolation", () => {
    it("should continue delivering to other handlers when one throws", () => {
      // Arrange
      const receivedEvents: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        receivedEvents.push("before-error");
      });

      eventBus.subscribe("NotificationCreated", () => {
        throw new Error("Handler error");
      });

      eventBus.subscribe("NotificationCreated", () => {
        receivedEvents.push("after-error");
      });

      const event = new NotificationCreated(
        "event-18",
        "notification-18",
        "user-18",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      expect(() => eventBus.publish(event)).not.toThrow();

      // Assert
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain("before-error");
      expect(receivedEvents).toContain("after-error");
    });

    it("should continue delivering when async handler rejects", async () => {
      // Arrange
      const receivedEvents: string[] = [];

      eventBus.subscribe("NotificationCreated", async () => {
        receivedEvents.push("before-async-error");
      });

      eventBus.subscribe("NotificationCreated", async () => {
        throw new Error("Async handler error");
      });

      eventBus.subscribe("NotificationCreated", async () => {
        receivedEvents.push("after-async-error");
      });

      const event = new NotificationCreated(
        "event-19",
        "notification-19",
        "user-19",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Wait for async handlers to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain("before-async-error");
      expect(receivedEvents).toContain("after-async-error");
    });

    it("should isolate errors across different event types", () => {
      // Arrange
      const notificationEvents: string[] = [];
      const locationEvents: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        throw new Error("Notification handler error");
      });

      eventBus.subscribe("NotificationCreated", () => {
        notificationEvents.push("received");
      });

      eventBus.subscribe("LocationUpdated", () => {
        locationEvents.push("received");
      });

      const notification = new NotificationCreated(
        "event-20",
        "notification-20",
        "user-20",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      const location = new LocationUpdated(
        "event-21",
        "user-21",
        40.7128,
        -74.006,
        10,
        null,
        null,
        new Date(),
      );

      // Act
      expect(() => eventBus.publish(notification)).not.toThrow();
      eventBus.publish(location);

      // Assert
      expect(notificationEvents).toContain("received");
      expect(locationEvents).toContain("received");
    });
  });

  // =============================================================================
  // Async Handler Support
  // =============================================================================

  describe("async handler support", () => {
    it("should support async handlers", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", async (event) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        receivedEvents.push(event);
      });

      const event = new NotificationCreated(
        "event-22",
        "notification-22",
        "user-22",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Assert
      expect(receivedEvents).toHaveLength(1);
    });

    it("should not block publish on async handlers", () => {
      // Arrange
      let handlerExecuted = false;

      eventBus.subscribe("NotificationCreated", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        handlerExecuted = true;
      });

      const event = new NotificationCreated(
        "event-23",
        "notification-23",
        "user-23",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      const startTime = Date.now();
      eventBus.publish(event);
      const publishTime = Date.now() - startTime;

      // Assert - Publish should be synchronous
      expect(publishTime).toBeLessThan(10);
      expect(handlerExecuted).toBe(false); // Handler hasn't executed yet
    });

    it("should execute multiple async handlers concurrently", async () => {
      // Arrange
      const executionTimes: number[] = [];

      eventBus.subscribe("NotificationCreated", async () => {
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 30));
        executionTimes.push(Date.now() - start);
      });

      eventBus.subscribe("NotificationCreated", async () => {
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 30));
        executionTimes.push(Date.now() - start);
      });

      eventBus.subscribe("NotificationCreated", async () => {
        const start = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 30));
        executionTimes.push(Date.now() - start);
      });

      const event = new NotificationCreated(
        "event-24",
        "notification-24",
        "user-24",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      const startTime = Date.now();
      eventBus.publish(event);

      // Wait for all handlers
      await new Promise((resolve) => setTimeout(resolve, 100));

      const totalTime = Date.now() - startTime;

      // Assert - Total time should be ~30ms (concurrent), not ~90ms (sequential)
      // Allow for some timing variance in CI environments
      expect(totalTime).toBeLessThan(120);
      expect(executionTimes).toHaveLength(3);
    });
  });

  // =============================================================================
  // Event Type Safety
  // =============================================================================

  describe("event type safety", () => {
    it("should maintain type information in delivered events", () => {
      // Arrange
      let receivedEvent: AnyDomainEvent | null = null;

      eventBus.subscribe("NotificationCreated", (event) => {
        receivedEvent = event;
      });

      const event = new NotificationCreated(
        "event-25",
        "notification-25",
        "user-25",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.type).toBe("NotificationCreated");
      expect(receivedEvent!.id).toBe("event-25");
    });

    it("should deliver correct event properties", () => {
      // Arrange
      let receivedEvent: NotificationCreated | null = null;

      eventBus.subscribe("NotificationCreated", (event) => {
        if (event.type === "NotificationCreated") {
          receivedEvent = event as NotificationCreated;
        }
      });

      const occurredAt = new Date("2024-01-15T10:30:00Z");
      const event = new NotificationCreated(
        "event-26",
        "notification-26",
        "user-26",
        "Important Title",
        "Important Body",
        "HIGH",
        occurredAt,
        "correlation-123",
      );

      // Act
      eventBus.publish(event);

      // Assert
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.notificationId).toBe("notification-26");
      expect(receivedEvent!.recipientId).toBe("user-26");
      expect(receivedEvent!.title).toBe("Important Title");
      expect(receivedEvent!.body).toBe("Important Body");
      expect(receivedEvent!.priority).toBe("HIGH");
      expect(receivedEvent!.occurredAt).toBe(occurredAt);
      expect(receivedEvent!.correlationId).toBe("correlation-123");
    });

    it("should support all domain event types", () => {
      // Arrange
      const receivedTypes: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        receivedTypes.push("NotificationCreated");
      });

      eventBus.subscribe("LocationUpdated", () => {
        receivedTypes.push("LocationUpdated");
      });

      eventBus.subscribe("UserOnline", () => {
        receivedTypes.push("UserOnline");
      });

      eventBus.subscribe("UserOffline", () => {
        receivedTypes.push("UserOffline");
      });

      // Act
      eventBus.publish(
        new NotificationCreated(
          "e1",
          "n1",
          "u1",
          "Title",
          "Body",
          "NORMAL",
          new Date(),
        ),
      );

      eventBus.publish(
        new LocationUpdated(
          "e2",
          "u2",
          40.0,
          -74.0,
          10,
          null,
          null,
          new Date(),
        ),
      );

      eventBus.publish(new UserOnline("e3", "u3", new Date()));

      // Assert
      expect(receivedTypes).toContain("NotificationCreated");
      expect(receivedTypes).toContain("LocationUpdated");
      expect(receivedTypes).toContain("UserOnline");
    });
  });

  // =============================================================================
  // Clear and getHandlerCount
  // =============================================================================

  describe("clear and getHandlerCount", () => {
    it("should clear all handlers", () => {
      // Arrange
      eventBus.subscribe("NotificationCreated", () => {});
      eventBus.subscribe("LocationUpdated", () => {});
      eventBus.subscribeAll(() => {});

      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);
      expect(eventBus.getHandlerCount("LocationUpdated")).toBe(1);
      expect(eventBus.getHandlerCount("*")).toBe(1);

      // Act
      eventBus.clear();

      // Assert
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
      expect(eventBus.getHandlerCount("LocationUpdated")).toBe(0);
      expect(eventBus.getHandlerCount("*")).toBe(0);
    });

    it("should return correct handler count for event type", () => {
      // Arrange
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);

      eventBus.subscribe("NotificationCreated", () => {});
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);

      eventBus.subscribe("NotificationCreated", () => {});
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(2);

      // Different event type should be separate
      eventBus.subscribe("LocationUpdated", () => {});
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(2);
      expect(eventBus.getHandlerCount("LocationUpdated")).toBe(1);
    });

    it("should return 0 for unknown event types", () => {
      expect(eventBus.getHandlerCount("UnknownEvent")).toBe(0);
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe("edge cases", () => {
    it("should handle publishing with no subscribers gracefully", () => {
      const event = new NotificationCreated(
        "event-27",
        "notification-27",
        "user-27",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Should not throw
      expect(() => eventBus.publish(event)).not.toThrow();
    });

    it("should handle multiple publishes of the same event instance", () => {
      // Arrange
      const receivedCount = { value: 0 };

      eventBus.subscribe("NotificationCreated", () => {
        receivedCount.value++;
      });

      const event = new NotificationCreated(
        "event-28",
        "notification-28",
        "user-28",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      eventBus.publish(event);
      eventBus.publish(event);
      eventBus.publish(event);

      // Assert
      expect(receivedCount.value).toBe(3);
    });

    it("should maintain state isolation between EventBus instances", () => {
      // Arrange
      const bus1 = new EventBus();
      const bus2 = new EventBus();

      const bus1Events: AnyDomainEvent[] = [];
      const bus2Events: AnyDomainEvent[] = [];

      bus1.subscribe("NotificationCreated", (event) => {
        bus1Events.push(event);
      });

      bus2.subscribe("NotificationCreated", (event) => {
        bus2Events.push(event);
      });

      const event = new NotificationCreated(
        "event-29",
        "notification-29",
        "user-29",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      bus1.publish(event);

      // Assert
      expect(bus1Events).toHaveLength(1);
      expect(bus2Events).toHaveLength(0);
    });

    it("should handle rapid subscribe/unsubscribe cycles", () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      // Act - Rapid cycles
      for (let i = 0; i < 100; i++) {
        const sub = eventBus.subscribe("NotificationCreated", () => {
          events.push({} as AnyDomainEvent);
        });
        sub.unsubscribe();
      }

      const event = new NotificationCreated(
        "event-30",
        "notification-30",
        "user-30",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );
      eventBus.publish(event);

      // Assert - No handlers should be active
      expect(events).toHaveLength(0);
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });
  });
});
