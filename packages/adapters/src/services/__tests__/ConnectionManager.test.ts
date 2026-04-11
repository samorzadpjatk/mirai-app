import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ConnectionManager } from "../ConnectionManager";

describe("[UNIT] ConnectionManager", () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
  });

  describe("registerConnection", () => {
    it("should register a new connection", () => {
      const connection = { id: "conn-1", userId: "user-1" };

      connectionManager.registerConnection(connection);

      expect(connectionManager.getConnectionCount()).toBe(1);
    });

    it("should register multiple connections for same user", () => {
      connectionManager.registerConnection({ id: "conn-1", userId: "user-1" });
      connectionManager.registerConnection({ id: "conn-2", userId: "user-1" });

      expect(connectionManager.getConnectionCount()).toBe(2);
      expect(connectionManager.getUserConnectionCount("user-1")).toBe(2);
    });
  });

  describe("unregisterConnection", () => {
    it("should remove connection by ID", () => {
      connectionManager.registerConnection({ id: "conn-1", userId: "user-1" });
      connectionManager.unregisterConnection("conn-1");

      expect(connectionManager.getConnectionCount()).toBe(0);
    });

    it("should handle unregistering non-existent connection", () => {
      // Should not throw
      connectionManager.unregisterConnection("non-existent");

      expect(connectionManager.getConnectionCount()).toBe(0);
    });
  });

  describe("getConnectionsForUser", () => {
    it("should return connections for user", () => {
      connectionManager.registerConnection({ id: "conn-1", userId: "user-1" });
      connectionManager.registerConnection({ id: "conn-2", userId: "user-1" });
      connectionManager.registerConnection({ id: "conn-3", userId: "user-2" });

      const user1Connections =
        connectionManager.getConnectionsForUser("user-1");

      expect(user1Connections).toHaveLength(2);
    });

    it("should return empty array for user with no connections", () => {
      const connections = connectionManager.getConnectionsForUser("no-user");

      expect(connections).toEqual([]);
    });
  });

  describe("broadcast", () => {
    it("should send message to all connections", () => {
      const conn1 = { id: "conn-1", userId: "user-1", send: mock(() => {}) };
      const conn2 = { id: "conn-2", userId: "user-2", send: mock(() => {}) };

      connectionManager.registerConnection(
        conn1 as unknown as { id: string; userId: string },
      );
      connectionManager.registerConnection(
        conn2 as unknown as { id: string; userId: string },
      );
      connectionManager.broadcast({ type: "test" });

      expect(conn1.send).toHaveBeenCalledWith({ type: "test" });
      expect(conn2.send).toHaveBeenCalledWith({ type: "test" });
    });
  });

  describe("sendToUser", () => {
    it("should send message to specific user", () => {
      const conn1 = { id: "conn-1", userId: "user-1", send: mock(() => {}) };
      const conn2 = { id: "conn-2", userId: "user-2", send: mock(() => {}) };

      connectionManager.registerConnection(
        conn1 as unknown as { id: string; userId: string },
      );
      connectionManager.registerConnection(
        conn2 as unknown as { id: string; userId: string },
      );
      connectionManager.sendToUser("user-1", { type: "test" });

      expect(conn1.send).toHaveBeenCalledWith({ type: "test" });
      expect(conn2.send).not.toHaveBeenCalled();
    });
  });
});
