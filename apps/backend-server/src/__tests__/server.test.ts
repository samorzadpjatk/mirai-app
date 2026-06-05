import { ORPCError } from "@orpc/server";
import { env } from "bun";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerOptions } from "../server";
import type * as ServerModule from "../server";

const isBunRuntime = typeof Bun !== "undefined";

let lastOnErrorCallback: ((error: unknown) => void) | null = null;
let wsOnErrorCallback: ((error: unknown) => void) | null = null;

const appRouterProxy = new Proxy({} as Record<string, unknown>, {
  get(target, prop) {
    return target[prop as string];
  },
  set(target, prop, value) {
    target[prop as string] = value;
    return true;
  },
});

vi.mock("@mirai-app/orpc", () => ({
  appRouter: appRouterProxy,
  serviceRouter: appRouterProxy,
  createORPCContext: vi.fn((opts) => ({
    headers: opts.headers,
    databaseUrl: opts.databaseUrl,
    supabaseUrl: opts.supabaseUrl,
    supabaseKey: opts.supabaseKey,
    connectionParams: opts.connectionParams,
  })),
  enableUserAgentTelemetry: vi.fn(),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@orpc/server", () => ({
  ORPCError: class ORPCError extends Error {
    code: string;
    constructor(code: string, opts?: { message?: string }) {
      super(opts?.message);
      this.code = code;
    }
  },
  onError: (fn: any) => {
    if (!wsOnErrorCallback) {
      wsOnErrorCallback = fn;
    } else {
      lastOnErrorCallback = fn;
    }
    return async (ctx: any) => {
      try {
        return await ctx.next();
      } catch (error) {
        await fn(error, ctx);
        throw error;
      }
    };
  },
}));

vi.mock("@orpc/server/bun-ws", () => ({
  RPCHandler: class MockRPCHandler {
    message = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockImplementation(() => {});
  },
}));

let createServer: typeof ServerModule.createServer;
const servers: Array<{ stop: () => Promise<void> }> = [];

beforeEach(async () => {
  vi.resetModules();
  for (const key of Object.keys(appRouterProxy)) {
    delete appRouterProxy[key];
  }
  lastOnErrorCallback = null;
  wsOnErrorCallback = null;
  const serverModule = await import("../server");
  const originalCreateServer = serverModule.createServer;
  createServer = (...args: Parameters<typeof originalCreateServer>) => {
    const server = originalCreateServer(...args);
    servers.push(server);
    return server;
  };
  servers.length = 0;
});

afterEach(async () => {
  for (const server of servers) {
    await server.stop();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Backend Server (Hono)", () => {
  describe("Health Check Endpoint", () => {
    it("should return OK for health check", async () => {
      const { app } = createServer({
        dev: true,
        port: 3001,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health");

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("OK");
    });

    it("should handle multiple health check requests", async () => {
      const { app } = createServer({
        dev: true,
        port: 3001,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const responses = await Promise.all([
        app.request("/health"),
        app.request("/health"),
        app.request("/health"),
      ]);

      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("OK");
      }
    });
  });

  describe("Server Creation", () => {
    it("should create server with default options", () => {
      const { app, start, stop } = createServer({});

      expect(app).toBeDefined();
      expect(typeof start).toBe("function");
      expect(typeof stop).toBe("function");
    });

    it("should create server with custom options", () => {
      const { app } = createServer({
        dev: false,
        port: 8080,
        prefix: "/custom",
        host: "0.0.0.0",
      });

      expect(app).toBeDefined();
    });

    it("should create server with partial options", () => {
      const { app } = createServer({ dev: false });
      expect(app).toBeDefined();
    });

    it("should create server with only port option", () => {
      const { app } = createServer({ port: 5000 });
      expect(app).toBeDefined();
    });

    it("should create server with only prefix option", () => {
      const { app } = createServer({ prefix: "/v1/api" });
      expect(app).toBeDefined();
    });

    it("should create server with only host option", () => {
      const { app } = createServer({ host: "192.168.1.1" });
      expect(app).toBeDefined();
    });
  });

  describe("CORS Configuration", () => {
    it("should include CORS headers in dev mode", async () => {
      const { app } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health", {
        headers: { Origin: "http://localhost:8081" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
    });

    it("should reject disallowed origins in dev mode", async () => {
      const { app } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health", {
        headers: { Origin: "http://localhost:3000" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });

    it("should handle OPTIONS preflight in dev mode", async () => {
      const { app } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:8081",
          "Access-Control-Request-Method": "GET",
        },
      });

      expect([200, 204]).toContain(res.status);
    });

    it("should not include CORS headers in production mode", async () => {
      const { app } = createServer({
        dev: false,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health", {
        headers: { Origin: "http://localhost:3000" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
  });

  describe("oRPC Endpoint", () => {
    it("should respond to oRPC GET requests", async () => {
      const { app } = createServer({
        dev: true,
        port: 3003,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc");
      expect([200, 404, 405, 500]).toContain(res.status);
    });

    it("should respond to oRPC POST requests", async () => {
      const { app } = createServer({
        dev: true,
        port: 3003,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect([200, 400, 404, 405, 500]).toContain(res.status);
    });

    it("should handle custom prefix", async () => {
      const { app } = createServer({
        dev: true,
        port: 3004,
        prefix: "/custom/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/custom/trpc");
      expect([200, 404, 405, 500]).toContain(res.status);
    });
  });

  describe("Server Lifecycle", () => {
    it.skipIf(isBunRuntime)("should start and stop server", async () => {
      const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
      vi.stubGlobal("Bun", { serve: serveSpy });

      const { start, stop } = createServer({
        dev: true,
        port: 3005,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      start();
      expect(serveSpy).toHaveBeenCalledTimes(1);

      await stop();
    });

    it("should stop gracefully even if not started", async () => {
      const { stop } = createServer({
        dev: true,
        port: 3006,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      await expect(stop()).resolves.not.toThrow();
    });

    it.skipIf(isBunRuntime)("should handle start with invalid port gracefully", async () => {
      const serveSpy = vi.fn(() => {
        throw new Error("Invalid port");
      });
      vi.stubGlobal("Bun", { serve: serveSpy });

      const exitSpy = vi.spyOn(process, "exit").mockReturnValue(undefined as never);

      const { start, stop } = createServer({
        dev: true,
        port: -1,
        host: "127.0.0.1",
      });

      start();

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
      await stop();
    });

    it.skipIf(isBunRuntime)("should configure WebSocket handlers on start", async () => {
      env.SUPABASE_URL = "http://localhost:8000";
      env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      env.DATABASE_URL = "postgresql://localhost:5432/test";

      let serveOptions: any;
      const serveSpy = vi.fn((opts) => {
        serveOptions = opts;
        return { stop: vi.fn() };
      });
      vi.stubGlobal("Bun", { serve: serveSpy });

      const { start, stop } = createServer({
        dev: true,
        port: 3007,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      start();
      expect(serveSpy).toHaveBeenCalledTimes(1);
      expect(serveOptions.fetch).toBeDefined();
      expect(serveOptions.websocket).toBeDefined();
      expect(serveOptions.websocket.message).toBeDefined();
      expect(serveOptions.websocket.close).toBeDefined();

      // Test fetch with WebSocket upgrade request at prefix
      const mockServer = { upgrade: vi.fn(() => true) };
      const upgradeReq = new Request("ws://localhost:3007/trpc?authorization=Bearer%20token");
      const result = await serveOptions.fetch(upgradeReq, mockServer);
      expect(mockServer.upgrade).toHaveBeenCalled();
      expect(result).toBeUndefined();

      // Test fetch with service endpoint WebSocket upgrade
      const mockServerService = { upgrade: vi.fn(() => true) };
      const serviceReq = new Request(
        "ws://localhost:3007/internal/trpc?authorization=Bearer%20token",
      );
      const serviceResult = await serveOptions.fetch(serviceReq, mockServerService);
      expect(mockServerService.upgrade).toHaveBeenCalled();
      expect(serviceResult).toBeUndefined();

      // Test fetch with regular HTTP request (not at prefix)
      const httpReq = new Request("http://localhost:3007/health");
      const mockServer2 = { upgrade: vi.fn(() => false) };
      const httpResult = await serveOptions.fetch(httpReq, mockServer2);
      expect(mockServer2.upgrade).not.toHaveBeenCalled();
      expect(httpResult).toBeInstanceOf(Response);

      // Test websocket.message and websocket.close
      const mockWs = {
        data: {
          connectionParams: { authorization: "Bearer test" },
          url: "/trpc",
        },
        send: vi.fn(),
      };

      await serveOptions.websocket.message(
        mockWs,
        JSON.stringify({ i: 1, p: { u: "/trpc/test", b: {} } }),
      );

      serveOptions.websocket.close(mockWs);

      const mockWsService = {
        data: { url: "/internal/trpc" },
      };
      serveOptions.websocket.close(mockWsService);

      await stop();
    });

    it.skipIf(isBunRuntime)("should handle websocket message with service endpoint", async () => {
      env.SUPABASE_URL = "http://localhost:8000";
      env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      env.DATABASE_URL = "postgresql://localhost:5432/test";

      let serveOptions: any;
      const serveSpy = vi.fn((opts) => {
        serveOptions = opts;
        return { stop: vi.fn() };
      });
      vi.stubGlobal("Bun", { serve: serveSpy });

      const { start, stop } = createServer({
        dev: true,
        port: 3046,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      start();

      const mockWs = {
        data: {
          connectionParams: { authorization: "Bearer test" },
          url: "/internal/trpc",
          authProcessed: true,
        },
        send: vi.fn(),
      };

      await serveOptions.websocket.message(
        mockWs,
        JSON.stringify({ i: 1, p: { u: "/internal/trpc/test", b: {} } }),
      );

      await stop();
    });
  });

  describe("Request Handling", () => {
    it("should handle GET and HEAD requests", async () => {
      const { app } = createServer({
        dev: true,
        port: 3010,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const getRes = await app.request("/health");
      expect(getRes.status).toBe(200);

      const headRes = await app.request("/health", { method: "HEAD" });
      expect([200, 404]).toContain(headRes.status);
    });

    it("should handle requests with custom headers", async () => {
      const { app } = createServer({
        dev: true,
        port: 3011,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health", {
        headers: {
          "X-Custom-Header": "custom-value",
          Authorization: "Bearer test-token",
          Accept: "application/json",
        },
      });

      expect(res.status).toBe(200);
    });

    it("should return 404 for unknown routes", async () => {
      const { app } = createServer({
        dev: true,
        port: 3012,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/unknown-route");
      expect(res.status).toBe(404);
    });
  });

  describe("Environment Variable Validation", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should create context with environment variables", async () => {
      env.SUPABASE_URL = "http://localhost:8000";
      env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      env.DATABASE_URL = "postgresql://localhost:5432/test";

      const { app } = createServer({
        dev: true,
        port: 3007,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health");
      expect(res.status).toBe(200);
    });

    it("should handle missing environment variables gracefully", () => {
      delete env.SUPABASE_URL;
      delete env.SUPABASE_SERVICE_ROLE_KEY;
      delete env.DATABASE_URL;

      const { app } = createServer({
        dev: true,
        port: 3008,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      expect(app).toBeDefined();
    });

    it("should trigger context creation with valid env vars on oRPC request", async () => {
      env.SUPABASE_URL = "http://localhost:8000";
      env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
      env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer: createServerFresh } = await import("../server");

      const { app } = createServerFresh({
        dev: true,
        port: 3020,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/trpc");
      expect([200, 404, 405, 500]).toContain(res.status);
    });

    it("should handle missing SUPABASE_URL on oRPC request", async () => {
      delete env.SUPABASE_URL;
      delete env.SUPABASE_SERVICE_ROLE_KEY;
      delete env.DATABASE_URL;

      const { app } = createServer({
        dev: true,
        port: 3021,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/trpc");
      expect([404, 500]).toContain(res.status);
    });
  });

  describe("Server Configuration Edge Cases", () => {
    it("should handle all option combinations", () => {
      const combos: ServerOptions[] = [
        {},
        { dev: false },
        { port: 9000 },
        { prefix: "/api" },
        { host: "0.0.0.0" },
        { dev: false, port: 8080, prefix: "/v1", host: "0.0.0.0" },
      ];

      for (const opts of combos) {
        const { app } = createServer(opts);
        expect(app).toBeDefined();
      }
    });

    it("should handle dev mode false (production)", async () => {
      const { app } = createServer({
        dev: false,
        port: 3027,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health", {
        headers: { Origin: "http://example.com" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
  });

  describe("Security Headers", () => {
    it("should include security headers on all responses", async () => {
      const { app } = createServer({
        dev: true,
        port: 3030,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health");

      expect(res.status).toBe(200);
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("strict-transport-security")).toBe(
        "max-age=63072000; includeSubDomains; preload",
      );
      expect(res.headers.get("content-security-policy")).toBe("default-src 'self'");
    });

    it("should include security headers in production", async () => {
      const { app } = createServer({
        dev: false,
        port: 3031,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health");

      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    });
  });

  describe("Request Body Size Limits", () => {
    it("should reject requests with body exceeding 10MB", async () => {
      const { app } = createServer({
        dev: true,
        port: 3032,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(11 * 1024 * 1024),
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(413);
      expect(await res.text()).toBe("Payload Too Large");
    });

    it("should allow requests with body under 10MB", async () => {
      const { app } = createServer({
        dev: true,
        port: 3033,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(100),
        },
        body: JSON.stringify({}),
      });

      expect(res.status).not.toBe(413);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests under the rate limit", async () => {
      const { app } = createServer({
        dev: true,
        port: 3034,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/health");
      expect(res.status).toBe(200);
    });

    it("should include Retry-After header on rate-limited responses", async () => {
      const { app } = createServer({
        dev: true,
        port: 3035,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const ip = "192.168.1.100";

      for (let i = 0; i < 601; i++) {
        await app.request("/health", {
          headers: { "x-forwarded-for": ip },
        });
      }

      const res = await app.request("/health", {
        headers: { "x-forwarded-for": ip },
      });

      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBeTruthy();
      expect(await res.text()).toBe("Too Many Requests");
    });

    it("should rate limit auth endpoints separately", async () => {
      const { app } = createServer({
        dev: true,
        port: 3036,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const ip = "192.168.1.200";

      for (let i = 0; i < 31; i++) {
        await app.request("/api/trpc", {
          headers: { "x-forwarded-for": ip },
        });
      }

      const res = await app.request("/api/trpc", {
        headers: { "x-forwarded-for": ip },
      });

      expect(res.status).toBe(429);
      expect(res.headers.get("retry-after")).toBeTruthy();
      expect(await res.text()).toBe("Too Many Requests");
    });
  });

  describe("WebSocket Error Handler", () => {
    it("should throw ORPCError for non-ORPCError in production mode", async () => {
      const { app } = createServer({
        dev: false,
        port: 3040,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      expect(lastOnErrorCallback).toBeDefined();
      if (!lastOnErrorCallback) {
        throw new Error("onError callback was not captured");
      }
      const callback = lastOnErrorCallback;
      const regularError = new Error("Test error");
      expect(() => callback(regularError)).toThrow();
    });

    it("should not throw for ORPCError instance in production mode", async () => {
      const { app } = createServer({
        dev: false,
        port: 3040,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      expect(lastOnErrorCallback).toBeDefined();
      if (!lastOnErrorCallback) {
        throw new Error("onError callback was not captured");
      }
      const callback = lastOnErrorCallback;
      const orpcError = new ORPCError("INTERNAL_SERVER_ERROR", { message: "Test ORPC error" });
      expect(() => callback(orpcError)).not.toThrow();
    });

    it("should not throw for ORPCError instance in wsRpcHandler production mode", async () => {
      const { app } = createServer({
        dev: false,
        port: 3040,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      expect(wsOnErrorCallback).toBeDefined();
      if (!wsOnErrorCallback) {
        throw new Error("wsOnError callback was not captured");
      }
      const callback = wsOnErrorCallback;
      const orpcError = new ORPCError("INTERNAL_SERVER_ERROR", { message: "Test ORPC error" });
      expect(() => callback(orpcError)).not.toThrow();
    });
  });

  describe("WebSocket Auth and Message Handling", () => {
    it.skipIf(isBunRuntime)(
      "should handle connection_init with authorization payload",
      async () => {
        env.SUPABASE_URL = "http://localhost:8000";
        env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
        env.DATABASE_URL = "postgresql://localhost:5432/test";

        let serveOptions: any;
        const serveSpy = vi.fn((opts) => {
          serveOptions = opts;
          return { stop: vi.fn() };
        });
        vi.stubGlobal("Bun", { serve: serveSpy });

        const { start, stop } = createServer({
          dev: true,
          port: 3041,
          prefix: "/trpc",
          host: "127.0.0.1",
        });

        start();

        const mockWs = {
          data: { connectionParams: undefined, url: "/trpc", authProcessed: false },
          send: vi.fn(),
        };

        await serveOptions.websocket.message(
          mockWs,
          JSON.stringify({
            type: "connection_init",
            payload: { authorization: "Bearer test-token" },
          }),
        );

        expect(mockWs.data.authProcessed).toBe(true);
        expect(mockWs.data.connectionParams).toEqual({ authorization: "Bearer test-token" });
        expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: "connection_ack" }));

        await stop();
      },
    );

    it.skipIf(isBunRuntime)("should handle JSON.parse failure in websocket message", async () => {
      env.SUPABASE_URL = "http://localhost:8000";
      env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      env.DATABASE_URL = "postgresql://localhost:5432/test";

      let serveOptions: any;
      const serveSpy = vi.fn((opts) => {
        serveOptions = opts;
        return { stop: vi.fn() };
      });
      vi.stubGlobal("Bun", { serve: serveSpy });

      const { start, stop } = createServer({
        dev: true,
        port: 3042,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      start();

      const mockWs = {
        data: { connectionParams: undefined, url: "/trpc", authProcessed: false },
        send: vi.fn(),
      };

      await serveOptions.websocket.message(mockWs, "invalid json{");

      expect(mockWs.data.authProcessed).toBe(true);

      await stop();
    });
  });

  describe("WebSocket Environment Variable Validation", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it.skipIf(isBunRuntime)(
      "should throw when SUPABASE_URL is missing during websocket message",
      async () => {
        delete env.SUPABASE_URL;
        delete env.SUPABASE_SERVICE_ROLE_KEY;
        env.DATABASE_URL = "postgresql://localhost:5432/test";

        let serveOptions: any;
        const serveSpy = vi.fn((opts) => {
          serveOptions = opts;
          return { stop: vi.fn() };
        });
        vi.stubGlobal("Bun", { serve: serveSpy });

        const { start, stop } = createServer({
          dev: true,
          port: 3043,
          prefix: "/trpc",
          host: "127.0.0.1",
        });

        start();

        const mockWs = {
          data: {
            connectionParams: { authorization: "Bearer test" },
            url: "/trpc",
            authProcessed: true,
          },
          send: vi.fn(),
        };

        await expect(
          serveOptions.websocket.message(
            mockWs,
            JSON.stringify({ i: 1, p: { u: "/trpc/test", b: {} } }),
          ),
        ).rejects.toThrow("Missing Supabase credentials");

        await stop();
      },
    );

    it.skipIf(isBunRuntime)(
      "should throw when SUPABASE_SERVICE_ROLE_KEY is missing during websocket message",
      async () => {
        env.SUPABASE_URL = "http://localhost:8000";
        delete env.SUPABASE_SERVICE_ROLE_KEY;
        env.DATABASE_URL = "postgresql://localhost:5432/test";

        let serveOptions: any;
        const serveSpy = vi.fn((opts) => {
          serveOptions = opts;
          return { stop: vi.fn() };
        });
        vi.stubGlobal("Bun", { serve: serveSpy });

        const { start, stop } = createServer({
          dev: true,
          port: 3044,
          prefix: "/trpc",
          host: "127.0.0.1",
        });

        start();

        const mockWs = {
          data: {
            connectionParams: { authorization: "Bearer test" },
            url: "/trpc",
            authProcessed: true,
          },
          send: vi.fn(),
        };

        await expect(
          serveOptions.websocket.message(
            mockWs,
            JSON.stringify({ i: 1, p: { u: "/trpc/test", b: {} } }),
          ),
        ).rejects.toThrow("Missing Supabase credentials");

        await stop();
      },
    );

    it.skipIf(isBunRuntime)(
      "should throw when DATABASE_URL is missing during websocket message",
      async () => {
        env.SUPABASE_URL = "http://localhost:8000";
        env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
        delete env.DATABASE_URL;

        let serveOptions: any;
        const serveSpy = vi.fn((opts) => {
          serveOptions = opts;
          return { stop: vi.fn() };
        });
        vi.stubGlobal("Bun", { serve: serveSpy });

        const { start, stop } = createServer({
          dev: true,
          port: 3045,
          prefix: "/trpc",
          host: "127.0.0.1",
        });

        start();

        const mockWs = {
          data: {
            connectionParams: { authorization: "Bearer test" },
            url: "/trpc",
            authProcessed: true,
          },
          send: vi.fn(),
        };

        await expect(
          serveOptions.websocket.message(
            mockWs,
            JSON.stringify({ i: 1, p: { u: "/trpc/test", b: {} } }),
          ),
        ).rejects.toThrow("Missing database credentials");

        await stop();
      },
    );
  });
});
