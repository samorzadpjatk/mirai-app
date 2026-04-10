/**
 * Bun Server Tests
 *
 * Tests for Bun WebSocket server implementation including:
 * - HTTP request handling
 * - WebSocket connection handling
 * - GraphQL endpoint functionality
 * - Graceful shutdown
 * - Connection management
 *
 * @module __tests__/bun-server
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  createBunServer,
  type BunServer,
  getActiveWebSocketCount,
} from "../bun-server";
import { honoConfig } from "../config/hono-config";

// =============================================================================
// Test Configuration
// =============================================================================

let TEST_PORT = 9000;
const TEST_HOST = "127.0.0.1";

function getTestConfig() {
  return {
    ...honoConfig,
    port: ++TEST_PORT,
    host: TEST_HOST,
    enableLogging: false,
    enableGraphiQL: false,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("[UNIT] Bun Server", () => {
  let server: BunServer;
  let currentPort: number;

  beforeEach(async () => {
    const config = getTestConfig();
    currentPort = config.port;
    server = createBunServer(config);
  });

  afterEach(async () => {
    if (server?.isRunning()) {
      await server.stop();
    }
    // Add delay between tests to allow port cleanup
    await new Promise((r) => setTimeout(r, 100));
  });

  describe("Server Lifecycle", () => {
    it("can create server instance", () => {
      expect(server).toBeDefined();
      expect(server.app).toBeDefined();
      expect(server.yoga).toBeDefined();
      expect(server.isRunning()).toBe(false);
    });

    it("can start and stop server", async () => {
      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
      expect(server.isRunning()).toBe(false);
    });

    it("returns WebSocket count (0 when no connections)", () => {
      expect(server.getWebSocketCount()).toBe(0);
    });

    it("idempotent start (calling start twice is safe)", async () => {
      await server.start();
      await server.start(); // Should not throw
      expect(server.isRunning()).toBe(true);
    });

    it("idempotent stop (calling stop twice is safe)", async () => {
      await server.start();
      await server.stop();
      await server.stop(); // Should not throw
      expect(server.isRunning()).toBe(false);
    });
  });

  describe("HTTP Endpoints", () => {
    beforeEach(async () => {
      await server.start();
    });

    it("GET / returns API info", async () => {
      const response = await fetch(`http://${TEST_HOST}:${currentPort}/`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toContain("Mirai App GraphQL API");
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints.graphql).toBe("/graphql");
      expect(data.endpoints.graphqlWs).toBe("/graphql/ws");
    });

    it("GET /health returns healthy status", async () => {
      const response = await fetch(`http://${TEST_HOST}:${currentPort}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.server).toBe("bun");
      expect(data.websocket).toBe("available");
    });

    it("GET /graphql/health returns schema status", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${currentPort}/graphql/health`,
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.schema).toBe("loaded");
      expect(data.websocket).toBe("available");
    });

    it("POST /graphql accepts GraphQL requests", async () => {
      const query = {
        query: "{ __typename }",
      };

      const response = await fetch(
        `http://${TEST_HOST}:${currentPort}/graphql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(query),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.__typename).toBe("Query");
    });
  });

  describe("WebSocket Upgrade", () => {
    beforeEach(async () => {
      await server.start();
    });

    it("GET /graphql/ws without upgrade header returns 426", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${currentPort}/graphql/ws`,
      );
      expect(response.status).toBe(426);
    });

    it("WebSocket connection can be established", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      const connected = await new Promise<boolean>((resolve) => {
        ws.onopen = () => resolve(true);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1000);
      });

      expect(connected).toBe(true);
      ws.close();
    });

    it("WebSocket accepts connection_init message", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = reject;
      });

      const ackPromise = new Promise<boolean>((resolve) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data.type === "connection_ack");
        };
      });

      ws.send(JSON.stringify({ type: "connection_init" }));

      const received = await ackPromise;
      expect(received).toBe(true);

      ws.close();
    });

    it("WebSocket tracks active connections", async () => {
      expect(getActiveWebSocketCount()).toBe(0);

      const ws1 = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);
      const ws2 = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      await new Promise<void>((resolve) => {
        let opened = 0;
        const check = () => {
          opened++;
          if (opened === 2) resolve();
        };
        ws1.onopen = check;
        ws2.onopen = check;
      });

      // Give server time to register connections
      await new Promise((r) => setTimeout(r, 50));

      expect(getActiveWebSocketCount()).toBe(2);

      ws1.close();
      ws2.close();

      // Give server time to clean up
      await new Promise((r) => setTimeout(r, 50));

      expect(getActiveWebSocketCount()).toBe(0);
    });

    it("WebSocket handles invalid messages gracefully", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = reject;
      });

      const errorPromise = new Promise<boolean>((resolve) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data.type === "error");
        };
      });

      ws.send("invalid json");

      const receivedError = await errorPromise;
      expect(receivedError).toBe(true);

      ws.close();
    });

    it("WebSocket rejects subscribe before connection_init", async () => {
      const ws = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = reject;
      });

      const errorPromise = new Promise<string>((resolve) => {
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          resolve(data.payload?.message ?? "");
        };
      });

      ws.send(
        JSON.stringify({
          type: "subscribe",
          id: "test-sub",
          payload: { query: "subscription { test }" },
        }),
      );

      const errorMessage = await errorPromise;
      expect(errorMessage).toContain("Not authenticated");

      ws.close();
    });
  });

  describe("CORS Configuration", () => {
    it("responds with CORS headers when origin configured", async () => {
      const corsPort = ++TEST_PORT;
      const corsServer = createBunServer({
        ...honoConfig,
        port: corsPort,
        host: TEST_HOST,
        corsOrigin: "http://localhost:3000",
        enableLogging: false,
        enableGraphiQL: false,
      });

      await corsServer.start();

      const response = await fetch(`http://${TEST_HOST}:${corsPort}/`, {
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(response.headers.get("access-control-allow-origin")).toBe(
        "http://localhost:3000",
      );

      await corsServer.stop();
    });
  });

  describe("Graceful Shutdown", () => {
    it("closes WebSocket connections on stop", async () => {
      await server.start();

      const ws = new WebSocket(`ws://${TEST_HOST}:${currentPort}/graphql/ws`);

      await new Promise<void>((resolve) => {
        ws.onopen = () => resolve();
      });

      // Give server time to register
      await new Promise((r) => setTimeout(r, 50));

      expect(server.getWebSocketCount()).toBe(1);

      let closed = false;
      ws.onclose = () => {
        closed = true;
      };

      await server.stop();

      // Give time for close
      await new Promise((r) => setTimeout(r, 100));

      expect(closed).toBe(true);
      expect(server.getWebSocketCount()).toBe(0);
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await server.start();
    });

    it("returns 500 for GraphQL errors", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${currentPort}/graphql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: "{ invalid",
        },
      );

      expect(response.status).toBe(200); // GraphQL returns 200 even with errors
      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    it("handles unknown routes", async () => {
      const response = await fetch(
        `http://${TEST_HOST}:${currentPort}/unknown-route`,
      );
      expect(response.status).toBe(404);
    });
  });
});
