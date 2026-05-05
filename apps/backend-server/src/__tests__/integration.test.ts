import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import type { ServerOptions } from "../server";
import type { FastifyRequest } from "fastify";

describe("Server Integration Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Environment Variable Validation in Context", () => {
    it("should handle missing SUPABASE_URL", async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3100,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/trpc",
      });

      expect([404, 500]).toContain(response.statusCode);
    });

    it("should handle missing SUPABASE_SERVICE_ROLE_KEY", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3101,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/trpc",
      });

      expect([404, 500]).toContain(response.statusCode);
    });

    it("should handle missing DATABASE_URL", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      delete process.env.DATABASE_URL;

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3102,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/trpc",
      });

      expect([404, 500]).toContain(response.statusCode);
    });

    it("should work with all environment variables set", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3103,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Server with various configurations", () => {
    it("should create server with dev mode enabled", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server, start, stop } = createServer({
        dev: true,
        port: 3104,
        prefix: "/api",
        host: "127.0.0.1",
      });

      expect(server).toBeDefined();
      expect(typeof start).toBe("function");
      expect(typeof stop).toBe("function");

      const listenSpy = vi.spyOn(server, "listen").mockResolvedValue("");
      await start();
      expect(listenSpy).toHaveBeenCalledWith({ port: 3104, host: "127.0.0.1" });
      await stop();
      listenSpy.mockRestore();
    });

    it("should create server with dev mode disabled", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: false,
        port: 3105,
        prefix: "/api/v1",
        host: "0.0.0.0",
      });

      expect(server).toBeDefined();

      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Context creation with headers", () => {
    it("should create context with custom headers", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3106,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/trpc/test.procedure",
        headers: {
          Authorization: "Bearer test-token",
          "X-Custom-Header": "custom-value",
          "Content-Type": "application/json",
        },
      });

      expect([200, 404, 405]).toContain(response.statusCode);
    });

    it("should create context with query parameters", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server } = createServer({
        dev: true,
        port: 3107,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/trpc?authToken=websocket-token&userId=123",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect([200, 404, 405]).toContain(response.statusCode);
    });
  });

  describe("Server lifecycle with real modules", () => {
    it("should handle server start and stop", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server, start, stop } = createServer({
        dev: true,
        port: 3108,
        prefix: "/trpc",
        host: "127.0.0.1",
      });

      const listenSpy = vi.spyOn(server, "listen").mockResolvedValue("");

      await start();
      expect(listenSpy).toHaveBeenCalledTimes(1);

      await stop();
      listenSpy.mockRestore();
    });

    it("should handle server errors during start", async () => {
      process.env.SUPABASE_URL = "http://localhost:8000";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";

      vi.resetModules();
      const { createServer } = await import("../server");

      const { server, start, stop } = createServer({
        dev: true,
        port: -1,
        host: "127.0.0.1",
      });

      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      await expect(start()).rejects.toThrow();

      exitSpy.mockRestore();
      await stop();
    });
  });
});
