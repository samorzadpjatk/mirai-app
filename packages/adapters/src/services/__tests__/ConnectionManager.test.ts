import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Layer, Context } from "effect";
import { ConnectionManager } from "../ConnectionManager";
import type { RealtimePort } from "@mirai-app/use-cases";
import { RealtimeError } from "@mirai-app/use-cases/ports/RealtimePort";
import { runWithTestLayer, createServiceLayer } from "../../test/test-helpers";

// =============================================================================
// Context Tag for RealtimePort dependency injection
// =============================================================================

const RealtimePortTag = Context.Tag<RealtimePort>("RealtimePort");

// =============================================================================
// Mock Factory for RealtimePort
// =============================================================================

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

// =============================================================================
// Test Setup
// =============================================================================

describe("[UNIT] ConnectionManager", () => {
  let connectionManager: ConnectionManager;
  let mockRealtimePort: RealtimePort;

  beforeEach(() => {
    mockRealtimePort = createMockRealtimePort();
    connectionManager = new ConnectionManager(mockRealtimePort);
  });

  describe("[UNIT] userConnected", () => {
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

  describe("[UNIT] userDisconnected", () => {
    it("should remove connection by ID", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userDisconnected("user-1", "conn-1");

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });

    it("should handle disconnecting non-existent connection", () => {
      const result = connectionManager.userDisconnected(
        "user-1",
        "non-existent",
      );

      expect(result).toBe(false);
      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });
  });

  describe("[UNIT] getUserConnections", () => {
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

  describe("[UNIT] isUserOnline", () => {
    it("should return true for connected user", () => {
      connectionManager.userConnected("user-1", "conn-1");

      expect(connectionManager.isUserOnline("user-1")).toBe(true);
    });

    it("should return false for disconnected user", () => {
      expect(connectionManager.isUserOnline("user-1")).toBe(false);
    });
  });

  describe("[UNIT] getOnlineUsers", () => {
    it("should return all online users", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      const onlineUsers = connectionManager.getOnlineUsers();

      expect(onlineUsers).toContain("user-1");
      expect(onlineUsers).toContain("user-2");
      expect(onlineUsers).toHaveLength(2);
    });
  });

  describe("[UNIT] broadcastLocation", () => {
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

      const TestLayer = createServiceLayer(RealtimePortTag, mockRealtimePort);

      const result = await runWithTestLayer(
        connectionManager.broadcastLocation("user-1", location, [
          "friend-1",
          "friend-2",
        ]),
        TestLayer,
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
      const TestLayer = createServiceLayer(RealtimePortTag, mockRealtimePort);
      const result = await runWithTestLayer(
        connectionManager.broadcastLocation("user-1", location, ["friend-1"]),
        TestLayer,
      );

      expect(result.throttled).toBe(true);
      expect(result.broadcastCount).toBe(0);
    });

    it("should work with Effect.provide pattern", async () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("friend-1", "conn-2");

      const location = {
        userId: "user-1",
        latitude: 40.0,
        longitude: -74.0,
        accuracy: 10,
        altitude: null,
        speed: null,
        timestamp: new Date(),
      };

      const program = Effect.gen(function* () {
        const result = yield* connectionManager.broadcastLocation(
          "user-1",
          location,
          ["friend-1"],
        );
        return result.success;
      }).pipe(Effect.provide(Layer.succeed(RealtimePortTag, mockRealtimePort)));

      const success = await Effect.runPromise(program);
      expect(success).toBe(true);
    });
  });

  describe("[UNIT] cleanupStaleConnections", () => {
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

  describe("[UNIT] clear", () => {
    it("should remove all connections", () => {
      connectionManager.userConnected("user-1", "conn-1");
      connectionManager.userConnected("user-2", "conn-2");

      connectionManager.clear();

      expect(connectionManager.getTotalConnectionCount()).toBe(0);
    });
  });

  describe("[UNIT] Layer-based DI patterns", () => {
    it("should demonstrate Layer.succeed for RealtimePort", async () => {
      const customMockPort: RealtimePort = {
        broadcast: () => Effect.void,
        subscribe: () =>
          Effect.succeed({
            id: "custom-sub",
            channel: "custom",
            state: "CONNECTED",
            unsubscribe: () => Effect.void,
          }),
        getConnectionState: () => "CONNECTED",
      } as RealtimePort;

      const manager = new ConnectionManager(customMockPort);
      manager.userConnected("user-1", "conn-1");

      const layer = Layer.succeed(RealtimePortTag, customMockPort);

      const program = Effect.gen(function* () {
        const result = yield* manager.broadcastLocation(
          "user-1",
          {
            userId: "user-1",
            latitude: 0,
            longitude: 0,
            accuracy: null,
            altitude: null,
            speed: null,
            timestamp: new Date(),
          },
          [],
        );
        return result;
      }).pipe(Effect.provide(layer));

      const broadcastResult = await Effect.runPromise(program);
      expect(broadcastResult).toBeDefined();
    });

    it("should demonstrate runWithTestLayer with RealtimePort", async () => {
      const testPort = createMockRealtimePort();
      const manager = new ConnectionManager(testPort);
      manager.userConnected("user-1", "conn-1");

      const TestLayer = createServiceLayer(RealtimePortTag, testPort);

      const result = await runWithTestLayer(
        manager.broadcastLocation(
          "user-1",
          {
            userId: "user-1",
            latitude: 51.5,
            longitude: -0.1,
            accuracy: 5,
            altitude: null,
            speed: null,
            timestamp: new Date(),
          },
          [],
        ),
        TestLayer,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
