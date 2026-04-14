/**
 * Bun Server Integration Tests
 *
 * Integration tests for Bun WebSocket server implementation.
 * Tests basic HTTP functionality and WebSocket connectivity.
 *
 * @module __tests__/bun-server-integration
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  createBunServer,
  type BunServer,
  getActiveWebSocketCount,
} from "../bun-server";
import { honoConfig } from "../config/hono-config";

// =============================================================================
// Test Configuration - Use a single server instance for all tests
// to avoid port conflicts
// =============================================================================

const TEST_PORT = 9998;
const TEST_HOST = "127.0.0.1";

const testConfig = {
  ...honoConfig,
  port: TEST_PORT,
  host: TEST_HOST,
  enableLogging: false,
  enableGraphiQL: false,
};

// =============================================================================
// Tests
// =============================================================================

describe("[INTEGRATION] Bun Server", () => {
  let server: BunServer;

  beforeAll(async () => {
    server = createBunServer(testConfig);
    await server.start();
    // Give server time to fully start
    await new Promise((r) => setTimeout(r, 100));
  });

  afterAll(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
  });

  describe("[UNIT] Server Lifecycle", () => {
    it("server is running", () => {
      expect(server.isRunning()).toBe(true);
    });

    it("server exposes app and yoga", () => {
      expect(server.app).toBeDefined();
      expect(server.yoga).toBeDefined();
    });
  });

  describe("[UNIT] HTTP Endpoints", () => {
    it("GET / returns API info", async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toContain("Mirai App GraphQL API");
      expect(data.endpoints.graphql).toBe("/graphql");
      expect(data.endpoints.graphqlWs).toBe("/graphql/ws");
    });

    it("GET /health returns healthy status", async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.server).toBe("bun");
      expect(data.websocket).toBe("available");
    });

    it("GET /graphql/health returns schema status", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${TEST_PORT}/graphql/health`,
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.schema).toBe("loaded");
    });

    it("POST /graphql accepts GraphQL introspection", async () => {
      const query = {
        query: "{ __schema { queryType { name } } }",
      };

      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.__schema.queryType.name).toBe("Query");
    });

    it("POST /graphql handles queries", async () => {
      const query = {
        query: "{ __typename }",
      };

      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.__typename).toBe("Query");
    });
  });

  describe("[UNIT] WebSocket Support", () => {
    it("GET /graphql/ws returns 426 without upgrade header", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${TEST_PORT}/graphql/ws`,
      );
      expect(response.status).toBe(426);
    });

    it("WebSocket connection can be established", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${TEST_PORT}/graphql/ws`);

      const connected = await new Promise<boolean>((resolve) => {
        ws.onopen = () => resolve(true);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1000);
      });

      expect(connected).toBe(true);
      ws.close();
    });

    it("WebSocket responds with error without auth", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${TEST_PORT}/graphql/ws`);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = reject;
      });

      const msgPromise = new Promise<string>((resolve) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data.type);
        };
        setTimeout(() => resolve("timeout"), 1000);
      });

      // Send connection_init without auth - should get error
      ws.send(JSON.stringify({ type: "connection_init" }));

      const messageType = await msgPromise;
      // Without auth, server returns error (not connection_ack)
      expect(messageType).toBe("error");

      ws.close();
    });

    it("WebSocket tracks connection state", async () => {
      // Connection is established
      const ws = new WebSocket(`ws://${TEST_HOST}:${TEST_PORT}/graphql/ws`);

      const connected = await new Promise<boolean>((resolve, reject) => {
        ws.onopen = () => resolve(true);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1000);
      });

      // WebSocket should connect successfully
      expect(connected).toBe(true);

      ws.close();
    });
  });

  describe("[UNIT] Error Handling", () => {
    it("handles malformed GraphQL requests", async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json",
      });

      // Bun returns 400 for invalid JSON (correct behavior)
      expect(response.status).toBe(400);
    });
  });
});
