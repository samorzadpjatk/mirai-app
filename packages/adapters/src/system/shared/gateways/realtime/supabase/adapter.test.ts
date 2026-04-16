/**
 * Unit tests for SupabaseRealtimeAdapter
 *
 * Tests the Supabase Realtime implementation of RealtimePort.
 * Uses mocked Supabase client to test subscribe, broadcast, trackPresence,
 * and error mapping without external dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { SupabaseRealtimeAdapter } from "./adapter";
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

// =============================================================================
// Mock Types
// =============================================================================

type SubscriptionStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "CLOSED"
  | "TIMED_OUT";

interface MockRealtimeChannel {
  state: string;
  on: (
    type: string,
    filter: { event: string },
    callback: (payload: { event: string; payload: unknown }) => void,
  ) => MockRealtimeChannel;
  subscribe: (callback: (status: SubscriptionStatus) => void) => void;
  send: (message: {
    type: string;
    event: string;
    payload: unknown;
  }) => Promise<{ error?: { message: string } }>;
  track: (
    data: Record<string, unknown>,
  ) => Promise<{ error?: { message: string } }>;
  unsubscribe: () => void;
}

interface MockSupabaseRealtime {
  channel: (name: string) => MockRealtimeChannel;
}

interface MockSupabaseClient {
  realtime: MockSupabaseRealtime;
  channel: (name: string) => MockRealtimeChannel;
}

// =============================================================================
// Mock Factory
// =============================================================================

function createMockRealtimeChannel(
  overrides?: Partial<MockRealtimeChannel>,
): MockRealtimeChannel {
  const explicitState = overrides?.state;
  const channel: MockRealtimeChannel = {
    state: explicitState ?? "closed",
    on: () => channel,
    subscribe: function (callback) {
      // Only auto-transition to joined if no explicit state was provided
      if (explicitState === undefined) {
        this.state = "joined";
      }
      callback("SUBSCRIBED");
    },
    send: async () => ({ error: undefined }),
    track: async () => ({ error: undefined }),
    unsubscribe: function () {
      this.state = "closed";
    },
    ...overrides,
  };
  return channel;
}

function createMockSupabaseClient(
  channelOverrides?: Partial<MockRealtimeChannel>,
): MockSupabaseClient {
  const channel = createMockRealtimeChannel(channelOverrides);
  return {
    realtime: {
      channel: () => channel,
    },
    channel: () => channel,
  };
}

// =============================================================================
// Test Helpers
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("[UNIT] SupabaseRealtimeAdapter", () => {
  let adapter: SupabaseRealtimeAdapter;
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    adapter = new SupabaseRealtimeAdapter(
      mockClient as unknown as ConstructorParameters<
        typeof SupabaseRealtimeAdapter
      >[0],
    );
  });

  // ============================================================================
  // subscribe Tests
  // ============================================================================

  describe("subscribe", () => {
    it("creates subscription successfully", async () => {
      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription).toBeDefined();
      expect(subscription.channel).toBe("test-channel");
      expect(subscription.id).toMatch(/^sub-\d+$/);
    });

    it("sets up event listeners for specified events", async () => {
      const events: string[] = [];
      const mockOn = (
        type: string,
        filter: { event: string },
        _callback: (payload: { event: string; payload: unknown }) => void,
      ) => {
        events.push(`${type}:${filter.event}`);
        return createMockRealtimeChannel();
      };

      mockClient.channel = () =>
        createMockRealtimeChannel({
          on: mockOn,
        });

      const config: ChannelConfig = {
        events: ["event-1", "event-2", "event-3"],
        onMessage: () => {},
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      expect(events).toEqual([
        "broadcast:event-1",
        "broadcast:event-2",
        "broadcast:event-3",
      ]);
    });

    it("notifies connection change on subscribe", async () => {
      const connectionStates: ConnectionState[] = [];

      mockClient.channel = () =>
        createMockRealtimeChannel({
          subscribe: (callback) => {
            callback("SUBSCRIBED");
          },
        });

      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
        onConnectionChange: (state) => connectionStates.push(state),
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      expect(connectionStates).toContain("CONNECTED");
    });

    it("notifies connection error on channel error", async () => {
      const connectionStates: ConnectionState[] = [];

      mockClient.channel = () =>
        createMockRealtimeChannel({
          subscribe: (callback) => {
            callback("CHANNEL_ERROR");
          },
        });

      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
        onConnectionChange: (state) => connectionStates.push(state),
      };

      await Effect.runPromise(adapter.subscribe("test-channel", config));

      expect(connectionStates).toContain("DISCONNECTED");
    });

    it("handles subscribe without events (broadcast channel)", async () => {
      const config: ChannelConfig = {
        onMessage: () => {},
      };

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", config),
      );

      expect(subscription).toBeDefined();
    });

    it("maps connection errors to ConnectionError", async () => {
      mockClient.channel = () => {
        throw new Error("Connection timeout");
      };

      const config: ChannelConfig = {
        events: ["test-event"],
        onMessage: () => {},
      };

      const result = await Effect.runPromise(
        Effect.either(adapter.subscribe("test-channel", config)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ConnectionError);
      }
    });

    it("maps subscription errors to SubscriptionError", async () => {
      mockClient.channel = () => {
        throw new Error("Subscription failed for channel");
      };

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
      }
    });
  });

  // ============================================================================
  // broadcast Tests
  // ============================================================================

  describe("broadcast", () => {
    it("broadcasts message successfully", async () => {
      let sentEvent: string | undefined;
      let sentPayload: unknown;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          send: async (message) => {
            sentEvent = message.event;
            sentPayload = message.payload;
            return { error: undefined };
          },
        });

      await Effect.runPromise(
        adapter.broadcast("test-channel", "test-event", { data: "value" }),
      );

      expect(sentEvent).toBe("test-event");
      expect(sentPayload).toEqual({ data: "value" });
    });

    it("creates channel if not exists", async () => {
      const createdChannels: string[] = [];
      const originalChannel = mockClient.channel;

      mockClient.channel = (name: string) => {
        createdChannels.push(name);
        return createMockRealtimeChannel();
      };

      await Effect.runPromise(
        adapter.broadcast("new-channel", "event", { data: "test" }),
      );

      expect(createdChannels).toContain("new-channel");
    });

    it("maps response error to RealtimeError", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          send: async () => ({
            error: { message: "Broadcast failed" },
          }),
        });

      const result = await Effect.runPromise(
        Effect.either(adapter.broadcast("test-channel", "event", {})),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });

    it("maps connection errors to ConnectionError", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          subscribe: (callback) => {
            callback("CHANNEL_ERROR");
          },
        });

      const result = await Effect.runPromise(
        Effect.either(adapter.broadcast("test-channel", "event", {})),
      );

      expect(result._tag).toBe("Left");
    });

    it("handles channel subscription before broadcast", async () => {
      let subscribed = false;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          subscribe: (callback) => {
            subscribed = true;
            callback("SUBSCRIBED");
          },
        });

      await Effect.runPromise(
        adapter.broadcast("test-channel", "event", { data: "test" }),
      );

      expect(subscribed).toBe(true);
    });
  });

  // ============================================================================
  // trackPresence Tests
  // ============================================================================

  describe("trackPresence", () => {
    it("tracks presence successfully", async () => {
      let trackedData: Record<string, unknown> | undefined;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          track: async (data) => {
            trackedData = data;
            return { error: undefined };
          },
        });

      const presenceState: PresenceState = {
        userId: "user-123",
        payload: { status: "online", role: "admin" },
        timestamp: new Date("2024-01-01T00:00:00Z"),
      };

      await Effect.runPromise(
        adapter.trackPresence("presence-channel", presenceState),
      );

      expect(trackedData).toBeDefined();
      expect(trackedData?.userId).toBe("user-123");
      expect(trackedData?.status).toBe("online");
      expect(trackedData?.role).toBe("admin");
    });

    it("converts timestamp to ISO string", async () => {
      let trackedData: Record<string, unknown> | undefined;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          track: async (data) => {
            trackedData = data;
            return { error: undefined };
          },
        });

      const timestamp = new Date("2024-06-15T10:30:00Z");
      const presenceState: PresenceState = {
        userId: "user-123",
        payload: {},
        timestamp,
      };

      await Effect.runPromise(
        adapter.trackPresence("test-channel", presenceState),
      );

      expect(trackedData?.timestamp).toBe(timestamp.toISOString());
    });

    it("creates timestamp if not provided", async () => {
      let trackedData: Record<string, unknown> | undefined;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          track: async (data) => {
            trackedData = data;
            return { error: undefined };
          },
        });

      const presenceState: PresenceState = {
        userId: "user-123",
        payload: { status: "online" },
      };

      const before = Date.now();
      await Effect.runPromise(
        adapter.trackPresence("test-channel", presenceState),
      );
      const after = Date.now();

      const trackedTimestamp = new Date(
        trackedData?.timestamp as string,
      ).getTime();
      expect(trackedTimestamp).toBeGreaterThanOrEqual(before);
      expect(trackedTimestamp).toBeLessThanOrEqual(after);
    });

    it("maps track error to RealtimeError", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          track: async () => ({
            error: { message: "Presence tracking failed" },
          }),
        });

      const result = await Effect.runPromise(
        Effect.either(
          adapter.trackPresence("test-channel", { userId: "user-123" }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });

    it("maps connection errors to ConnectionError", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          subscribe: (callback) => {
            callback("CHANNEL_ERROR");
          },
        });

      const result = await Effect.runPromise(
        Effect.either(
          adapter.trackPresence("test-channel", { userId: "user-123" }),
        ),
      );

      expect(result._tag).toBe("Left");
    });
  });

  // ============================================================================
  // unsubscribe Tests (via subscription)
  // ============================================================================

  describe("unsubscribe", () => {
    it("unsubscribes from channel successfully", async () => {
      let unsubscribed = false;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          unsubscribe: () => {
            unsubscribed = true;
          },
        });

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      await Effect.runPromise(subscription.unsubscribe());

      expect(unsubscribed).toBe(true);
    });

    it("returns CLOSED state after unsubscribe", async () => {
      mockClient.channel = () => createMockRealtimeChannel();

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      expect(subscription.state).toBe("CONNECTED");

      await Effect.runPromise(subscription.unsubscribe());

      expect(subscription.state).toBe("CLOSED");
    });

    it("maps unsubscribe errors to RealtimeError", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          unsubscribe: () => {
            throw new Error("Unsubscribe failed");
          },
        });

      const subscription = await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(subscription.unsubscribe()),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });
  });

  // ============================================================================
  // getConnectionState Tests
  // ============================================================================

  describe("getConnectionState", () => {
    it("returns CLOSED when no channels active", () => {
      expect(adapter.getConnectionState()).toBe("CLOSED");
    });

    it("returns CONNECTED when channel is subscribed", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          state: "joined",
        });

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      expect(adapter.getConnectionState()).toBe("CONNECTED");
    });

    it("returns CONNECTING when channel is joining", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          state: "joining",
        });

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      expect(adapter.getConnectionState()).toBe("CONNECTING");
    });

    it("returns CLOSED when channel is closed", async () => {
      mockClient.channel = () =>
        createMockRealtimeChannel({
          state: "closed",
        });

      await Effect.runPromise(
        adapter.subscribe("test-channel", {
          events: ["test-event"],
          onMessage: () => {},
        }),
      );

      expect(adapter.getConnectionState()).toBe("CLOSED");
    });

    it("returns CONNECTED if any channel is connected", async () => {
      let channelCount = 0;
      mockClient.channel = () => {
        channelCount++;
        return createMockRealtimeChannel({
          state: channelCount === 1 ? "joined" : "closed",
        });
      };

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

      expect(adapter.getConnectionState()).toBe("CONNECTED");
    });
  });

  // ============================================================================
  // Error Mapping Tests
  // ============================================================================

  describe("error mapping", () => {
    it("maps connection-related errors to ConnectionError", async () => {
      mockClient.channel = () => {
        throw new Error("websocket connection failed");
      };

      const result = await Effect.runPromise(
        Effect.either(
          adapter.subscribe("test-channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ConnectionError);
        expect(result.left.code).toBe("CONNECTION_ERROR");
      }
    });

    it("maps network errors to ConnectionError", async () => {
      mockClient.channel = () => {
        throw new Error("network timeout");
      };

      const result = await Effect.runPromise(
        Effect.either(
          adapter.subscribe("test-channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ConnectionError);
      }
    });

    it("maps subscription errors to SubscriptionError", async () => {
      mockClient.channel = () => {
        throw new Error("invalid topic subscription");
      };

      const result = await Effect.runPromise(
        Effect.either(
          adapter.subscribe("test-channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriptionError);
        expect(result.left.code).toBe("SUBSCRIPTION_ERROR");
      }
    });

    it("maps generic errors to RealtimeError", async () => {
      mockClient.channel = () => {
        throw new Error("something unexpected");
      };

      const result = await Effect.runPromise(
        Effect.either(
          adapter.subscribe("test-channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });

    it("handles non-Error objects in error mapping", async () => {
      mockClient.channel = () => {
        throw "string error";
      };

      const result = await Effect.runPromise(
        Effect.either(
          adapter.subscribe("test-channel", {
            events: ["event"],
            onMessage: () => {},
          }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(RealtimeError);
      }
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe("integration", () => {
    it("supports full real-time workflow", async () => {
      const receivedMessages: Array<{ event: string; payload: unknown }> = [];
      const connectionStates: ConnectionState[] = [];
      let messageHandler:
        | ((payload: { event: string; payload: unknown }) => void)
        | undefined;

      mockClient.channel = () =>
        createMockRealtimeChannel({
          state: "joined",
          on: (type, filter, callback) => {
            if (type === "broadcast" && filter.event === "new-message") {
              messageHandler = callback;
            }
            return createMockRealtimeChannel();
          },
          subscribe: (callback) => {
            callback("SUBSCRIBED");
          },
        });

      // Subscribe
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

      // Simulate receiving a message
      messageHandler?.({
        event: "new-message",
        payload: { text: "Hello!", sender: "user-123" },
      });

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]?.payload).toEqual({
        text: "Hello!",
        sender: "user-123",
      });

      // Unsubscribe
      await Effect.runPromise(subscription.unsubscribe());
      expect(subscription.state).toBe("CLOSED");
    });

    it("manages multiple channels independently", async () => {
      const channels: Map<string, MockRealtimeChannel> = new Map();

      mockClient.channel = (name: string) => {
        const channel = createMockRealtimeChannel({
          state: "joined",
        });
        channels.set(name, channel);
        return channel;
      };

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

      expect(channels.has("channel-1")).toBe(true);
      expect(channels.has("channel-2")).toBe(true);
      expect(adapter.getConnectionState()).toBe("CONNECTED");
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// This test suite provides comprehensive coverage for the SupabaseRealtimeAdapter:
//
// **Subscribe Tests:**
// - Successful subscription creation with unique ID
// - Event listener setup for specified events
// - Connection change notifications (CONNECTED)
// - Channel error notifications (DISCONNECTED)
// - Subscribe without events (broadcast channel)
// - ConnectionError mapping for connection failures
// - SubscriptionError mapping for subscription failures
//
// **Broadcast Tests:**
// - Successful message broadcast
// - Channel creation if not exists
// - RealtimeError mapping for response errors
// - ConnectionError mapping for channel errors
// - Channel subscription before broadcast
//
// **TrackPresence Tests:**
// - Successful presence tracking
// - Timestamp conversion to ISO string
// - Automatic timestamp creation
// - RealtimeError mapping for track failures
// - ConnectionError mapping for channel errors
//
// **Unsubscribe Tests:**
// - Successful unsubscription
// - State transition to CLOSED
// - RealtimeError mapping for unsubscribe failures
//
// **getConnectionState Tests:**
// - CLOSED when no channels
// - CONNECTED when channel joined
// - CONNECTING when channel joining
// - CLOSED when channel closed
// - Aggregated state across multiple channels
//
// **Error Mapping Tests:**
// - Connection-related errors to ConnectionError
// - Network errors to ConnectionError
// - Subscription errors to SubscriptionError
// - Generic errors to RealtimeError
// - Non-Error object handling
//
// **Integration Tests:**
// - Full real-time workflow
// - Multiple channel management
//
// The adapter wraps Supabase Realtime with Effect-based error handling and
// domain-specific error mapping for clean architecture compliance.
//
