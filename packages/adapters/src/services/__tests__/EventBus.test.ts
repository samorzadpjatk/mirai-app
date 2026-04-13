import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { EventBus } from "../EventBus";
import type { DomainEvent } from "@mirai-app/domain";

// Create a simple test event
const createTestEvent = (type: string, payload: unknown): DomainEvent =>
  ({
    type,
    payload,
    occurredAt: new Date(),
  }) as DomainEvent;

describe("[UNIT] EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("publish/subscribe", () => {
    it("should deliver events to subscribers", async () => {
      const handler = mock(() => Effect.void);

      eventBus.subscribe("TestEvent", handler);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(handler).toHaveBeenCalled();
    });

    it("should support multiple subscribers", async () => {
      const handler1 = mock(() => Effect.void);
      const handler2 = mock(() => Effect.void);

      eventBus.subscribe("TestEvent", handler1);
      eventBus.subscribe("TestEvent", handler2);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it("should not call subscribers for different events", async () => {
      const handler = mock(() => Effect.void);

      eventBus.subscribe("EventA", handler);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("EventB", { data: "test" })),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle unsubscribe", async () => {
      const handler = mock(() => Effect.void);

      const subscription = eventBus.subscribe("TestEvent", handler);
      await Effect.runPromise(subscription.unsubscribe());
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should continue if one subscriber fails", async () => {
      const errorHandler = mock(() =>
        Effect.fail({
          _tag: "EventBusError",
          operation: "test",
          message: "Failed",
        } as any),
      );
      const successHandler = mock(() => Effect.void);

      eventBus.subscribe("TestEvent", errorHandler);
      eventBus.subscribe("TestEvent", successHandler);

      // Should not throw
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe("subscribeAll", () => {
    it("should deliver all events to wildcard subscriber", async () => {
      const wildcardHandler = mock(() => Effect.void);

      eventBus.subscribeAll(wildcardHandler);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("EventA", { data: "a" })),
      );
      await Effect.runPromise(
        eventBus.publish(createTestEvent("EventB", { data: "b" })),
      );

      expect(wildcardHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("subscribeLegacy", () => {
    it("should support legacy async handlers", async () => {
      const legacyHandler = mock(() => Promise.resolve());

      eventBus.subscribeLegacy("TestEvent", legacyHandler);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(legacyHandler).toHaveBeenCalled();
    });

    it("should support legacy sync handlers", async () => {
      const legacyHandler = mock(() => {});

      eventBus.subscribeLegacy("TestEvent", legacyHandler);
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(legacyHandler).toHaveBeenCalled();
    });

    it("should catch errors in legacy handlers", async () => {
      const errorHandler = mock(() => {
        throw new Error("Sync error");
      });
      const successHandler = mock(() => Effect.void);

      eventBus.subscribeLegacy("TestEvent", errorHandler);
      eventBus.subscribe("TestEvent", successHandler);

      // Should not throw
      await Effect.runPromise(
        eventBus.publish(createTestEvent("TestEvent", { data: "test" })),
      );

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe("publishFireAndForget", () => {
    it("should publish without blocking", () => {
      const handler = mock(() => Effect.void);

      eventBus.subscribe("TestEvent", handler);

      // Should not throw and not block
      eventBus.publishFireAndForget(
        createTestEvent("TestEvent", { data: "test" }),
      );

      // Handler will be called asynchronously
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("getHandlerCount", () => {
    it("should return correct handler count", () => {
      eventBus.subscribe("EventA", () => Effect.void);
      eventBus.subscribe("EventA", () => Effect.void);
      eventBus.subscribe("EventB", () => Effect.void);

      expect(eventBus.getHandlerCount("EventA")).toBe(2);
      expect(eventBus.getHandlerCount("EventB")).toBe(1);
      expect(eventBus.getHandlerCount("EventC")).toBe(0);
    });
  });

  describe("clear", () => {
    it("should remove all handlers", () => {
      eventBus.subscribe("EventA", () => Effect.void);
      eventBus.subscribe("EventB", () => Effect.void);

      eventBus.clear();

      expect(eventBus.getHandlerCount("EventA")).toBe(0);
      expect(eventBus.getHandlerCount("EventB")).toBe(0);
    });
  });
});
