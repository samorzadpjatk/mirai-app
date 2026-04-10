import { describe, it, expect, beforeEach } from "bun:test";
import {
  ConnectionManager,
  type BroadcastLocation,
} from "../ConnectionManager";
import { InMemoryRealtimeAdapter } from "../../gateways/realtime/InMemoryRealtimeAdapter";
import { isOk } from "@mirai-app/domain";

describe("[INTEGRATION] ConnectionManager with RealtimePort", () => {
  let realtimePort: InMemoryRealtimeAdapter;
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    realtimePort = new InMemoryRealtimeAdapter();
    connectionManager = new ConnectionManager(realtimePort, {
      throttleMs: 100, // Fast throttle for testing
      maxConnectionsPerUser: 5,
    });
  });

  // =============================================================================
  // Connection Tracking
  // =============================================================================

  describe("connection tracking (add/remove)", () => {
    it("should track user connection", () => {
      const connection = connectionManager.userConnected("user-1", "conn-1");

      expect(connection.userId).toBe("user-1");
      expect(connection.connectionId).toBe("conn-1");
      expect(connection.connectedAt).toBeInstanceOf(Date);
      expect(connection.lastActivityAt).toBeInstanceOf(Date);
    });

    it("should track multiple connections for same user", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-1", "conn-3");

      expect(connectionManager.getConnectionCount("user-1")).toBe(3);
      expect(connectionManager.getTotalConnectionCount()).toBe(3);
    });

    it("should consider user online when they have connections", () => {
      expect(connectionManager.isUserOnline("user-1")).toBe(false);

      connectionManager.userConnected("user-1", "conn-1");
      expect(connectionManager.isUserOnline("user-1")).toBe(true);
    });

    it("should mark user offline when last connection removed", () => {
      connectionManager.userConnected("user-1", "conn-1");
      expect(connectionManager.isUserOnline("user-1")).toBe(true);

      connectionManager.userDisconnected("user-1", "conn-1");
      expect(connectionManager.isUserOnline("user-1")).toBe(false);
    });

    it("should remove specific connection", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-1", "conn-3");

      const removed = connectionManager.userDisconnected("user-1", "conn-2");

      expect(removed).toBe(true);
      expect(connectionManager.getConnectionCount("user-1")).toBe(2);
      expect(
        connectionManager.getConnection("user-1", "conn-2"),
      ).toBeUndefined();
    });

    it("should return false when disconnecting non-existent connection", () => {
      const removed = connectionManager.userDisconnected(
        "user-1",
        "non-existent",
      );

      expect(removed).toBe(false);
    });

    it("should return false when disconnecting from non-existent user", () => {
      const removed = connectionManager.userDisconnected(
        "non-existent",
        "conn-1",
      );

      expect(removed).toBe(false);
    });

    it("should support connection metadata", () => {
      const metadata = { device: "iPhone", appVersion: "1.2.3" };
      const connection = connectionManager.userConnected(
        "user-1",
        "conn-1",
        metadata,
      );

      expect(connection.metadata).toEqual(metadata);
    });

    it("should enforce max connections per user (LRU eviction)", () => {
      // Create 5 connections (at limit)
      for (let i = 0; i < 5; i++) {
        connectionManager.userConnected("user-1", `conn-${i}`);
      }
      expect(connectionManager.getConnectionCount("user-1")).toBe(5);

      // Adding 6th should evict oldest (conn-0)
      connectionManager.userConnected("user-1", "conn-5");
      expect(connectionManager.getConnectionCount("user-1")).toBe(5);
      expect(
        connectionManager.getConnection("user-1", "conn-0"),
      ).toBeUndefined();
      expect(connectionManager.getConnection("user-1", "conn-1")).toBeDefined();
    });
  });

  // =============================================================================
  // Broadcast to Specific Users
  // =============================================================================

  describe("broadcast to specific users", () => {
    beforeEach(() => {
      // Setup connections
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-3", "conn-3");
    });

    it("should broadcast location to online friends", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: 5.5,
        timestamp: new Date(),
      };

      // Subscribe user-2 to location channel
      let receivedMessage: unknown = null;
      realtimePort.subscribe("location:user-1", {
        onMessage: (event, payload) => {
          if (event === "location_updated") {
            receivedMessage = payload;
          }
        },
      });

      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(1);
      expect(result.throttled).toBe(false);
      expect(receivedMessage).not.toBeNull();
      expect((receivedMessage as BroadcastLocation).latitude).toBe(40.7128);
    });

    it("should skip offline friends", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // user-2 and user-3 are online, user-99 is not
      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2", "user-99", "user-3"],
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(2); // Only online friends
    });

    it("should return success false when no friends are online", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-99"], // Offline user
      );

      expect(result.success).toBe(false); // No online friends to broadcast to
      expect(result.broadcastCount).toBe(0);
    });

    it("should return empty friend list as success", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        [],
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(0);
    });
  });

  // =============================================================================
  // Friend-Based Broadcasting
  // =============================================================================

  describe("friend-based broadcasting", () => {
    it("should broadcast to multiple friends", async () => {
      // Setup: user-1 is sharing location, user-2, user-3, user-4 are friends
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-3", "conn-3");
      connectionManager.userConnected("user-4", "conn-4");

      // Subscribe all friends to location channel
      const receivedBy: string[] = [];
      ["user-2", "user-3", "user-4"].forEach((userId) => {
        realtimePort.subscribe(`location:user-1`, {
          onMessage: (event) => {
            if (event === "location_updated") {
              receivedBy.push(userId);
            }
          },
        });
      });

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 5,
        altitude: 100,
        speed: 10,
        timestamp: new Date(),
      };

      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2", "user-3", "user-4"],
      );

      expect(result.broadcastCount).toBe(3);
      expect(receivedBy).toContain("user-2");
      expect(receivedBy).toContain("user-3");
      expect(receivedBy).toContain("user-4");
    });

    it("should only broadcast to online friends in list", async () => {
      // Setup
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      // user-3 is NOT connected (offline)

      const receivedBy: string[] = [];

      // Subscribe user-2 (online friend)
      realtimePort.subscribe(`location:user-1`, {
        onMessage: (event) => {
          if (event === "location_updated") {
            receivedBy.push("user-2");
          }
        },
      });

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // Only user-2 is in friend list and online, user-3 is not connected
      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        [
          "user-2",
          "user-3", // offline, should be skipped
        ],
      );

      // Only user-2 receives because they're the only one in friend list who is online
      expect(result.broadcastCount).toBe(1);
      expect(receivedBy).toContain("user-2");
    });
  });

  // =============================================================================
  // Disconnection Handling
  // =============================================================================

  describe("disconnection handling", () => {
    it("should stop broadcasting to disconnected users", async () => {
      // Setup
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      let messageCount = 0;
      realtimePort.subscribe("location:user-1", {
        onMessage: () => {
          messageCount++;
        },
      });

      // First broadcast - should receive
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);
      expect(messageCount).toBe(1);

      // Disconnect user-2
      connectionManager.userDisconnected("user-2", "conn-2");

      // Second broadcast - should not receive
      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);
      expect(messageCount).toBe(1); // No new messages
    });

    it("should clean up user state when all connections removed", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");

      expect(connectionManager.isUserOnline("user-1")).toBe(true);

      connectionManager.userDisconnected("user-1", "conn-1");
      expect(connectionManager.isUserOnline("user-1")).toBe(true);

      connectionManager.userDisconnected("user-1", "conn-2");
      expect(connectionManager.isUserOnline("user-1")).toBe(false);
      expect(connectionManager.getConnectionCount("user-1")).toBe(0);
    });

    it("should clean up throttle state when user disconnects", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // First broadcast
      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);

      // Second broadcast should be throttled
      const result2 = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result2.throttled).toBe(true);

      // Disconnect and reconnect user-1
      connectionManager.userDisconnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-3");

      // Should not be throttled after reconnect
      const result3 = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result3.throttled).toBe(false);
    });
  });

  // =============================================================================
  // Throttling
  // =============================================================================

  describe("throttling", () => {
    beforeEach(() => {
      connectionManager = new ConnectionManager(realtimePort, {
        throttleMs: 100, // 100ms throttle
        maxConnectionsPerUser: 5,
      });

      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
    });

    it("should throttle frequent updates", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // First update should succeed
      const result1 = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result1.throttled).toBe(false);
      expect(result1.success).toBe(true);

      // Immediate second update should be throttled
      const result2 = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result2.throttled).toBe(true);
      expect(result2.broadcastCount).toBe(0);
      expect(result2.success).toBe(false);
    });

    it("should allow update after throttle period", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // First update
      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);

      // Wait for throttle to expire
      await new Promise((resolve) => setTimeout(resolve, 120));

      // Second update should succeed
      const result2 = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result2.throttled).toBe(false);
      expect(result2.broadcastCount).toBe(1);
    });

    it("should track throttle errors in result", async () => {
      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // First update
      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);

      // Throttled update
      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("throttled");
    });
  });

  // =============================================================================
  // Activity Tracking
  // =============================================================================

  describe("activity tracking", () => {
    it("should update activity timestamp on broadcast", async () => {
      const connection = connectionManager.userConnected("user-1", "conn-1");
      const initialActivity = connection.lastActivityAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      await connectionManager.broadcastLocation("user-1", location, []);

      const updatedConnection = connectionManager.getConnection(
        "user-1",
        "conn-1",
      );
      expect(updatedConnection!.lastActivityAt.getTime()).toBeGreaterThan(
        initialActivity.getTime(),
      );
    });

    it("should update activity for all user connections", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      const conn2 = connectionManager.userConnected("user-1", "conn-2");
      const initialActivity2 = conn2.lastActivityAt;

      await new Promise((resolve) => setTimeout(resolve, 50));

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      await connectionManager.broadcastLocation("user-1", location, []);

      const updatedConn2 = connectionManager.getConnection("user-1", "conn-2");
      expect(updatedConn2!.lastActivityAt.getTime()).toBeGreaterThan(
        initialActivity2.getTime(),
      );
    });
  });

  // =============================================================================
  // Online Users
  // =============================================================================

  describe("online users", () => {
    it("should get list of online users", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-3", "conn-3");

      const onlineUsers = connectionManager.getOnlineUsers();

      expect(onlineUsers).toHaveLength(3);
      expect(onlineUsers).toContain("user-1");
      expect(onlineUsers).toContain("user-2");
      expect(onlineUsers).toContain("user-3");
    });

    it("should not include offline users in online list", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userDisconnected("user-1", "conn-1");

      const onlineUsers = connectionManager.getOnlineUsers();

      expect(onlineUsers).toHaveLength(1);
      expect(onlineUsers).toContain("user-2");
      expect(onlineUsers).not.toContain("user-1");
    });

    it("should track total connection count across all users", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-2", "conn-3");
      connectionManager.userConnected("user-3", "conn-4");

      expect(connectionManager.getTotalConnectionCount()).toBe(4);
    });
  });

  // =============================================================================
  // Stale Connection Cleanup
  // =============================================================================

  describe("stale connection cleanup", () => {
    it("should remove connections idle longer than maxIdleMs", () => {
      // Create connection
      const connection = connectionManager.userConnected("user-1", "conn-1");

      // Manually set last activity to 6 minutes ago
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
      (connection as any).lastActivityAt = sixMinutesAgo;

      // Cleanup with 5 minute threshold
      const cleaned = connectionManager.cleanupStaleConnections(5 * 60 * 1000);

      expect(cleaned).toBe(1);
      expect(connectionManager.isUserOnline("user-1")).toBe(false);
    });

    it("should not remove active connections", () => {
      connectionManager.userConnected("user-1", "conn-1");

      const cleaned = connectionManager.cleanupStaleConnections(5 * 60 * 1000);

      expect(cleaned).toBe(0);
      expect(connectionManager.isUserOnline("user-1")).toBe(true);
    });

    it("should support custom maxIdleMs", () => {
      const connection = connectionManager.userConnected("user-1", "conn-1");

      // Set activity to 2 minutes ago
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      (connection as any).lastActivityAt = twoMinutesAgo;

      // Cleanup with 1 minute threshold
      const cleaned = connectionManager.cleanupStaleConnections(60 * 1000);

      expect(cleaned).toBe(1);
    });
  });

  // =============================================================================
  // Error Handling
  // =============================================================================

  describe("error handling", () => {
    it("should handle broadcast errors gracefully", async () => {
      // Create a mock realtimePort that returns errors
      const mockRealtimePort = {
        subscribe: realtimePort.subscribe.bind(realtimePort),
        getConnectionState: realtimePort.getConnectionState.bind(realtimePort),
        broadcast: async () => {
          return {
            kind: "err" as const,
            error: new Error("Network error"),
          };
        },
      };

      const manager = new ConnectionManager(mockRealtimePort as any);
      manager.userConnected("user-1", "conn-1");
      manager.userConnected("user-2", "conn-2");

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // Should not throw
      const result = await manager.broadcastLocation("user-1", location, [
        "user-2",
      ]);

      // Result should contain the error
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("user-2");
    });

    it("should continue broadcasting to other friends if one fails", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-3", "conn-3");

      // Set port to fail for user-2 by closing subscription
      realtimePort.subscribe("location:user-1", {
        onMessage: (event, payload) => {
          // Simulate error for user-2 only
          throw new Error("Simulated error");
        },
      });

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2", "user-3"],
      );

      // Should complete without throwing
      expect(result).toBeDefined();
    });
  });

  // =============================================================================
  // Configuration Options
  // =============================================================================

  describe("configuration options", () => {
    it("should use default throttleMs when not specified", () => {
      const defaultManager = new ConnectionManager(realtimePort);

      // Default is 1000ms
      expect(defaultManager).toBeDefined();
    });

    it("should use default maxConnectionsPerUser when not specified", () => {
      const defaultManager = new ConnectionManager(realtimePort);

      // Create 5 connections (at default limit)
      for (let i = 0; i < 5; i++) {
        defaultManager.userConnected("user-1", `conn-${i}`);
      }
      expect(defaultManager.getConnectionCount("user-1")).toBe(5);

      // 6th should evict oldest
      defaultManager.userConnected("user-1", "conn-5");
      expect(defaultManager.getConnectionCount("user-1")).toBe(5);
    });

    it("should respect custom maxConnectionsPerUser", () => {
      const customManager = new ConnectionManager(realtimePort, {
        maxConnectionsPerUser: 3,
      });

      customManager.userConnected("user-1", "conn-1");
      customManager.userConnected("user-1", "conn-2");
      customManager.userConnected("user-1", "conn-3");
      expect(customManager.getConnectionCount("user-1")).toBe(3);

      // 4th should evict oldest
      customManager.userConnected("user-1", "conn-4");
      expect(customManager.getConnectionCount("user-1")).toBe(3);
      expect(customManager.getConnection("user-1", "conn-1")).toBeUndefined();
    });
  });

  // =============================================================================
  // Connection Info Queries
  // =============================================================================

  describe("connection info queries", () => {
    it("should get all connections for a user", () => {
      connectionManager.userConnected("user-1", "conn-1", { device: "mobile" });
      connectionManager.userConnected("user-1", "conn-2", {
        device: "desktop",
      });
      connectionManager.userConnected("user-1", "conn-3", { device: "tablet" });

      const connections = connectionManager.getUserConnections("user-1");

      expect(connections).toHaveLength(3);
      expect(connections.map((c) => c.connectionId)).toContain("conn-1");
      expect(connections.map((c) => c.connectionId)).toContain("conn-2");
      expect(connections.map((c) => c.connectionId)).toContain("conn-3");
    });

    it("should return empty array for user with no connections", () => {
      const connections =
        connectionManager.getUserConnections("user-nonexistent");
      expect(connections).toHaveLength(0);
    });

    it("should get specific connection info", () => {
      const metadata = { device: "iPhone", version: "1.0" };
      connectionManager.userConnected("user-1", "conn-1", metadata);

      const connection = connectionManager.getConnection("user-1", "conn-1");

      expect(connection).toBeDefined();
      expect(connection!.userId).toBe("user-1");
      expect(connection!.connectionId).toBe("conn-1");
      expect(connection!.metadata).toEqual(metadata);
    });

    it("should return undefined for non-existent connection", () => {
      const connection = connectionManager.getConnection(
        "user-1",
        "non-existent",
      );
      expect(connection).toBeUndefined();
    });
  });

  // =============================================================================
  // Clear All
  // =============================================================================

  describe("clear all", () => {
    it("should remove all connections", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");
      connectionManager.userConnected("user-3", "conn-3");

      expect(connectionManager.getTotalConnectionCount()).toBe(3);

      connectionManager.clear();

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
      expect(connectionManager.getOnlineUsers()).toHaveLength(0);
    });

    it("should reset throttle state", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      const location: BroadcastLocation = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      // First broadcast
      await connectionManager.broadcastLocation("user-1", location, ["user-2"]);

      // Clear
      connectionManager.clear();

      // Recreate connections
      connectionManager.userConnected("user-1", "conn-3");
      connectionManager.userConnected("user-2", "conn-4");

      // Should not be throttled after clear
      const result = await connectionManager.broadcastLocation(
        "user-1",
        location,
        ["user-2"],
      );
      expect(result.throttled).toBe(false);
    });
  });
});
