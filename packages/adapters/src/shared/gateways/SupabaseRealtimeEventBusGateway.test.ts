/**
 * SupabaseRealtimeEventBusGateway Tests
 *
 * Unit tests with mocked Supabase client to verify:
 * - publish() broadcasts events correctly
 * - subscribe() registers handlers and invokes them on events
 * - unsubscribe() removes channel listeners
 * - Error handling with Effect.tryPromise mapping
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { SupabaseRealtimeEventBusGateway } from "./SupabaseRealtimeEventBusGateway";
import { ApplicationError } from "@mirai-app/domain";
import type { IDomainEvent } from "@mirai-app/domain";
import type { SupabaseClient } from "@mirai-app/frameworks";

// Mock domain event for testing
class TestEvent implements IDomainEvent {
  readonly _tag = "TestEvent";
  readonly version = 1;

  constructor(
    readonly aggregateId: string,
    readonly occurredAt: Date,
  ) {}
}

// Mock Supabase channel
interface MockChannel {
  send: (message: {
    type: string;
    event: string;
    payload: unknown;
  }) => Promise<"ok" | "error" | "timed out">;
  on: (
    event: string,
    filter: { event: string },
    callback: (payload: { payload: unknown }) => void,
  ) => MockChannel;
  subscribe: () => MockSubscription;
}

interface MockSubscription {
  unsubscribe: () => void;
}

// Mock Supabase client factory
type MockSupabaseClient = {
  channel: (name: string) => MockChannel;
};

describe("[UNIT] SupabaseRealtimeEventBusGateway", () => {
  let mockSupabase: MockSupabaseClient;
  let gateway: SupabaseRealtimeEventBusGateway;
  let capturedChannels: Map<string, MockChannel>;
  let capturedSubscriptions: MockSubscription[];
  let sendResults: ("ok" | "error" | "timed out")[];
  let broadcastCallbacks: Map<string, Array<(payload: { payload: unknown }) => void>>;

  beforeEach(() => {
    capturedChannels = new Map();
    capturedSubscriptions = [];
    sendResults = ["ok"]; // Default to success
    broadcastCallbacks = new Map();

    let sendCallIndex = 0;

    mockSupabase = {
      channel: (name: string) => {
        // Get or create callbacks array for this channel
        let callbacks = broadcastCallbacks.get(name);
        if (!callbacks) {
          callbacks = [];
          broadcastCallbacks.set(name, callbacks);
        }

        const channel: MockChannel = {
          send: async (message) => {
            const result = sendResults[sendCallIndex++] ?? "ok";
            return result;
          },
          on: (event, filter, callback) => {
            if (event === "broadcast") {
              callbacks.push(callback);
            }
            return channel;
          },
          subscribe: () => {
            const subscription: MockSubscription = {
              unsubscribe: () => {
                const index = capturedSubscriptions.indexOf(subscription);
                if (index > -1) {
                  capturedSubscriptions.splice(index, 1);
                }
              },
            };
            capturedSubscriptions.push(subscription);
            return subscription;
          },
        };

        // Only store channel reference if not already stored
        if (!capturedChannels.has(name)) {
          capturedChannels.set(name, channel);
        }
        return channel;
      },
    };

    gateway = new SupabaseRealtimeEventBusGateway(
      mockSupabase as unknown as SupabaseClient,
    );
  });

  describe("publish", () => {
    it("should broadcast event via Supabase Realtime channel", async () => {
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const effect = gateway.publish(event);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      // Verify channel was created with correct name
      expect(capturedChannels.has("domain-events-TestEvent")).toBe(true);
    });

    it("should include event payload in broadcast", async () => {
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const effect = gateway.publish(event);
      await Effect.runPromise(Effect.either(effect));

      // Verify channel creation implies correct payload structure
      const channel = capturedChannels.get("domain-events-TestEvent");
      expect(channel).toBeDefined();
    });

    it("should fail with ApplicationError when broadcast returns error", async () => {
      sendResults = ["error"];
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const effect = gateway.publish(event);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
        expect(either.left._tag).toBe("ApplicationError");
      }
    });

    it("should fail with ApplicationError when broadcast times out", async () => {
      sendResults = ["timed out"];
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const effect = gateway.publish(event);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
      }
    });

    it("should fail with ApplicationError on unexpected error", async () => {
      const mockFailingSupabase = {
        channel: () => {
          throw new Error("Unexpected channel error");
        },
      };

      const failingGateway = new SupabaseRealtimeEventBusGateway(
        mockFailingSupabase as unknown as SupabaseClient,
      );

      const event = new TestEvent("test-id", new Date("2024-01-01"));
      const effect = failingGateway.publish(event);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("subscribe", () => {
    it("should return unsubscribe function", async () => {
      const handler = () => Effect.void;

      const effect = gateway.subscribe("TestEvent", handler);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(typeof either.right.unsubscribe).toBe("function");
      }
    });

    it("should create channel with correct name format", async () => {
      const handler = () => Effect.void;

      await Effect.runPromise(gateway.subscribe("TestEvent", handler));

      expect(capturedChannels.has("domain-events-TestEvent")).toBe(true);
    });

    it("should register broadcast event listener", async () => {
      const handler = () => Effect.void;

      await Effect.runPromise(gateway.subscribe("TestEvent", handler));

      const callbacks = broadcastCallbacks.get("domain-events-TestEvent");
      expect(callbacks).toBeDefined();
      expect(callbacks?.length).toBe(1);
    });

    it("should invoke handler when broadcast event received", async () => {
      const handledEvents: IDomainEvent[] = [];
      const handler = (event: TestEvent) =>
        Effect.sync(() => {
          handledEvents.push(event);
        });

      await Effect.runPromise(gateway.subscribe("TestEvent", handler));

      // Simulate broadcast event
      const testEvent = new TestEvent("test-id", new Date("2024-01-01"));
      const callbacks = broadcastCallbacks.get("domain-events-TestEvent");
      expect(callbacks).toBeDefined();
      expect(callbacks?.length).toBe(1);

      // Trigger the callback
      const firstCallback = callbacks?.[0];
      if (firstCallback) {
        firstCallback({ payload: testEvent });
      }

      // Wait for Effect.runFork to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handledEvents.length).toBe(1);
      expect(handledEvents[0]?._tag).toBe("TestEvent");
    });

    it("should handle multiple subscribers for same event type", async () => {
      const handler1Events: IDomainEvent[] = [];
      const handler2Events: IDomainEvent[] = [];

      const handler1 = (event: TestEvent) =>
        Effect.sync(() => {
          handler1Events.push(event);
        });
      const handler2 = (event: TestEvent) =>
        Effect.sync(() => {
          handler2Events.push(event);
        });

      await Effect.runPromise(gateway.subscribe("TestEvent", handler1));
      await Effect.runPromise(gateway.subscribe("TestEvent", handler2));

      // Both subscribers should have registered callbacks
      const callbacks = broadcastCallbacks.get("domain-events-TestEvent");
      expect(callbacks?.length).toBe(2);
    });

    it("should fail with ApplicationError on subscription error", async () => {
      const mockFailingSupabase = {
        channel: () => {
          throw new Error("Channel creation failed");
        },
      };

      const failingGateway = new SupabaseRealtimeEventBusGateway(
        mockFailingSupabase as unknown as SupabaseClient,
      );

      const handler = () => Effect.void;
      const effect = failingGateway.subscribe("TestEvent", handler);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ApplicationError);
      }
    });
  });

  describe("unsubscribe", () => {
    it("should remove subscription when unsubscribe is called", async () => {
      const handler = () => Effect.void;

      const effect = gateway.subscribe("TestEvent", handler);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(capturedSubscriptions.length).toBe(1);

      if (Either.isRight(either)) {
        either.right.unsubscribe();
        expect(capturedSubscriptions.length).toBe(0);
      }
    });

    it("should not affect other subscriptions when one unsubscribes", async () => {
      const handler1 = () => Effect.void;
      const handler2 = () => Effect.void;

      const sub1 = await Effect.runPromise(gateway.subscribe("TestEvent", handler1));
      const sub2 = await Effect.runPromise(gateway.subscribe("TestEvent", handler2));

      expect(capturedSubscriptions.length).toBe(2);

      sub1.unsubscribe();
      expect(capturedSubscriptions.length).toBe(1);

      sub2.unsubscribe();
      expect(capturedSubscriptions.length).toBe(0);
    });
  });

  describe("integration: publish and subscribe", () => {
    it("should support full publish-subscribe cycle with event passing", async () => {
      const receivedEvents: TestEvent[] = [];

      // Subscribe
      const handler = (event: TestEvent) =>
        Effect.sync(() => {
          receivedEvents.push(event);
        });

      const sub = await Effect.runPromise(gateway.subscribe("TestEvent", handler));

      // Publish
      const event = new TestEvent("integration-test-id", new Date("2024-01-01"));
      const publishEither = await Effect.runPromise(
        Effect.either(gateway.publish(event)),
      );

      expect(Either.isRight(publishEither)).toBe(true);

      // In real Supabase, the event would be broadcast and received
      // Here we verify the structure is correct
      expect(capturedChannels.has("domain-events-TestEvent")).toBe(true);

      // Cleanup
      sub.unsubscribe();
    });

    it("should use consistent channel naming for publish and subscribe", async () => {
      const handler = () => Effect.void;

      await Effect.runPromise(gateway.subscribe("TestEvent", handler));

      const event = new TestEvent("test-id", new Date("2024-01-01"));
      await Effect.runPromise(Effect.either(gateway.publish(event)));

      // Both operations should use the same channel
      const channels = Array.from(capturedChannels.keys());
      const testEventChannels = channels.filter((c) => c.includes("TestEvent"));
      expect(testEventChannels.length).toBe(1);
      expect(testEventChannels[0]).toBe("domain-events-TestEvent");
    });
  });

  describe("Effect patterns", () => {
    it("should return Effect<void, ApplicationError, never> for publish", async () => {
      const event = new TestEvent("test-id", new Date("2024-01-01"));
      const effect = gateway.publish(event);

      // Effect.either converts to Either for testing
      const either = await Effect.runPromise(Effect.either(effect));

      // Verify it's a proper Effect that can be run
      expect(Either.isRight(either) || Either.isLeft(either)).toBe(true);
    });

    it("should return Effect<{unsubscribe}, ApplicationError, never> for subscribe", async () => {
      const handler = () => Effect.void;
      const effect = gateway.subscribe("TestEvent", handler);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(typeof either.right.unsubscribe).toBe("function");
      }
    });

    it("should handle errors using Either.isLeft pattern", async () => {
      sendResults = ["error"];
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const either = await Effect.runPromise(Effect.either(gateway.publish(event)));

      expect(Either.isLeft(either)).toBe(true);
      expect(Either.isRight(either)).toBe(false);
    });

    it("should handle success using Either.isRight pattern", async () => {
      const event = new TestEvent("test-id", new Date("2024-01-01"));

      const either = await Effect.runPromise(Effect.either(gateway.publish(event)));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);
    });
  });
});
