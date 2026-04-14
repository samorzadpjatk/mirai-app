import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { EventBus } from "../EventBus";
import {
  NotificationCreated,
  LocationUpdated,
  UserOnline,
  type AnyDomainEvent,
} from "@mirai-app/domain";

describe("[UNIT] [CONTRACT] EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  // =============================================================================
  // Subscribe/Publish Workflow
  // =============================================================================

  describe("[UNIT] ""subscribe/publish workflow () => {
    it("should deliver event to subscribed handler", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];
      const handler = (event: AnyDomainEvent) => {
        receivedEvents.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);
      expect(receivedEvents[0].type).toBe("NotificationCreated");
    });

    it("should not deliver events to unsubscribed handlers", async () => {
      // Arrange
      const handlerCalls: string[] = [];

      const sub1 = eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("handler1");
        return Effect.void;
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("handler2");
        return Effect.void;
      });

      // Unsubscribe first handler
      await Effect.runPromise(sub1.unsubscribe());

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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(handlerCalls).toHaveLength(1);
      expect(handlerCalls[0]).toBe("handler2");
    });

    it("should only deliver events matching the subscribed type", async () => {
      // Arrange
      const notificationEvents: AnyDomainEvent[] = [];
      const locationEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        notificationEvents.push(event);
        return Effect.void;
      });

      eventBus.subscribe("LocationUpdated", (event) => {
        locationEvents.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(notificationEvent));

      // Assert
      expect(notificationEvents).toHaveLength(1);
      expect(locationEvents).toHaveLength(0);
    });
  });

  // =============================================================================
  // Multiple Subscribers for Same Event
  // =============================================================================

  describe("[UNIT] multiple subscribers for same event", () => {
    it("should deliver to all subscribers of the same event type", async () => {
      // Arrange
      const handlerCalls: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber1");
        return Effect.void;
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber2");
        return Effect.void;
      });

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalls.push("subscriber3");
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(handlerCalls).toHaveLength(3);
      expect(handlerCalls).toContain("subscriber1");
      expect(handlerCalls).toContain("subscriber2");
      expect(handlerCalls).toContain("subscriber3");
    });

    it("should allow selective unsubscription without affecting others", async () => {
      // Arrange
      const activeHandlers: string[] = [];

      const sub1 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler1");
        return Effect.void;
      });

      const sub2 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler2");
        return Effect.void;
      });

      const sub3 = eventBus.subscribe("NotificationCreated", () => {
        activeHandlers.push("handler3");
        return Effect.void;
      });

      // Unsubscribe middle handler
      await Effect.runPromise(sub2.unsubscribe());

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
      await Effect.runPromise(eventBus.publish(event));

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

  describe("[UNIT] wildcard subscription (subscribeAll)", () => {
    it("should receive all events regardless of type", async () => {
      // Arrange
      const allEvents: AnyDomainEvent[] = [];

      eventBus.subscribeAll((event) => {
        allEvents.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(notificationEvent));
      await Effect.runPromise(eventBus.publish(locationEvent));
      await Effect.runPromise(eventBus.publish(userOnlineEvent));

      // Assert
      expect(allEvents).toHaveLength(3);
      expect(allEvents[0].type).toBe("NotificationCreated");
      expect(allEvents[1].type).toBe("LocationUpdated");
      expect(allEvents[2].type).toBe("UserOnline");
    });

    it("should receive events in addition to typed subscribers", async () => {
      // Arrange
      const typedEvents: AnyDomainEvent[] = [];
      const allEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        typedEvents.push(event);
        return Effect.void;
      });

      eventBus.subscribeAll((event) => {
        allEvents.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(typedEvents).toHaveLength(1);
      expect(allEvents).toHaveLength(1);
      expect(typedEvents[0]).toBe(event);
      expect(allEvents[0]).toBe(event);
    });

    it("should allow unsubscribing from wildcard without affecting typed subscriptions", async () => {
      // Arrange
      const typedEvents: AnyDomainEvent[] = [];
      const wildcardEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) => {
        typedEvents.push(event);
        return Effect.void;
      });

      const wildcardSub = eventBus.subscribeAll((event) => {
        wildcardEvents.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event1));

      // Assert - Both should receive
      expect(typedEvents).toHaveLength(1);
      expect(wildcardEvents).toHaveLength(1);

      // Unsubscribe wildcard
      await Effect.runPromise(wildcardSub.unsubscribe());

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
      await Effect.runPromise(eventBus.publish(event2));

      // Assert - Only typed should receive
      expect(typedEvents).toHaveLength(2);
      expect(wildcardEvents).toHaveLength(1);
    });
  });

  // =============================================================================
  // Unsubscribe Functionality
  // =============================================================================

  describe("[UNIT] unsubscribe functionality", () => {
    it("should stop receiving events after unsubscribe", async () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      const subscription = eventBus.subscribe(
        "NotificationCreated",
        (event) => {
          events.push(event);
          return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event1));
      await Effect.runPromise(subscription.unsubscribe());

      const event2 = new NotificationCreated(
        "event-14",
        "notification-14",
        "user-14",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      await Effect.runPromise(eventBus.publish(event2));

      // Assert
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event1);
    });

    it("should clean up empty handler sets after unsubscribe", async () => {
      // Arrange
      const subscription = eventBus.subscribe(
        "NotificationCreated",
        () => Effect.void,
      );

      // Pre-condition: handler should exist
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);

      // Act
      await Effect.runPromise(subscription.unsubscribe());

      // Assert: handler set should be cleaned up
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });

    it("should allow multiple subscribe/unsubscribe cycles", async () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      // Subscribe and publish
      const sub1 = eventBus.subscribe("NotificationCreated", (event) => {
        events.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event1));
      expect(events).toHaveLength(1);

      // Unsubscribe
      await Effect.runPromise(sub1.unsubscribe());

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
      await Effect.runPromise(eventBus.publish(event2));
      expect(events).toHaveLength(1);

      // Re-subscribe
      const sub2 = eventBus.subscribe("NotificationCreated", (event) => {
        events.push(event);
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event3));
      expect(events).toHaveLength(2);

      // Cleanup
      await Effect.runPromise(sub2.unsubscribe());
    });

    it("should safely handle unsubscribe of already-unsubscribed handler", async () => {
      // Arrange
      const subscription = eventBus.subscribe(
        "NotificationCreated",
        () => Effect.void,
      );

      // Act - Unsubscribe twice (should not throw)
      await Effect.runPromise(subscription.unsubscribe());
      await Effect.runPromise(subscription.unsubscribe()); // Should be safe

      // Assert
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });
  });

  // =============================================================================
  // Error Isolation
  // =============================================================================

  describe("[UNIT] error isolation", () => {
    it("should continue delivering to other handlers when one fails", async () => {
      // Arrange
      const receivedEvents: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        receivedEvents.push("before-error");
        return Effect.void;
      });

      eventBus.subscribe("NotificationCreated", () => {
        return Effect.fail({
          _tag: "EventBusError",
          operation: "test",
          message: "Handler error",
        } as any);
      });

      eventBus.subscribe("NotificationCreated", () => {
        receivedEvents.push("after-error");
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents).toContain("before-error");
      expect(receivedEvents).toContain("after-error");
    });

    it("should isolate errors across different event types", async () => {
      // Arrange
      const notificationEvents: string[] = [];
      const locationEvents: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        return Effect.fail({
          _tag: "EventBusError",
          operation: "test",
          message: "Notification handler error",
        } as any);
      });

      eventBus.subscribe("NotificationCreated", () => {
        notificationEvents.push("received");
        return Effect.void;
      });

      eventBus.subscribe("LocationUpdated", () => {
        locationEvents.push("received");
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(notification));
      await Effect.runPromise(eventBus.publish(location));

      // Assert
      expect(notificationEvents).toContain("received");
      expect(locationEvents).toContain("received");
    });
  });

  // =============================================================================
  // Effect Handler Support
  // =============================================================================

  describe("[UNIT] Effect handler support", () => {
    it("should support Effect handlers", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) =>
        Effect.sync(() => receivedEvents.push(event)),
      );

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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(1);
    });

    it("should execute async Effect handlers", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];

      eventBus.subscribe("NotificationCreated", (event) =>
        Effect.tryPromise({
          try: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            receivedEvents.push(event);
          },
          catch: () => new Error("Failed"),
        }),
      );

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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(1);
    });
  });

  // =============================================================================
  // Legacy Handler Support
  // =============================================================================

  describe("[UNIT] legacy handler support (subscribeLegacy)", () => {
    it("should support legacy async handlers", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];

      eventBus.subscribeLegacy("NotificationCreated", async (event) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        receivedEvents.push(event);
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(1);
    });

    it("should support legacy sync handlers", async () => {
      // Arrange
      const receivedEvents: AnyDomainEvent[] = [];

      eventBus.subscribeLegacy("NotificationCreated", (event) => {
        receivedEvents.push(event);
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toHaveLength(1);
    });

    it("should catch errors in legacy handlers", async () => {
      // Arrange
      const receivedEvents: string[] = [];

      eventBus.subscribeLegacy("NotificationCreated", () => {
        throw new Error("Legacy error");
      });

      eventBus.subscribe("NotificationCreated", () => {
        receivedEvents.push("success");
        return Effect.void;
      });

      const event = new NotificationCreated(
        "event-26",
        "notification-26",
        "user-26",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not throw
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvents).toContain("success");
    });
  });

  // =============================================================================
  // Fire-and-Forget
  // =============================================================================

  describe("[UNIT] publishFireAndForget", () => {
    it("should publish without blocking", () => {
      // Arrange
      let handlerCalled = false;

      eventBus.subscribe("NotificationCreated", () => {
        handlerCalled = true;
        return Effect.void;
      });

      const event = new NotificationCreated(
        "event-27",
        "notification-27",
        "user-27",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act - Should not block
      eventBus.publishFireAndForget(event);

      // Assert - Handler is called asynchronously
      expect(handlerCalled).toBe(true);
    });
  });

  // =============================================================================
  // Event Type Safety
  // =============================================================================

  describe("[UNIT] event type safety", () => {
    it("should maintain type information in delivered events", async () => {
      // Arrange
      let receivedEvent: AnyDomainEvent | null = null;

      eventBus.subscribe("NotificationCreated", (event) => {
        receivedEvent = event;
        return Effect.void;
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
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.type).toBe("NotificationCreated");
      expect(receivedEvent!.id).toBe("event-28");
    });

    it("should deliver correct event properties", async () => {
      // Arrange
      let receivedEvent: NotificationCreated | null = null;

      eventBus.subscribe("NotificationCreated", (event) => {
        if (event.type === "NotificationCreated") {
          receivedEvent = event as NotificationCreated;
        }
        return Effect.void;
      });

      const occurredAt = new Date("2024-01-15T10:30:00Z");
      const event = new NotificationCreated(
        "event-29",
        "notification-29",
        "user-29",
        "Important Title",
        "Important Body",
        "HIGH",
        occurredAt,
        "correlation-123",
      );

      // Act
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.notificationId).toBe("notification-29");
      expect(receivedEvent!.recipientId).toBe("user-29");
      expect(receivedEvent!.title).toBe("Important Title");
      expect(receivedEvent!.body).toBe("Important Body");
      expect(receivedEvent!.priority).toBe("HIGH");
      expect(receivedEvent!.occurredAt).toBe(occurredAt);
      expect(receivedEvent!.correlationId).toBe("correlation-123");
    });

    it("should support all domain event types", async () => {
      // Arrange
      const receivedTypes: string[] = [];

      eventBus.subscribe("NotificationCreated", () => {
        receivedTypes.push("NotificationCreated");
        return Effect.void;
      });

      eventBus.subscribe("LocationUpdated", () => {
        receivedTypes.push("LocationUpdated");
        return Effect.void;
      });

      eventBus.subscribe("UserOnline", () => {
        receivedTypes.push("UserOnline");
        return Effect.void;
      });

      eventBus.subscribe("UserOffline", () => {
        receivedTypes.push("UserOffline");
        return Effect.void;
      });

      // Act
      await Effect.runPromise(
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
        ),
      );

      await Effect.runPromise(
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
        ),
      );

      await Effect.runPromise(
        eventBus.publish(new UserOnline("e3", "u3", new Date())),
      );

      // Assert
      expect(receivedTypes).toContain("NotificationCreated");
      expect(receivedTypes).toContain("LocationUpdated");
      expect(receivedTypes).toContain("UserOnline");
    });
  });

  // =============================================================================
  // Clear and getHandlerCount
  // =============================================================================

  describe("[UNIT] clear and getHandlerCount", () => {
    it("should clear all handlers", () => {
      // Arrange
      eventBus.subscribe("NotificationCreated", () => Effect.void);
      eventBus.subscribe("LocationUpdated", () => Effect.void);
      eventBus.subscribeAll(() => Effect.void);

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

      eventBus.subscribe("NotificationCreated", () => Effect.void);
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(1);

      eventBus.subscribe("NotificationCreated", () => Effect.void);
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(2);

      // Different event type should be separate
      eventBus.subscribe("LocationUpdated", () => Effect.void);
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

  describe("[UNIT] edge cases", () => {
    it("should handle publishing with no subscribers gracefully", async () => {
      const event = new NotificationCreated(
        "event-30",
        "notification-30",
        "user-30",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Should not throw
      await Effect.runPromise(eventBus.publish(event));
    });

    it("should handle multiple publishes of the same event instance", async () => {
      // Arrange
      let receivedCount = { value: 0 };

      eventBus.subscribe("NotificationCreated", () => {
        receivedCount.value++;
        return Effect.void;
      });

      const event = new NotificationCreated(
        "event-31",
        "notification-31",
        "user-31",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      await Effect.runPromise(eventBus.publish(event));
      await Effect.runPromise(eventBus.publish(event));
      await Effect.runPromise(eventBus.publish(event));

      // Assert
      expect(receivedCount.value).toBe(3);
    });

    it("should maintain state isolation between EventBus instances", async () => {
      // Arrange
      const bus1 = new EventBus();
      const bus2 = new EventBus();

      const bus1Events: AnyDomainEvent[] = [];
      const bus2Events: AnyDomainEvent[] = [];

      bus1.subscribe("NotificationCreated", (event) => {
        bus1Events.push(event);
        return Effect.void;
      });

      bus2.subscribe("NotificationCreated", (event) => {
        bus2Events.push(event);
        return Effect.void;
      });

      const event = new NotificationCreated(
        "event-32",
        "notification-32",
        "user-32",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );

      // Act
      await Effect.runPromise(bus1.publish(event));

      // Assert
      expect(bus1Events).toHaveLength(1);
      expect(bus2Events).toHaveLength(0);
    });

    it("should handle rapid subscribe/unsubscribe cycles", async () => {
      // Arrange
      const events: AnyDomainEvent[] = [];

      // Act - Rapid cycles
      for (let i = 0; i < 100; i++) {
        const sub = eventBus.subscribe("NotificationCreated", () => {
          events.push({} as AnyDomainEvent);
          return Effect.void;
        });
        await Effect.runPromise(sub.unsubscribe());
      }

      const event = new NotificationCreated(
        "event-33",
        "notification-33",
        "user-33",
        "Title",
        "Body",
        "NORMAL",
        new Date(),
      );
      await Effect.runPromise(eventBus.publish(event));

      // Assert - No handlers should be active
      expect(events).toHaveLength(0);
      expect(eventBus.getHandlerCount("NotificationCreated")).toBe(0);
    });
  });
});
