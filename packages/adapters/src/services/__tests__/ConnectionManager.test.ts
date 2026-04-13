import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { ConnectionManager } from "../ConnectionManager";
import type { RealtimePort } from "@mirai-app/use-cases";
import { RealtimeError } from "@mirai-app/use-cases/ports/RealtimePort";

// Mock RealtimePort
const createMockRealtimePort = (): RealtimePort =>
  ({
    broadcast: mock(() => Effect.void),
    subscribe: mock(() =>
      Effect.succeed({
        id: "test-sub",
        channel: "test",
        state: "CONNECTED" as const,
        unsubscribe: () => Effect.void,
      }),
    ),
    getConnectionState: mock(() => "CONNECTED" as const),
  }) as unknown as RealtimePort;

describe("[UNIT] ConnectionManager", () => {
  let connectionManager: ConnectionManager;
  let mockRealtimePort: RealtimePort;

  beforeEach(() => {
    mockRealtimePort = createMockRealtimePort();
    connectionManager = new ConnectionManager(mockRealtimePort);
  });

  describe("userConnected", () => {
    it("should register a new connection", () => {
      const info = connectionManager.userConnected("user-1", "conn-1");

      expect(info.userId).toBe("user-1");
      expect(info.connectionId).toBe("conn-1");
      expect(connectionManager.getTotalConnectionCount()).toBe(1);
    });

    it("should register multiple connections for same user", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");

      expect(connectionManager.getTotalConnectionCount()).toBe(2);
      expect(connectionManager.getConnectionCount("user-1")).toBe(2);
    });
  });

  describe("userDisconnected", () => {
    it("should remove connection by ID", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userDisconnected("user-1", "conn-1");

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });

    it("should handle disconnecting non-existent connection", () => {
      // Should not throw
      const result = connectionManager.userDisconnected(
        "user-1",
        "non-existent",
      );

      expect(result).toBe(false);
      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });
  });

  describe("getUserConnections", () => {
    it("should return connections for user", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-1", "conn-2");
      connectionManager.userConnected("user-2", "conn-3");

      const user1Connections = connectionManager.getUserConnections("user-1");

      expect(user1Connections).toHaveLength(2);
    });

    it("should return empty array for user with no connections", () => {
      const connections = connectionManager.getUserConnections("no-user");

      expect(connections).toEqual([]);
    });
  });

  describe("isUserOnline", () => {
    it("should return true for connected user", () => {
      connectionManager.userConnected("user-1", "conn-1");

      expect(connectionManager.isUserOnline("user-1")).toBe(true);
    });

    it("should return false for disconnected user", () => {
      expect(connectionManager.isUserOnline("user-1")).toBe(false);
    });
  });

  describe("getOnlineUsers", () => {
    it("should return all online users", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      const onlineUsers = connectionManager.getOnlineUsers();

      expect(onlineUsers).toContain("user-1");
      expect(onlineUsers).toContain("user-2");
      expect(onlineUsers).toHaveLength(2);
    });
  });

  describe("broadcastLocation", () => {
    it("should broadcast location to online friends", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("friend-1", "conn-2");

      const location = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: 5.5,
        timestamp: new Date(),
      };

      const result = await Effect.runPromise(
        connectionManager.broadcastLocation("user-1", location, [
          "friend-1",
          "friend-2",
        ]),
      );

      expect(result.success).toBe(true);
      expect(result.broadcastCount).toBe(1);
      expect(result.throttled).toBe(false);
    });

    it("should throttle frequent updates", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("friend-1", "conn-2");

      const location = {
        userId: "user-1",
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        speed: 5.5,
        timestamp: new Date(),
      };

      // First update
      await Effect.runPromise(
        connectionManager.broadcastLocation("user-1", location, ["friend-1"]),
      );

      // Immediate second update should be throttled
      const result = await Effect.runPromise(
        connectionManager.broadcastLocation("user-1", location, ["friend-1"]),
      );

      expect(result.throttled).toBe(true);
      expect(result.broadcastCount).toBe(0);
    });
  });

  describe("cleanupStaleConnections", () => {
    it("should remove stale connections", async () => {
      connectionManager.userConnected("user-1", "conn-1");

      // Wait a bit to ensure connection becomes "stale"
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Cleanup with 5ms max idle should remove the connection
      const cleaned = connectionManager.cleanupStaleConnections(5);

      expect(cleaned).toBe(1);
      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });
  });

  describe("clear", () => {
    it("should remove all connections", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      connectionManager.clear();

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });
  });
});
