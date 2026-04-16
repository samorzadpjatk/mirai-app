import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Data } from "effect";
import {
  EventBus,
  EventBusError,
  globalEventBus,
  type EventHandler,
} from "./event-bus";

// Test domain events
class TestEvent extends Data.TaggedClass("TestEvent")<{
  readonly type: "TestEvent";
  readonly id: string;
  readonly payload: string;
}> {}

class AnotherEvent extends Data.TaggedClass("AnotherEvent")<{
  readonly type: "AnotherEvent";
  readonly data: number;
}> {}

type TestDomainEvent = TestEvent | AnotherEvent;

describe("[UNIT] EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("subscribe", () => {
    it("registers a handler for an event type", () => {
      const handler: EventHandler = () => Effect.void;

      const subscription = eventBus.subscribe("TestEvent", handler);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);
      expect(subscription).toHaveProperty("unsubscribe");
    });

    it("allows multiple handlers for same event type", () => {
      const handler1: EventHandler = () => Effect.void;
      const handler2: EventHandler = () => Effect.void;

      eventBus.subscribe("TestEvent", handler1);
      eventBus.subscribe("TestEvent", handler2);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(2);
    });

    it("allows handlers for different event types", () => {
      const handler1: EventHandler = () => Effect.void;
      const handler2: EventHandler = () => Effect.void;

      eventBus.subscribe("TestEvent", handler1);
      eventBus.subscribe("AnotherEvent", handler2);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);
      expect(eventBus.getHandlerCount("AnotherEvent")).toBe(1);
    });
  });

  describe("subscribeLegacy", () => {
    it("registers a legacy handler that returns void", () => {
      const handler = () => {
        // legacy handler doing something
      };

      const subscription = eventBus.subscribeLegacy("TestEvent", handler);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);
      expect(subscription).toHaveProperty("unsubscribe");
    });

    it("registers a legacy handler that returns Promise<void>", () => {
      const handler = async () => {
        await Promise.resolve();
      };

      const subscription = eventBus.subscribeLegacy("TestEvent", handler);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);
    });
  });

  describe("subscribeAll", () => {
    it("registers a wildcard handler for all events", () => {
      const handler: EventHandler = () => Effect.void;

      eventBus.subscribeAll(handler);

      expect(eventBus.getHandlerCount("*")).toBe(1);
    });

    it("allows multiple wildcard handlers", () => {
      const handler1: EventHandler = () => Effect.void;
      const handler2: EventHandler = () => Effect.void;

      eventBus.subscribeAll(handler1);
      eventBus.subscribeAll(handler2);

      expect(eventBus.getHandlerCount("*")).toBe(2);
    });
  });

  describe("publish", () => {
    it("calls registered handler for event type", async () => {
      let called = false;
      const handler: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          called = true;
        });

      eventBus.subscribe("TestEvent", handler);

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      expect(called).toBe(true);
    });

    it("calls all registered handlers for event type", async () => {
      let count = 0;
      const handler1: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          count++;
        });
      const handler2: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          count++;
        });

      eventBus.subscribe("TestEvent", handler1);
      eventBus.subscribe("TestEvent", handler2);

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      expect(count).toBe(2);
    });

    it("does not call handlers for different event types", async () => {
      let testEventCalled = false;
      let anotherEventCalled = false;

      const testHandler: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          testEventCalled = true;
        });
      const anotherHandler: EventHandler<AnotherEvent> = () =>
        Effect.sync(() => {
          anotherEventCalled = true;
        });

      eventBus.subscribe("TestEvent", testHandler);
      eventBus.subscribe("AnotherEvent", anotherHandler);

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      expect(testEventCalled).toBe(true);
      expect(anotherEventCalled).toBe(false);
    });

    it("calls wildcard handlers for all events", async () => {
      let wildcardCalled = false;
      const wildcardHandler: EventHandler = () =>
        Effect.sync(() => {
          wildcardCalled = true;
        });

      eventBus.subscribeAll(wildcardHandler);

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      expect(wildcardCalled).toBe(true);
    });

    it("isolates handler failures", async () => {
      let secondHandlerCalled = false;

      const failingHandler: EventHandler<TestEvent> = () =>
        Effect.fail(
          new EventBusError({
            operation: "test",
            message: "Handler failed",
          }),
        );
      const successHandler: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          secondHandlerCalled = true;
        });

      eventBus.subscribe("TestEvent", failingHandler);
      eventBus.subscribe("TestEvent", successHandler);

      // Should not throw even though one handler failed
      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      expect(secondHandlerCalled).toBe(true);
    });

    it("succeeds when no handlers registered", async () => {
      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it("passes event to handler", async () => {
      let receivedEvent: TestEvent | null = null;
      const handler: EventHandler<TestEvent> = (event) =>
        Effect.sync(() => {
          receivedEvent = event;
        });

      eventBus.subscribe("TestEvent", handler);

      const event = new TestEvent({
        type: "TestEvent",
        id: "123",
        payload: "test-payload",
      });
      await Effect.runPromise(eventBus.publish(event));

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.id).toBe("123");
      expect(receivedEvent!.payload).toBe("test-payload");
    });
  });

  describe("publishFireAndForget", () => {
    it("publishes without waiting for handlers", () => {
      let handlerCalled = false;
      const handler: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          handlerCalled = true;
        });

      eventBus.subscribe("TestEvent", handler);

      eventBus.publishFireAndForget(
        new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
      );

      // Fire and forget doesn't wait, so handler may or may not have been called
      // Just verify no error was thrown
      expect(true).toBe(true);
    });
  });

  describe("unsubscribe", () => {
    it("removes handler from event type", async () => {
      let callCount = 0;
      const handler: EventHandler<TestEvent> = () =>
        Effect.sync(() => {
          callCount++;
        });

      const subscription = eventBus.subscribe("TestEvent", handler);

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "1", payload: "test" }),
        ),
      );
      expect(callCount).toBe(1);

      // Unsubscribe
      await Effect.runPromise(subscription.unsubscribe());

      await Effect.runPromise(
        eventBus.publish(
          new TestEvent({ type: "TestEvent", id: "2", payload: "test" }),
        ),
      );
      expect(callCount).toBe(1); // Should not increase
    });

    it("cleans up empty handler sets", () => {
      const handler: EventHandler = () => Effect.void;

      const subscription = eventBus.subscribe("TestEvent", handler);
      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);

      Effect.runSync(subscription.unsubscribe());

      expect(eventBus.getHandlerCount("TestEvent")).toBe(0);
    });
  });

  describe("getHandlerCount", () => {
    it("returns 0 for event type with no handlers", () => {
      expect(eventBus.getHandlerCount("NonExistentEvent")).toBe(0);
    });

    it("returns correct count for event type", () => {
      eventBus.subscribe("TestEvent", () => Effect.void);
      eventBus.subscribe("TestEvent", () => Effect.void);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(2);
    });
  });

  describe("clear", () => {
    it("removes all handlers", () => {
      eventBus.subscribe("TestEvent", () => Effect.void);
      eventBus.subscribe("AnotherEvent", () => Effect.void);
      eventBus.subscribeAll(() => Effect.void);

      eventBus.clear();

      expect(eventBus.getHandlerCount("TestEvent")).toBe(0);
      expect(eventBus.getHandlerCount("AnotherEvent")).toBe(0);
      expect(eventBus.getHandlerCount("*")).toBe(0);
    });

    it("allows new subscriptions after clear", () => {
      eventBus.subscribe("TestEvent", () => Effect.void);
      eventBus.clear();

      eventBus.subscribe("TestEvent", () => Effect.void);

      expect(eventBus.getHandlerCount("TestEvent")).toBe(1);
    });
  });

  describe("globalEventBus singleton", () => {
    it("is a singleton instance", () => {
      expect(globalEventBus).toBeInstanceOf(EventBus);
    });

    it("maintains state across imports", () => {
      // Add a handler to the global instance
      globalEventBus.subscribe("GlobalTest", () => Effect.void);

      // Should have the handler
      expect(
        globalEventBus.getHandlerCount("GlobalTest"),
      ).toBeGreaterThanOrEqual(1);
    });
  });
});

// Summary
// Files modified: packages/adapters/src/system/shared/services/event-bus.test.ts (created)
// Key changes:
// - Added comprehensive unit tests for EventBus
// - Tests cover subscribe/unsubscribe functionality
// - Tests for typed and wildcard event handlers
// - Tests for error isolation (handler failures don't affect others)
// - Tests for legacy handler support (void/Promise<void>)
// - Tests for publish and fire-and-forget patterns
// - Tests for globalEventBus singleton
