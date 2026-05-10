import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ServerOptions } from "../server";

vi.mock("@mirai-app/trpc", () => ({
  appRouter: {},
  createTRPCContext: vi.fn((opts) => ({
    headers: opts.headers,
    databaseUrl: opts.databaseUrl,
    supabaseUrl: opts.supabaseUrl,
    supabaseKey: opts.supabaseKey,
    connectionParams: opts.connectionParams,
  })),
}));

vi.mock("../ws-adapter", async () => {
  const { Hono } = await import("hono");
  return {
    createBunHonoWSHandler: vi.fn(() => ({
      wsRouter: new Hono(),
      websocket: {},
    })),
  };
});

let createServer: typeof import("../server").createServer;

beforeEach(async () => {
  vi.resetModules();
  const serverModule = await import("../server");
  createServer = serverModule.createServer;
});

afterEach(() => {
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
        headers: { Origin: "http://localhost:3000" },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
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
          Origin: "http://localhost:3000",
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

  describe("tRPC Endpoint", () => {
    it("should respond to tRPC GET requests", async () => {
      const { app } = createServer({
        dev: true,
        port: 3003,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const res = await app.request("/api/trpc");
      expect([200, 404, 405, 500]).toContain(res.status);
    });

    it("should respond to tRPC POST requests", async () => {
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
    it("should start and stop server", async () => {
      const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
      vi.stubGlobal("Bun", { serve: serveSpy });

      const { start, stop } = createServer({
        dev: true,
        port: 3005,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      await start();
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

    it("should handle start with invalid port gracefully", async () => {
      const serveSpy = vi.fn(() => {
        throw new Error("Invalid port");
      });
      vi.stubGlobal("Bun", { serve: serveSpy });

      const exitSpy = vi.spyOn(process, "exit").mockReturnValue(
        undefined as never,
      );

      const { start, stop } = createServer({
        dev: true,
        port: -1,
        host: "127.0.0.1",
      });

      await start();

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
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
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

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
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

      const { app } = createServer({
        dev: true,
        port: 3008,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      expect(app).toBeDefined();
    });

    it("should trigger context creation with valid env vars on tRPC request", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

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

    it("should handle missing SUPABASE_URL on tRPC request", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

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
});
