/**
 * EventEmitterPubSub Implementation Tests
 *
 * These tests verify that EventEmitterPubSub:
 * - Correctly implements the PubSubService interface
 * - Handles subscriptions and publications correctly
 * - Cleans up resources properly
 * - Works with async generators for GraphQL subscriptions
 *
 * @module services/__tests__
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { EventEmitterPubSub } from "../EventEmitterPubSub";

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] EventEmitterPubSub", () => {
  let pubSub: EventEmitterPubSub;

  beforeEach(() => {
    pubSub = new EventEmitterPubSub();
  });

  describe("[UNIT] Basic Operations", () => {
    it("can subscribe to a channel", () => {
      const subscription = pubSub.subscribe("test-channel");
      expect(subscription).toHaveProperty("asyncIterable");
      expect(subscription).toHaveProperty("unsubscribe");
    });

    it("can publish to a channel", () => {
      // Should not throw
      expect(() =>
        pubSub.publish("test-channel", { data: "test" }),
      ).not.toThrow();
    });

    it("unsubscribe removes all listeners from a channel", () => {
      pubSub.subscribe("test-channel");
      expect(pubSub.getListenerCount("test-channel")).toBeGreaterThan(0);

      pubSub.unsubscribe("test-channel");
      expect(pubSub.getListenerCount("test-channel")).toBe(0);
    });

    it("unsubscribeAll removes all listeners from all channels", () => {
      pubSub.subscribe("channel-1");
      pubSub.subscribe("channel-2");
      pubSub.subscribe("channel-3");

      expect(pubSub.getActiveChannels().length).toBe(3);

      pubSub.unsubscribeAll();
      expect(pubSub.getActiveChannels().length).toBe(0);
    });
  });

  describe("[UNIT] Pub/Sub Flow", () => {
    it("subscriber receives published messages", async () => {
      const channel = "test-channel";
      const testPayload = { id: "123", message: "Hello" };

      const subscription = pubSub.subscribe<typeof testPayload>(channel);

      // Start consuming in background
      const receivedMessages: (typeof testPayload)[] = [];
      const consumePromise = (async () => {
        for await (const message of subscription.asyncIterable) {
          receivedMessages.push(message);
          if (receivedMessages.length >= 1) break;
        }
      })();

      // Publish a message
      await new Promise((resolve) => setTimeout(resolve, 10));
      pubSub.publish(channel, testPayload);

      await consumePromise;
      subscription.unsubscribe();

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]).toEqual(testPayload);
    });

    it("multiple subscribers receive the same message", async () => {
      const channel = "test-channel";
      const testPayload = { id: "456", message: "Broadcast" };

      const sub1 = pubSub.subscribe<typeof testPayload>(channel);
      const sub2 = pubSub.subscribe<typeof testPayload>(channel);

      const received1: (typeof testPayload)[] = [];
      const received2: (typeof testPayload)[] = [];

      const consume1 = (async () => {
        for await (const msg of sub1.asyncIterable) {
          received1.push(msg);
          if (received1.length >= 1) break;
        }
      })();

      const consume2 = (async () => {
        for await (const msg of sub2.asyncIterable) {
          received2.push(msg);
          if (received2.length >= 1) break;
        }
      })();

      await new Promise((resolve) => setTimeout(resolve, 10));
      pubSub.publish(channel, testPayload);

      await Promise.all([consume1, consume2]);
      sub1.unsubscribe();
      sub2.unsubscribe();

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
      expect(received1[0]).toEqual(testPayload);
      expect(received2[0]).toEqual(testPayload);
    });

    it("messages are received in order", async () => {
      const channel = "test-channel";
      const payloads = [
        { id: "1", order: 1 },
        { id: "2", order: 2 },
        { id: "3", order: 3 },
      ];

      const subscription = pubSub.subscribe<(typeof payloads)[0]>(channel);
      const received: (typeof payloads)[0][] = [];

      const consumePromise = (async () => {
        let count = 0;
        for await (const msg of subscription.asyncIterable) {
          received.push(msg);
          count++;
          if (count >= 3) break;
        }
      })();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Publish in order
      for (const payload of payloads) {
        pubSub.publish(channel, payload);
      }

      await consumePromise;
      subscription.unsubscribe();

      expect(received).toHaveLength(3);
      expect(received[0].id).toBe("1");
      expect(received[1].id).toBe("2");
      expect(received[2].id).toBe("3");
    });
  });

  describe("[UNIT] Channel Isolation", () => {
    it("subscribers only receive messages from their channel", async () => {
      const channel1 = "channel-1";
      const channel2 = "channel-2";

      const sub1 = pubSub.subscribe<string>(channel1);
      const sub2 = pubSub.subscribe<string>(channel2);

      const received1: string[] = [];
      const received2: string[] = [];
      let sub2Timeout = false;

      const consume1 = (async () => {
        for await (const msg of sub1.asyncIterable) {
          received1.push(msg);
          break;
        }
      })();

      const consume2 = (async () => {
        // Set a timeout for sub2 - it should NOT receive channel1 messages
        const timeout = setTimeout(() => {
          sub2Timeout = true;
          // Force break out by unsubscribing
          sub2.unsubscribe();
        }, 100);

        for await (const msg of sub2.asyncIterable) {
          received2.push(msg);
          clearTimeout(timeout);
          break;
        }
      })();

      await new Promise((resolve) => setTimeout(resolve, 10));
      pubSub.publish(channel1, "message-for-1");

      await consume1;
      await consume2;
      sub1.unsubscribe();

      expect(received1).toHaveLength(1);
      expect(received1[0]).toBe("message-for-1");
      // sub2 should not have received anything (timed out)
      expect(received2).toHaveLength(0);
      expect(sub2Timeout).toBe(true);
    });
  });

  describe("[UNIT] Unsubscribe Behavior", () => {
    it("unsubscribe stops the async iterable", async () => {
      const channel = "test-channel";
      const subscription = pubSub.subscribe<string>(channel);

      let receivedCount = 0;
      let done = false;

      const consumePromise = (async () => {
        for await (const _ of subscription.asyncIterable) {
          receivedCount++;
        }
        done = true;
      })();

      await new Promise((resolve) => setTimeout(resolve, 10));
      pubSub.publish(channel, "msg1");
      await new Promise((resolve) => setTimeout(resolve, 10));

      subscription.unsubscribe();
      await consumePromise;

      expect(receivedCount).toBe(1);
      expect(done).toBe(true);
    });

    it("unsubscribe removes listener from EventEmitter", () => {
      const channel = "test-channel";

      const beforeCount = pubSub.getListenerCount(channel);
      const subscription = pubSub.subscribe(channel);
      const duringCount = pubSub.getListenerCount(channel);

      subscription.unsubscribe();
      const afterCount = pubSub.getListenerCount(channel);

      expect(duringCount).toBeGreaterThan(beforeCount);
      expect(afterCount).toBe(beforeCount);
    });

    it("calling unsubscribe twice is safe", () => {
      const channel = "test-channel";
      const subscription = pubSub.subscribe(channel);

      // Should not throw
      expect(() => {
        subscription.unsubscribe();
        subscription.unsubscribe();
      }).not.toThrow();
    });
  });

  describe("[UNIT] Resource Management", () => {
    it("tracks active channels", () => {
      pubSub.subscribe("channel-1");
      pubSub.subscribe("channel-2");

      const channels = pubSub.getActiveChannels();
      expect(channels).toContain("channel-1");
      expect(channels).toContain("channel-2");
    });

    it("getListenerCount returns correct count", () => {
      const channel = "test-channel";

      expect(pubSub.getListenerCount(channel)).toBe(0);
      pubSub.subscribe(channel);
      expect(pubSub.getListenerCount(channel)).toBe(1);
      pubSub.subscribe(channel);
      expect(pubSub.getListenerCount(channel)).toBe(2);
    });

    it("cleanup prevents memory leaks", () => {
      const channel = "test-channel";

      // Create and cleanup many subscriptions
      for (let i = 0; i < 100; i++) {
        const sub = pubSub.subscribe(channel);
        sub.unsubscribe();
      }

      // After cleanup, listener count should be 0
      expect(pubSub.getListenerCount(channel)).toBe(0);
    });
  });

  describe("[UNIT] Edge Cases", () => {
    it("publishing to channel with no subscribers does not throw", () => {
      expect(() =>
        pubSub.publish("empty-channel", { data: "test" }),
      ).not.toThrow();
    });

    it("handles rapid publish/subscribe cycles", async () => {
      const channel = "rapid-channel";
      const messages: number[] = [];

      const subscription = pubSub.subscribe<number>(channel);

      const consumePromise = (async () => {
        let count = 0;
        for await (const msg of subscription.asyncIterable) {
          messages.push(msg);
          count++;
          if (count >= 10) break;
        }
      })();

      // Rapidly publish
      for (let i = 0; i < 10; i++) {
        pubSub.publish(channel, i);
      }

      await consumePromise;
      subscription.unsubscribe();

      expect(messages).toHaveLength(10);
      expect(messages).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("handles complex payload types", async () => {
      const channel = "complex-channel";
      interface ComplexPayload {
        id: string;
        nested: {
          data: number[];
          metadata: Map<string, unknown>;
        };
      }

      const payload: ComplexPayload = {
        id: "test-123",
        nested: {
          data: [1, 2, 3],
          metadata: new Map([["key", "value"]]),
        },
      };

      const subscription = pubSub.subscribe<ComplexPayload>(channel);
      const received: ComplexPayload[] = [];

      const consumePromise = (async () => {
        for await (const msg of subscription.asyncIterable) {
          received.push(msg);
          break;
        }
      })();

      await new Promise((resolve) => setTimeout(resolve, 10));
      pubSub.publish(channel, payload);

      await consumePromise;
      subscription.unsubscribe();

      expect(received).toHaveLength(1);
      expect(received[0].id).toBe("test-123");
      expect(received[0].nested.data).toEqual([1, 2, 3]);
    });
  });
});
