import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Data } from "effect";
import type { RealtimePort } from "@mirai-app/use-cases";
import {
  RealtimeError,
  ConnectionError,
  SubscriptionError,
} from "@mirai-app/use-cases/system/shared/realtime/port";
import type {
  ConnectionState,
  RealtimeSubscription,
  ChannelConfig,
  PresenceState,
} from "@mirai-app/use-cases";
import {
  ConnectionManager,
  type ConnectionInfo,
  type BroadcastLocation,
} from "./connection-manager";

// Mock RealtimePort for testing
class MockRealtimePort implements RealtimePort {
  private shouldFail = false;
  private failForChannels: string[] = [];

  setShouldFail(value: boolean): void {
    this.shouldFail = value;
  }

  setFailForChannels(channels: string[]): void {
    this.failForChannels = channels;
  }

  reset(): void {
    this.shouldFail = false;
    this.failForChannels = [];
  }

  subscribe(
    _channel: string,
    _config: ChannelConfig,
  ): Effect.Effect<
    RealtimeSubscription,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    return Effect.succeed({
      id: "sub-1",
      channel: _channel,
      state: "CONNECTED" as ConnectionState,
      unsubscribe: () => Effect.void,
    });
  }

  broadcast(
    channel: string,
    _event: string,
    _payload: unknown,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    if (this.shouldFail || this.failForChannels.includes(channel)) {
      return Effect.fail(
        new RealtimeError({
          message: `Failed to broadcast to ${channel}`,
          code: "REALTIME_ERROR",
        }),
      );
    }
    return Effect.void;
  }

  trackPresence(
    _channel: string,
    _state: PresenceState,
  ): Effect.Effect<
    void,
    RealtimeError | ConnectionError | SubscriptionError,
    never
  > {
    return Effect.void;
  }

  getConnectionState(): ConnectionState {
    return "CONNECTED";
  }
}

describe("[UNIT] ConnectionManager", () => {
  let mockRealtimePort: MockRealtimePort;
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    mockRealtimePort = new MockRealtimePort();
    connectionManager = new ConnectionManager(mockRealtimePort);
  });

  describe("userConnected", () => {
    it("registers a new user connection", () => {
      const userId = "user-123";
      const connectionId = "conn-456";

      const connection = connectionManager.userConnected(userId, connectionId);

      expect(connection.userId).toBe(userId);
      expect(connection.connectionId).toBe(connectionId);
      expect(connection.connectedAt).toBeInstanceOf(Date);
      expect(connection.lastActivityAt).toBeInstanceOf(Date);
    });

    it("registers multiple connections for same user", () => {
      const userId = "user-123";

      connectionManager.userConnected(userId, "conn-1");
      connectionManager.userConnected(userId, "conn-2");

      expect(connectionManager.getConnectionCount(userId)).toBe(2);
    });

    it("stores metadata with connection", () => {
      const userId = "user-123";
      const metadata = { device: "mobile", version: "1.0" };

      const connection = connectionManager.userConnected(
        userId,
        "conn-1",
        metadata,
      );

      expect(connection.metadata).toEqual(metadata);
    });

    it("evicts oldest connection when exceeding max connections per user", () => {
      const userId = "user-123";
      const maxConnections = 3;
      const limitedManager = new ConnectionManager(mockRealtimePort, {
        maxConnectionsPerUser: maxConnections,
      });

      // Create connections with delays to ensure different timestamps
      limitedManager.userConnected(userId, "conn-1");
      limitedManager.userConnected(userId, "conn-2");
      limitedManager.userConnected(userId, "conn-3");
      limitedManager.userConnected(userId, "conn-4");

      expect(limitedManager.getConnectionCount(userId)).toBe(maxConnections);
      expect(limitedManager.getConnection(userId, "conn-1")).toBeUndefined();
      expect(limitedManager.getConnection(userId, "conn-4")).toBeDefined();
    });
  });

  describe("userDisconnected", () => {
    it("removes an existing connection", () => {
      const userId = "user-123";
      connectionManager.userConnected(userId, "conn-1");

      const removed = connectionManager.userDisconnected(userId, "conn-1");

      expect(removed).toBe(true);
      expect(connectionManager.isUserOnline(userId)).toBe(false);
    });

    it("returns false when connection does not exist", () => {
      const removed = connectionManager.userDisconnected(
        "nonexistent",
        "conn-1",
      );
      expect(removed).toBe(false);
    });

    it("returns false when user has no connections", () => {
      connectionManager.userConnected("user-123", "conn-1");

      const removed = connectionManager.userDisconnected("user-123", "conn-2");

      expect(removed).toBe(false);
    });

    it("cleans up user entry when last connection removed", () => {
      const userId = "user-123";
      connectionManager.userConnected(userId, "conn-1");

      connectionManager.userDisconnected(userId, "conn-1");

      expect(connectionManager.getOnlineUsers()).not.toContain(userId);
    });

    it("keeps user entry when they have other connections", () => {
      const userId = "user-123";
      connectionManager.userConnected(userId, "conn-1");
      connectionManager.userConnected(userId, "conn-2");

      connectionManager.userDisconnected(userId, "conn-1");

      expect(connectionManager.isUserOnline(userId)).toBe(true);
      expect(connectionManager.getConnectionCount(userId)).toBe(1);
    });
  });

  describe("broadcastLocation", () => {
    const createLocation = (
      overrides?: Partial<BroadcastLocation>,
    ): BroadcastLocation => ({
      userId: "user-123",
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      altitude: null,
      speed: 5.5,
      timestamp: new Date(),
      ...overrides,
    });

    it("broadcasts to online friends", async () => {
      const userId = "user-123";
      const friendId = "friend-456";
      const location = createLocation({ userId });

      // Connect both users
      connectionManager.userConnected(userId, "conn-1");
      connectionManager.userConnected(friendId, "conn-2");

      const result = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, [friendId]),
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(1);
      expect(result.throttled).toBe(false);
    });

    it("skips offline friends", async () => {
      const userId = "user-123";
      const location = createLocation({ userId });

      connectionManager.userConnected(userId, "conn-1");
      // friend-456 is offline

      const result = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, ["friend-456"]),
      );

      expect(result.success).toBe(false); // No broadcasts to offline friends
      expect(result.broadcastCount).toBe(0); // But no actual broadcasts
      expect(result.throttled).toBe(false);
    });

    it("throttles rapid updates", async () => {
      const userId = "user-123";
      const friendId = "friend-456";
      const location = createLocation({ userId });

      connectionManager.userConnected(userId, "conn-1");
      connectionManager.userConnected(friendId, "conn-2");

      // First broadcast should succeed
      const result1 = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, [friendId]),
      );
      expect(result1.throttled).toBe(false);

      // Immediate second broadcast should be throttled
      const result2 = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, [friendId]),
      );
      expect(result2.throttled).toBe(true);
      expect(result2.broadcastCount).toBe(0);
    });

    it("allows broadcast after throttle window", async () => {
      const userId = "user-123";
      const friendId = "friend-456";
      const location = createLocation({ userId });

      // Use a custom manager with 0 throttle for testing
      const fastManager = new ConnectionManager(mockRealtimePort, {
        throttleMs: 0,
      });

      fastManager.userConnected(userId, "conn-1");
      fastManager.userConnected(friendId, "conn-2");

      const result1 = await Effect.runPromise(
        fastManager.broadcastLocation(userId, location, [friendId]),
      );
      const result2 = await Effect.runPromise(
        fastManager.broadcastLocation(userId, location, [friendId]),
      );

      expect(result1.throttled).toBe(false);
      expect(result2.throttled).toBe(false);
    });

    it("handles broadcast failures gracefully", async () => {
      const userId = "user-123";
      const friendId = "friend-456";
      const location = createLocation({ userId });

      connectionManager.userConnected(userId, "conn-1");
      connectionManager.userConnected(friendId, "conn-2");

      mockRealtimePort.setShouldFail(true);

      const result = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, [friendId]),
      );

      // Should still succeed (failures are caught) but report errors
      expect(result.success).toBe(false); // No successful broadcasts
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("succeeds when no friends provided", async () => {
      const userId = "user-123";
      const location = createLocation({ userId });

      connectionManager.userConnected(userId, "conn-1");

      const result = await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, []),
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(0);
    });

    it("updates activity timestamp during broadcast", async () => {
      const userId = "user-123";
      const location = createLocation({ userId });

      connectionManager.userConnected(userId, "conn-1");
      const beforeActivity = connectionManager.getConnection(
        userId,
        "conn-1",
      )!.lastActivityAt;

      // Wait a tiny bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await Effect.runPromise(
        connectionManager.broadcastLocation(userId, location, []),
      );

      const afterActivity = connectionManager.getConnection(
        userId,
        "conn-1",
      )!.lastActivityAt;
      expect(afterActivity.getTime()).toBeGreaterThan(beforeActivity.getTime());
    });
  });

  describe("isUserOnline", () => {
    it("returns true for user with connections", () => {
      connectionManager.userConnected("user-123", "conn-1");
      expect(connectionManager.isUserOnline("user-123")).toBe(true);
    });

    it("returns false for user without connections", () => {
      expect(connectionManager.isUserOnline("nonexistent")).toBe(false);
    });

    it("returns false for disconnected user", () => {
      connectionManager.userConnected("user-123", "conn-1");
      connectionManager.userDisconnected("user-123", "conn-1");
      expect(connectionManager.isUserOnline("user-123")).toBe(false);
    });
  });

  describe("getOnlineUsers", () => {
    it("returns empty array when no users connected", () => {
      expect(connectionManager.getOnlineUsers()).toEqual([]);
    });

    it("returns only users with active connections", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-1", "conn-3"); // Second connection

      const online = connectionManager.getOnlineUsers();

      expect(online).toContain("user-1");
      expect(online).toContain("user-2");
      expect(online).toHaveLength(2);
    });
  });

  describe("getConnectionCount", () => {
    it("returns 0 for user with no connections", () => {
      expect(connectionManager.getConnectionCount("nonexistent")).toBe(0);
    });

    it("returns correct count for user with connections", () => {
      connectionManager.userConnected("user-123", "conn-1");
      connectionManager.userConnected("user-123", "conn-2");

      expect(connectionManager.getConnectionCount("user-123")).toBe(2);
    });
  });

  describe("getTotalConnectionCount", () => {
    it("returns 0 when no connections", () => {
      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });

    it("returns total across all users", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-2", "conn-3");

      expect(connectionManager.getTotalConnectionCount()).toBe(3);
    });
  });

  describe("getConnection", () => {
    it("returns connection info when found", () => {
      const userId = "user-123";
      const connectionId = "conn-1";
      connectionManager.userConnected(userId, connectionId, { device: "web" });

      const connection = connectionManager.getConnection(userId, connectionId);

      expect(connection).toBeDefined();
      expect(connection!.userId).toBe(userId);
      expect(connection!.connectionId).toBe(connectionId);
      expect(connection!.metadata).toEqual({ device: "web" });
    });

    it("returns undefined when connection not found", () => {
      expect(
        connectionManager.getConnection("user-123", "nonexistent"),
      ).toBeUndefined();
    });

    it("returns undefined when user not found", () => {
      expect(
        connectionManager.getConnection("nonexistent", "conn-1"),
      ).toBeUndefined();
    });
  });

  describe("getUserConnections", () => {
    it("returns empty array for user with no connections", () => {
      expect(connectionManager.getUserConnections("nonexistent")).toEqual([]);
    });

    it("returns all connections for user", () => {
      connectionManager.userConnected("user-123", "conn-1");
      connectionManager.userConnected("user-123", "conn-2");

      const connections = connectionManager.getUserConnections("user-123");

      expect(connections).toHaveLength(2);
      expect(connections.map((c) => c.connectionId).sort()).toEqual([
        "conn-1",
        "conn-2",
      ]);
    });
  });

  describe("cleanupStaleConnections", () => {
    it("removes connections idle longer than threshold", async () => {
      const userId = "user-123";
      connectionManager.userConnected(userId, "conn-1");

      // Wait a bit and clean up with 0 threshold
      await new Promise((resolve) => setTimeout(resolve, 50));

      const cleaned = connectionManager.cleanupStaleConnections(25);

      expect(cleaned).toBe(1);
      expect(connectionManager.isUserOnline(userId)).toBe(false);
    });

    it("keeps active connections", () => {
      const userId = "user-123";
      connectionManager.userConnected(userId, "conn-1");

      // Clean up with very high threshold
      const cleaned = connectionManager.cleanupStaleConnections(60000);

      expect(cleaned).toBe(0);
      expect(connectionManager.isUserOnline(userId)).toBe(true);
    });

    it("cleans up multiple stale connections", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-2", "conn-3");

      // Wait and clean up
      await new Promise((resolve) => setTimeout(resolve, 50));
      const cleaned = connectionManager.cleanupStaleConnections(25);

      expect(cleaned).toBe(3);
    });

    it("uses default 5 minute threshold when not specified", async () => {
      // This test just verifies the method works with defaults
      connectionManager.userConnected("user-123", "conn-1");

      const cleaned = connectionManager.cleanupStaleConnections();

      // Should not clean up fresh connections
      expect(cleaned).toBe(0);
    });
  });

  describe("clear", () => {
    it("removes all connections", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      connectionManager.clear();

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
      expect(connectionManager.getOnlineUsers()).toEqual([]);
    });

    it("allows new connections after clear", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.clear();

      connectionManager.userConnected("user-1", "conn-2");

      expect(connectionManager.isUserOnline("user-1")).toBe(true);
    });
  });
});

// Summary
// Files modified: packages/adapters/src/system/shared/services/connection-manager.test.ts (created)
// Key changes:
// - Added comprehensive unit tests for ConnectionManager
// - Tests cover user connection lifecycle (connect/disconnect)
// - Tests for location broadcasting with throttling logic
// - Tests for LRU eviction when max connections per user exceeded
// - Tests for stale connection cleanup
// - Mock RealtimePort implementation for isolated testing
// - Effect patterns used for async operations and error handling
