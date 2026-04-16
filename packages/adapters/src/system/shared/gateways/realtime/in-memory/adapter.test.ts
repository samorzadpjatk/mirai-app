/**
 * Unit tests for InMemoryRealtimeAdapter
 *
 * Tests the in-memory implementation of RealtimePort for real-time communication.
 * Covers subscribe, broadcast, trackPresence, and all test helper methods.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryRealtimeAdapter } from "./adapter";
import {
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "@mirai-app/use-cases";
import type {
  RealtimePort,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
  ConnectionState,
} from "@mirai-app/use-cases";

describe("[UNIT] InMemoryRealtimeAdapter", () => {
  let adapter: InMemoryRealtimeAdapter;

  beforeEach(() => {
    adapter = new InMemoryRealtimeAdapter();
  });

  // ============================================================================
  // subscribe Tests
  // ============================================================================

  describe("subscribe", () => {
    it("creates subscription with unique ID", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription1 = await Effect.runPromise(
        adapter.subscribe("channel-1", config),
      );
      const subscription2 = await Effect.runPromise(
        adapter.subscribe("channel-2", config),
      );

      expect(subscription1.id).not.toBe(subscription2.id);
      expect(subscription1.channel).toBe("channel-1");
      expect(subscription2.channel).toBe("channel-2");
    });

    it("notifies connection change on subscribe", async () => {
      const connectionChanges: ConnectionState[] = [];
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
        onConnectionChange: (state) => connectionChanges.push(state),
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      expect(connectionChanges).toContain("CONNECTED");
    });

    it("fails when adapter is closed", async () => {
      adapter.setConnectionState("CLOSED");

      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const result = await Effect.runPromise(
        Effect.either(adapter.subscribe("test-channel", config)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriptionError);
        expect(result.left.message).toContain("adapter is closed");
      }
    });

    it("returns CONNECTED state for active subscription", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription.state).toBe("CONNECTED");
    });

    it("allows subscription without events filter", async () => {
      const receivedMessages: Array<{ event: string; payload: unknown }> = [];
      const config: ChannelConfig = {
        onMessage: (event, payload) => {
          receivedMessages.push({ event, payload });
        },
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription).toBeDefined();

      // Should receive all events when no filter specified
      await Effect.runPromise(
        adapter.broadcast("test-channel", "any-event", { data: "value" }),
      );

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.event).toBe("any-event");
    });
  });

  // ============================================================================
  // broadcast Tests
  // ============================================================================

  describe("broadcast", () => {
    it("delivers message to single subscriber", async () => {
      const receivedMessages: Array<{ event: string; payload: unknown }> = [];
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: (event, payload) => {
          receivedMessages.push({ event, payload });
        },
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      await Effect.runPromise(
        adapter.broadcast("test-channel", "test-event", { message: "hello" }),
      );

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.event).toBe("test-event");
      expect(receivedMessages[0]?.payload).toEqual({ message: "hello" });
    });

    it("delivers message to multiple subscribers", async () => {
      const messages1: unknown[] = [];
      const messages2: unknown[] = [];

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: (_event, payload) => messages1.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: (_event, payload) => messages2.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.broadcast("test-channel", "test-event", { data: "shared" }),
      );

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
      expect(messages1[0]).toEqual({ data: "shared" });
      expect(messages2[0]).toEqual({ data: "shared" });
    });

    it("filters by event type", async () => {
      const receivedEvents: string[] = [];
      const config: ChannelConfig = {
        events: ["allowed-event"],
        onMessage: (event) => receivedEvents.push(event),
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      await Effect.runPromise(
        adapter.broadcast("test-channel", "allowed-event", {}),
      );
      await Effect.runPromise(
        adapter.broadcast("test-channel", "filtered-event", {}),
      );

      expect(receivedEvents).toEqual(["allowed-event"]);
    });

    it("does not deliver to unsubscribed channels", async () => {
      const channel1Messages: unknown[] = [];
      const channel2Messages: unknown[] = [];

      await Effect.runPromise(
        adapter.subscribe("channel-1", {
          events: ["test-event"],
          onMessage: (_event, payload) => channel1Messages.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("channel-2", {
          events: ["test-event"],
          onMessage: (_event, payload) => channel2Messages.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.broadcast("channel-1", "test-event", { data: "channel1" }),
      );

      expect(channel1Messages).toHaveLength(1);
      expect(channel2Messages).toHaveLength(0);
    });

    it("does not deliver to closed subscriptions", async () => {
      const receivedMessages: unknown[] = [];
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: (_event, payload) => receivedMessages.push(payload),
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      // Unsubscribe (closes the subscription)
      await Effect.runPromise(subscription.unsubscribe());

      await Effect.runPromise(
        adapter.broadcast("test-channel", "test-event", { data: "ignored" }),
      );

      expect(receivedMessages).toHaveLength(0);
    });

    it("succeeds when no subscribers (no-op)", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          adapter.broadcast("empty-channel", "test-event", { data: "test" }),
        ),
      );

      expect(result._tag).toBe("Right");
    });

    it("fails when adapter is closed", async () => {
      adapter.setConnectionState("CLOSED");

      const result = await Effect.runPromise(
        Effect.either(
          adapter.broadcast("test-channel", "test-event", { data: "test" }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });

    it("handles subscriber errors gracefully", async () => {
      const receivedMessages: unknown[] = [];

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: (_event, _payload) => {
            throw new Error("Subscriber error");
          },
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: (_event, payload) => receivedMessages.push(payload),
        }),
      );

      // Should not throw, and second subscriber should still receive
      await Effect.runPromise(
        adapter.broadcast("test-channel", "test-event", { data: "test" }),
      );

      expect(receivedMessages).toHaveLength(1);
    });
  });

  // ============================================================================
  // trackPresence Tests
  // ============================================================================

  describe("trackPresence", () => {
    it("tracks presence state for channel", async () => {
      const presenceState: PresenceState = {
        userId: "user-123",
        payload: { status: "online" },
        timestamp: new Date("2024-01-01"),
      };

      await Effect.runPromise(
        adapter.trackPresence("test-channel", presenceState),
      );

      const trackedData = adapter.getPresenceData("test-channel");
      expect(trackedData).toBeDefined();
      expect(trackedData?.get("user-123")).toBeDefined();
      expect(trackedData?.get("user-123")?.userId).toBe("user-123");
      expect(trackedData?.get("user-123")?.payload).toEqual({
        status: "online",
      });
    });

    it("updates presence for same user", async () => {
      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-123",
          payload: { status: "away" },
        }),
      );

      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-123",
          payload: { status: "online" },
        }),
      );

      const trackedData = adapter.getPresenceData("test-channel");
      expect(trackedData?.get("user-123")?.payload).toEqual({
        status: "online",
      });
    });

    it("tracks multiple users in same channel", async () => {
      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-1",
          payload: { role: "admin" },
        }),
      );

      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-2",
          payload: { role: "member" },
        }),
      );

      const trackedData = adapter.getPresenceData("test-channel");
      expect(trackedData?.size).toBe(2);
      expect(trackedData?.has("user-1")).toBe(true);
      expect(trackedData?.has("user-2")).toBe(true);
    });

    it("isolates presence data between channels", async () => {
      await Effect.runPromise(
        adapter.trackPresence("channel-a", {
          userId: "user-123",
          payload: { location: "room-a" },
        }),
      );

      await Effect.runPromise(
        adapter.trackPresence("channel-b", {
          userId: "user-123",
          payload: { location: "room-b" },
        }),
      );

      const channelAData = adapter.getPresenceData("channel-a");
      const channelBData = adapter.getPresenceData("channel-b");

      expect(channelAData?.get("user-123")?.payload).toEqual({
        location: "room-a",
      });
      expect(channelBData?.get("user-123")?.payload).toEqual({
        location: "room-b",
      });
    });

    it("sets timestamp if not provided", async () => {
      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-123",
          payload: { status: "online" },
        }),
      );

      const trackedData = adapter.getPresenceData("test-channel");
      expect(trackedData?.get("user-123")?.timestamp).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // unsubscribe Tests
  // ============================================================================

  describe("unsubscribe", () => {
    it("removes subscription from channel", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(adapter.getSubscribers("test-channel")).toHaveLength(1);

      await Effect.runPromise(subscription.unsubscribe());

      expect(adapter.getSubscribers("test-channel")).toHaveLength(0);
    });

    it("sets subscription state to CLOSED", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription.state).toBe("CONNECTED");

      await Effect.runPromise(subscription.unsubscribe());

      expect(subscription.state).toBe("CLOSED");
    });

    it("updates subscription state to CLOSED on unsubscribe", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription.state).toBe("CONNECTED");
      await Effect.runPromise(subscription.unsubscribe());
      expect(subscription.state).toBe("CLOSED");
    });
  });

  // ============================================================================
  // Test Helper Methods
  // ============================================================================

  describe("getConnectionState", () => {
    it("returns CONNECTED by default", () => {
      expect(adapter.getConnectionState()).toBe("CONNECTED");
    });

    it("returns state set by setConnectionState", () => {
      adapter.setConnectionState("DISCONNECTED");
      expect(adapter.getConnectionState()).toBe("DISCONNECTED");

      adapter.setConnectionState("CLOSED");
      expect(adapter.getConnectionState()).toBe("CLOSED");
    });
  });

  describe("setConnectionState", () => {
    it("notifies all subscribers of state change", async () => {
      const connectionChanges: ConnectionState[] = [];
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
        onConnectionChange: (state) => connectionChanges.push(state),
      };

      await Effect.runPromise(adapter.subscribe("channel-1", config));
      await Effect.runPromise(adapter.subscribe("channel-2", config));

      adapter.setConnectionState("DISCONNECTED");

      expect(
        connectionChanges.filter((s) => s === "DISCONNECTED"),
      ).toHaveLength(2);
    });

    it("does not notify after unsubscribe", async () => {
      const connectionChanges: ConnectionState[] = [];
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
        onConnectionChange: (state) => connectionChanges.push(state),
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      await Effect.runPromise(subscription.unsubscribe());

      connectionChanges.length = 0; // Clear previous changes
      adapter.setConnectionState("DISCONNECTED");

      expect(connectionChanges).toHaveLength(0);
    });
  });

  describe("getPresenceData", () => {
    it("returns undefined for channel with no presence data", () => {
      expect(adapter.getPresenceData("empty-channel")).toBeUndefined();
    });

    it("returns Map for channel with presence data", async () => {
      await Effect.runPromise(
        adapter.trackPresence("test-channel", {
          userId: "user-123",
          payload: { status: "online" },
        }),
      );

      const data = adapter.getPresenceData("test-channel");
      expect(data).toBeInstanceOf(Map);
    });
  });

  describe("getSubscribers", () => {
    it("returns empty array for channel with no subscribers", () => {
      expect(adapter.getSubscribers("empty-channel")).toHaveLength(0);
    });

    it("returns all subscribers for channel", async () => {
      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["event-1"],
          onMessage: () => {},
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["event-2"],
          onMessage: () => {},
        }),
      );

      const subscribers = adapter.getSubscribers("test-channel");
      expect(subscribers).toHaveLength(2);
    });

    it("does not include closed subscriptions", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription1 = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      await Effect.runPromise(subscription1.unsubscribe());

      const subscribers = adapter.getSubscribers("test-channel");
      expect(subscribers).toHaveLength(1);
    });
  });

  describe("clear", () => {
    it("removes all subscriptions", async () => {
      await Effect.runPromise(
        adapter.subscribe("channel-1", {
          events: ["event"],
          onMessage: () => {},
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("channel-2", {
          events: ["event"],
          onMessage: () => {},
        }),
      );

      adapter.clear();

      expect(adapter.getSubscribers("channel-1")).toHaveLength(0);
      expect(adapter.getSubscribers("channel-2")).toHaveLength(0);
    });

    it("removes all presence data", async () => {
      await Effect.runPromise(
        adapter.trackPresence("channel-1", { userId: "user-1" }),
      );

      await Effect.runPromise(
        adapter.trackPresence("channel-2", { userId: "user-2" }),
      );

      adapter.clear();

      expect(adapter.getPresenceData("channel-1")).toBeUndefined();
      expect(adapter.getPresenceData("channel-2")).toBeUndefined();
    });

    it("closes all subscriptions", async () => {
      const subscriptions: RealtimeSubscription[] = [];

      subscriptions.push(
        await Effect.runPromise(
          adapter.subscribe("channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      adapter.clear();

      expect(subscriptions[0]?.state).toBe("CLOSED");
    });

    it("resets connection state to CONNECTED", () => {
      adapter.setConnectionState("DISCONNECTED");
      adapter.clear();

      expect(adapter.getConnectionState()).toBe("CONNECTED");
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("supports full real-time workflow", async () => {
      const receivedMessages: Array<{ event: string; payload: unknown }> = [];
      const connectionStates: ConnectionState[] = [];

      // Subscribe to channel
      const subscription = await Effect.runPromise(
        adapter.subscribe("notifications", {
          events: ["new-message"],
          onMessage: (event, payload) => {
            receivedMessages.push({ event, payload });
          },
          onConnectionChange: (state) => connectionStates.push(state),
        }),
      );

      expect(subscription.state).toBe("CONNECTED");
      expect(connectionStates).toContain("CONNECTED");

      // Track presence
      await Effect.runPromise(
        adapter.trackPresence("notifications", {
          userId: "user-123",
          payload: { status: "online" },
        }),
      );

      const presenceData = adapter.getPresenceData("notifications");
      expect(presenceData?.has("user-123")).toBe(true);

      // Broadcast message
      await Effect.runPromise(
        adapter.broadcast("notifications", "new-message", {
          text: "Hello!",
          sender: "user-456",
        }),
      );

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.event).toBe("new-message");

      // Unsubscribe
      await Effect.runPromise(subscription.unsubscribe());
      expect(subscription.state).toBe("CLOSED");

      // Message should not be received after unsubscribe
      await Effect.runPromise(
        adapter.broadcast("notifications", "new-message", { text: "Ignored" }),
      );

      expect(receivedMessages).toHaveLength(1);
    });

    it("supports multiple independent channels", async () => {
      const channel1Messages: unknown[] = [];
      const channel2Messages: unknown[] = [];

      await Effect.runPromise(
        adapter.subscribe("channel-1", {
          events: ["event"],
          onMessage: (_event, payload) => channel1Messages.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("channel-2", {
          events: ["event"],
          onMessage: (_event, payload) => channel2Messages.push(payload),
        }),
      );

      await Effect.runPromise(
        adapter.broadcast("channel-1", "event", { data: "channel1" }),
      );

      await Effect.runPromise(
        adapter.broadcast("channel-2", "event", { data: "channel2" }),
      );

      expect(channel1Messages).toHaveLength(1);
      expect(channel1Messages[0]).toEqual({ data: "channel1" });
      expect(channel2Messages).toHaveLength(1);
      expect(channel2Messages[0]).toEqual({ data: "channel2" });
    });

    it("maintains isolation between subscriptions", async () => {
      const messages: Array<{ subscriptionId: string; payload: unknown }> = [];

      const sub1 = await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["event-1"],
          onMessage: (_event, payload) =>
            messages.push({ subscriptionId: "sub1", payload }),
        }),
      );

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["event-2"],
          onMessage: (_event, payload) =>
            messages.push({ subscriptionId: "sub2", payload }),
        }),
      );

      await Effect.runPromise(
        adapter.broadcast("test-channel", "event-1", { type: "event-1" }),
      );

      await Effect.runPromise(
        adapter.broadcast("test-channel", "event-2", { type: "event-2" }),
      );

      // Unsubscribe sub1 and verify sub2 still receives
      await Effect.runPromise(sub1.unsubscribe());

      await Effect.runPromise(
        adapter.broadcast("test-channel", "event-2", { type: "event-2-again" }),
      );

      expect(messages).toHaveLength(3);
      expect(messages[0]?.subscriptionId).toBe("sub1");
      expect(messages[0]?.payload).toEqual({ type: "event-1" });
      expect(messages[1]?.subscriptionId).toBe("sub2");
      expect(messages[2]?.subscriptionId).toBe("sub2");
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test suite provides comprehensive coverage for the InMemoryRealtimeAdapter:
//
// **Subscribe Tests:**
// - Unique subscription ID generation
// - Connection change notifications
// - Closed adapter rejection
// - CONNECTED state for active subscriptions
// - Support for subscriptions without event filters
//
// **Broadcast Tests:**
// - Message delivery to single subscriber
// - Message delivery to multiple subscribers
// - Event type filtering
// - Channel isolation
// - Closed subscription exclusion
// - No-op on empty channels
// - Closed adapter rejection
// - Graceful subscriber error handling
//
// **TrackPresence Tests:**
// - Presence state tracking per channel
// - Presence updates for same user
// - Multiple users in same channel
// - Channel isolation for presence data
// - Automatic timestamp assignment
//
// **Unsubscribe Tests:**
// - Subscription removal from channel
// - State transition to CLOSED
// - Connection change notification
//
// **Test Helper Tests:**
// - getConnectionState default and updates
// - setConnectionState notification
// - getPresenceData for empty and populated channels
// - getSubscribers filtering
// - clear for test cleanup
//
// **Integration Tests:**
// - Full real-time workflow
// - Multiple independent channels
// - Subscription isolation
//
// All tests follow the project's testing conventions using bun:test,
// Effect.runPromise for async operations, and Effect.either for error testing.
//
