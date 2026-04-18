import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import type { IDomainEvent, IEventBusPort, IEventHandler } from "./index";
import type { IPortError } from "../errors/ports";

describe("[UNIT] IDomainEvent", () => {
  it("defines required fields", () => {
    // Create a concrete implementation to verify interface structure
    class TestEvent implements IDomainEvent {
      readonly _tag = "TestEvent";
      readonly aggregateId = "test-123";
      readonly occurredAt = new Date("2024-01-01");
      readonly version = 1;
    }

    const event = new TestEvent();

    expect(event._tag).toBe("TestEvent");
    expect(event.aggregateId).toBe("test-123");
    expect(event.occurredAt).toEqual(new Date("2024-01-01"));
    expect(event.version).toBe(1);
  });

  it("enforces immutability via readonly fields", () => {
    class TestEvent implements IDomainEvent {
      readonly _tag = "TestEvent";
      readonly aggregateId = "test-123";
      readonly occurredAt = new Date("2024-01-01");
      readonly version = 1;
    }

    const event = new TestEvent();

    // Verify fields are readonly at compile time
    // TypeScript would error if we tried: event._tag = "other"
    // Primitives are immutable by nature in JavaScript
    expect(event._tag).toBe("TestEvent");
    expect(Object.isFrozen(event)).toBe(false); // Object itself isn't frozen, but primitive fields can't change
  });

  it("supports different event types via _tag discriminator", () => {
    class EventA implements IDomainEvent {
      readonly _tag = "EventA";
      readonly aggregateId = "agg-1";
      readonly occurredAt = new Date();
      readonly version = 1;
    }

    class EventB implements IDomainEvent {
      readonly _tag = "EventB";
      readonly aggregateId = "agg-2";
      readonly occurredAt = new Date();
      readonly version = 1;
    }

    const eventA = new EventA();
    const eventB = new EventB();

    expect(eventA._tag).toBe("EventA");
    expect(eventB._tag).toBe("EventB");
  });
});

describe("[UNIT] IEventBusPort", () => {
  it("defines publish method with correct signature", () => {
    // Create a minimal implementation to verify signature
    class MockEventBus implements IEventBusPort {
      publish<T extends IDomainEvent>(
        _event: T,
      ): Effect.Effect<void, IPortError, never> {
        return Effect.void;
      }

      subscribe<T extends IDomainEvent>(
        _eventTag: string,
        _handler: (event: T) => Effect.Effect<void, never, never>,
      ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
        return Effect.succeed({ unsubscribe: () => {} });
      }
    }

    const bus = new MockEventBus();

    expect(typeof bus.publish).toBe("function");
    expect(typeof bus.subscribe).toBe("function");
  });

  it("supports generic event types in publish", async () => {
    class TestEvent implements IDomainEvent {
      readonly _tag = "TestEvent";
      readonly aggregateId = "test-123";
      readonly occurredAt = new Date();
      readonly version = 1;
    }

    class MockEventBus implements IEventBusPort {
      lastEvent: IDomainEvent | null = null;

      publish<T extends IDomainEvent>(
        event: T,
      ): Effect.Effect<void, IPortError, never> {
        this.lastEvent = event;
        return Effect.void;
      }

      subscribe<T extends IDomainEvent>(
        _eventTag: string,
        _handler: (event: T) => Effect.Effect<void, never, never>,
      ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
        return Effect.succeed({ unsubscribe: () => {} });
      }
    }

    const bus = new MockEventBus();
    const event = new TestEvent();

    await Effect.runPromise(bus.publish(event));

    expect(bus.lastEvent).toBe(event);
    expect(bus.lastEvent?._tag).toBe("TestEvent");
  });

  it("subscribe returns unsubscribe function", async () => {
    class MockEventBus implements IEventBusPort {
      publish<T extends IDomainEvent>(
        _event: T,
      ): Effect.Effect<void, IPortError, never> {
        return Effect.void;
      }

      subscribe<T extends IDomainEvent>(
        _eventTag: string,
        _handler: (event: T) => Effect.Effect<void, never, never>,
      ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never> {
        return Effect.succeed({
          unsubscribe: () => {
            // Cleanup logic
          },
        });
      }
    }

    const bus = new MockEventBus();

    const result = await Effect.runPromise(
      bus.subscribe("TestEvent", () => Effect.void),
    );

    expect(typeof result.unsubscribe).toBe("function");
  });
});

describe("[UNIT] IEventHandler", () => {
  it("defines required eventTag field", () => {
    class TestHandler implements IEventHandler<TestDomainEvent> {
      readonly eventTag = "TestDomainEvent";

      handle(_event: TestDomainEvent): Effect.Effect<void, never, never> {
        return Effect.void;
      }
    }

    const handler = new TestHandler();
    expect(handler.eventTag).toBe("TestDomainEvent");
  });

  it("handle method returns Effect with never error channel", async () => {
    class TestDomainEvent implements IDomainEvent {
      readonly _tag = "TestDomainEvent";
      readonly aggregateId = "test-123";
      readonly occurredAt = new Date();
      readonly version = 1;
    }

    class TestHandler implements IEventHandler<TestDomainEvent> {
      readonly eventTag = "TestDomainEvent";
      handled = false;

      handle(event: TestDomainEvent): Effect.Effect<void, never, never> {
        return Effect.gen(function* () {
          // Process event
          yield* Effect.void;
        }).pipe(
          Effect.catchAll(() => {
            // Error isolation - catch all errors internally
            return Effect.void;
          }),
        );
      }
    }

    const handler = new TestHandler();
    const event = new TestDomainEvent();

    // Should complete without throwing (never error channel)
    const result = await Effect.runPromise(handler.handle(event));
    expect(result).toBeUndefined();
  });

  it("supports different event types via generics", async () => {
    class EventA implements IDomainEvent {
      readonly _tag = "EventA";
      readonly aggregateId = "agg-1";
      readonly occurredAt = new Date();
      readonly version = 1;
      readonly dataA = "specific to A";
    }

    class EventB implements IDomainEvent {
      readonly _tag = "EventB";
      readonly aggregateId = "agg-2";
      readonly occurredAt = new Date();
      readonly version = 1;
      readonly dataB = "specific to B";
    }

    class HandlerA implements IEventHandler<EventA> {
      readonly eventTag = "EventA";
      receivedData: string | null = null;

      handle(event: EventA): Effect.Effect<void, never, never> {
        this.receivedData = event.dataA;
        return Effect.void;
      }
    }

    class HandlerB implements IEventHandler<EventB> {
      readonly eventTag = "EventB";
      receivedData: string | null = null;

      handle(event: EventB): Effect.Effect<void, never, never> {
        this.receivedData = event.dataB;
        return Effect.void;
      }
    }

    const handlerA = new HandlerA();
    const handlerB = new HandlerB();

    await Effect.runPromise(handlerA.handle(new EventA()));
    await Effect.runPromise(handlerB.handle(new EventB()));

    expect(handlerA.receivedData).toBe("specific to A");
    expect(handlerB.receivedData).toBe("specific to B");
  });
});

// Helper type for tests
class TestDomainEvent implements IDomainEvent {
  readonly _tag = "TestDomainEvent";
  readonly aggregateId = "test-123";
  readonly occurredAt = new Date();
  readonly version = 1;
}
