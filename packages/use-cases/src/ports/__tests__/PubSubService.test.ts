/**
 * PubSubService Interface Contract Tests
 *
 * These tests verify that the PubSubService interface:
 * - Has no framework dependencies
 * - Defines proper method signatures
 * - Has associated error types with correct structure
 *
 * @module ports/__tests__
 */

import { describe, it, expect } from "bun:test";
import type { PubSubService } from "../PubSubService";
import {
  PubSubError,
  SubscriptionFailedError,
  PublishFailedError,
} from "../PubSubService";

// =============================================================================
// Mock Implementation for Testing
// =============================================================================

/**
 * Mock implementation of PubSubService for testing interface contract
 */
class MockPubSubService implements PubSubService {
  private subscribers: Map<string, Set<(payload: unknown) => void>> = new Map();

  subscribe<T>(channel: string): {
    asyncIterable: AsyncIterable<T>;
    unsubscribe: () => void;
  } {
    const unsubscribers = this.subscribers.get(channel) ?? new Set();
    this.subscribers.set(channel, unsubscribers);

    const queue: T[] = [];
    let resolveNext: ((value: IteratorResult<T>) => void) | null = null;
    let isActive = true;

    const handler = (payload: T) => {
      if (!isActive) return;
      if (resolveNext) {
        resolveNext({ value: payload, done: false });
        resolveNext = null;
      } else {
        queue.push(payload);
      }
    };

    unsubscribers.add(handler as (payload: unknown) => void);

    const asyncIterable: AsyncIterable<T> = {
      [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
          async next(): Promise<IteratorResult<T>> {
            if (!isActive)
              return { value: undefined as unknown as T, done: true };
            if (queue.length > 0) {
              return { value: queue.shift()!, done: false };
            }
            return new Promise<IteratorResult<T>>((resolve) => {
              resolveNext = resolve;
            });
          },
          async return(): Promise<IteratorResult<T>> {
            isActive = false;
            return { value: undefined as unknown as T, done: true };
          },
        };
      },
    };

    const unsubscribe = () => {
      isActive = false;
      unsubscribers.delete(handler as (payload: unknown) => void);
      if (resolveNext) {
        resolveNext({ value: undefined as unknown as T, done: true });
      }
    };

    return { asyncIterable, unsubscribe };
  }

  publish<T>(channel: string, payload: T): void {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  unsubscribe(channel: string): void {
    this.subscribers.delete(channel);
  }

  unsubscribeAll(): void {
    this.subscribers.clear();
  }
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] PubSubService Interface Contract", () => {
  describe("PubSubService Interface Structure", () => {
    it("has subscribe method with correct signature", () => {
      const service = new MockPubSubService();
      expect(typeof service.subscribe).toBe("function");
    });

    it("has publish method with correct signature", () => {
      const service = new MockPubSubService();
      expect(typeof service.publish).toBe("function");
    });

    it("has unsubscribe method with correct signature", () => {
      const service = new MockPubSubService();
      expect(typeof service.unsubscribe).toBe("function");
    });

    it("has unsubscribeAll method with correct signature", () => {
      const service = new MockPubSubService();
      expect(typeof service.unsubscribeAll).toBe("function");
    });

    it("subscribe accepts a string channel parameter", () => {
      const service = new MockPubSubService();
      const result = service.subscribe("test-channel");
      expect(result).toHaveProperty("asyncIterable");
      expect(result).toHaveProperty("unsubscribe");
    });

    it("subscribe returns asyncIterable and unsubscribe function", () => {
      const service = new MockPubSubService();
      const result = service.subscribe("test-channel");
      expect(typeof result.asyncIterable).toBe("object");
      expect(typeof result.unsubscribe).toBe("function");
    });

    it("publish accepts channel and payload parameters", () => {
      const service = new MockPubSubService();
      // Should not throw
      expect(() =>
        service.publish("test-channel", { data: "test" }),
      ).not.toThrow();
    });

    it("unsubscribe accepts a string channel parameter", () => {
      const service = new MockPubSubService();
      // Should not throw
      expect(() => service.unsubscribe("test-channel")).not.toThrow();
    });

    it("unsubscribeAll takes no parameters", () => {
      const service = new MockPubSubService();
      // Should not throw
      expect(() => service.unsubscribeAll()).not.toThrow();
    });
  });

  describe("Error Types", () => {
    it("PubSubError has correct _tag discriminator", () => {
      const error = new PubSubError({ message: "Test error" });
      expect(error._tag).toBe("PubSubError");
    });

    it("PubSubError has correct error code", () => {
      const error = new PubSubError({ message: "Test error" });
      expect(error.code).toBe("PUBSUB_ERROR");
    });

    it("PubSubError stores message correctly", () => {
      const message = "Something went wrong";
      const error = new PubSubError({ message });
      expect(error.message).toBe(message);
    });

    it("SubscriptionFailedError has correct _tag discriminator", () => {
      const error = new SubscriptionFailedError({
        message: "Subscription failed",
        channel: "test-channel",
      });
      expect(error._tag).toBe("SubscriptionFailedError");
    });

    it("SubscriptionFailedError has correct error code", () => {
      const error = new SubscriptionFailedError({
        message: "Subscription failed",
        channel: "test-channel",
      });
      expect(error.code).toBe("SUBSCRIPTION_FAILED");
    });

    it("SubscriptionFailedError stores channel correctly", () => {
      const channel = "my-channel-123";
      const error = new SubscriptionFailedError({
        message: "Failed",
        channel,
      });
      expect(error.channel).toBe(channel);
    });

    it("PublishFailedError has correct _tag discriminator", () => {
      const error = new PublishFailedError({
        message: "Publish failed",
        channel: "test-channel",
      });
      expect(error._tag).toBe("PublishFailedError");
    });

    it("PublishFailedError has correct error code", () => {
      const error = new PublishFailedError({
        message: "Publish failed",
        channel: "test-channel",
      });
      expect(error.code).toBe("PUBLISH_FAILED");
    });

    it("PublishFailedError stores channel correctly", () => {
      const channel = "my-channel-456";
      const error = new PublishFailedError({
        message: "Failed",
        channel,
      });
      expect(error.channel).toBe(channel);
    });
  });

  describe("AsyncIterable Integration", () => {
    it("subscribe returns an async iterable", () => {
      const service = new MockPubSubService();
      const { asyncIterable } = service.subscribe("test-channel");

      expect(asyncIterable).toBeDefined();
      expect(typeof asyncIterable[Symbol.asyncIterator]).toBe("function");
    });

    it("async iterator has next method", () => {
      const service = new MockPubSubService();
      const { asyncIterable } = service.subscribe("test-channel");
      const iterator = asyncIterable[Symbol.asyncIterator]();

      expect(typeof iterator.next).toBe("function");
    });

    it("async iterator has return method for cleanup", () => {
      const service = new MockPubSubService();
      const { asyncIterable } = service.subscribe("test-channel");
      const iterator = asyncIterable[Symbol.asyncIterator]();

      expect(typeof iterator.return).toBe("function");
    });
  });

  describe("No Framework Dependencies", () => {
    it("PubSubError extends Error (standard JS)", () => {
      const error = new PubSubError({ message: "Test" });
      expect(error).toBeInstanceOf(Error);
    });

    it("SubscriptionFailedError extends Error (standard JS)", () => {
      const error = new SubscriptionFailedError({
        message: "Test",
        channel: "ch-1",
      });
      expect(error).toBeInstanceOf(Error);
    });

    it("PublishFailedError extends Error (standard JS)", () => {
      const error = new PublishFailedError({
        message: "Test",
        channel: "ch-1",
      });
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("Generic Type Support", () => {
    it("subscribe supports generic payload type", () => {
      const service = new MockPubSubService();
      interface TestPayload {
        id: string;
        data: number;
      }

      const { asyncIterable } = service.subscribe<TestPayload>("test-channel");
      expect(asyncIterable).toBeDefined();
    });

    it("publish supports generic payload type", () => {
      const service = new MockPubSubService();
      interface TestPayload {
        id: string;
        data: number;
      }

      const payload: TestPayload = { id: "123", data: 42 };
      // Should not throw and should accept the typed payload
      expect(() => service.publish("test-channel", payload)).not.toThrow();
    });
  });
});
