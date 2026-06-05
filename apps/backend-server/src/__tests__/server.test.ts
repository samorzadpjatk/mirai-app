import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as ServerModule from "../server";

vi.mock("@mirai-app/orpc", () => ({
  appRouter: {},
  serviceRouter: {},
  createORPCContext: vi.fn((opts) => opts),
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
  onError: (fn: any) => async (ctx: any) => {
    try {
      return await ctx.next();
    } catch (error) {
      await fn(error, ctx);
      throw error;
    }
  },
}));

vi.mock("@orpc/server/bun-ws", () => ({
  RPCHandler: class MockRPCHandler {
    message = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockImplementation(() => {});
  },
}));

vi.mock("./bun-server", () => ({
  createBunServer: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

let createServer: typeof ServerModule.createServer;

beforeEach(async () => {
  vi.resetModules();
  const serverModule = await import("../server");
  createServer = serverModule.createServer;
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("createServer", () => {
  it("should create server with default options", () => {
    const { app, start, stop } = createServer({});
    expect(app).toBeDefined();
    expect(typeof start).toBe("function");
    expect(typeof stop).toBe("function");
  });

  it("should create server with custom options", () => {
    const { app } = createServer({ dev: false, port: 8080, prefix: "/custom", host: "0.0.0.0" });
    expect(app).toBeDefined();
  });

  it("should return OK for health check", async () => {
    const { app } = createServer({ dev: true, port: 3001, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("should include security headers", async () => {
    const { app } = createServer({ dev: true, port: 3002, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(res.headers.get("content-security-policy")).toBe("default-src 'self'");
  });

  it("should include CORS headers in dev mode", async () => {
    const { app } = createServer({ dev: true, port: 3003, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:8081" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
  });

  it("should reject disallowed origins in dev mode", async () => {
    const { app } = createServer({ dev: true, port: 3004, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:3000" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("should not include CORS in production mode", async () => {
    const { app } = createServer({
      dev: false,
      port: 3005,
      prefix: "/api/trpc",
      host: "127.0.0.1",
    });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:3000" } });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("should handle OPTIONS preflight", async () => {
    const { app } = createServer({ dev: true, port: 3006, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/api/trpc", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:8081", "Access-Control-Request-Method": "GET" },
    });
    expect([200, 204]).toContain(res.status);
  });

  it("should return 404 for unknown routes", async () => {
    const { app } = createServer({ dev: true, port: 3007, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/unknown-route");
    expect(res.status).toBe(404);
  });

  it("should reject payloads over 10MB", async () => {
    const { app } = createServer({ dev: true, port: 3008, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/api/trpc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(11 * 1024 * 1024) },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(413);
    expect(await res.text()).toBe("Payload Too Large");
  });

  it("should allow payloads under 10MB", async () => {
    const { app } = createServer({ dev: true, port: 3009, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/api/trpc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "100" },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(413);
  });

  it("should rate limit after too many requests", async () => {
    const { app } = createServer({ dev: true, port: 3010, prefix: "/api/trpc", host: "127.0.0.1" });
    const ip = "192.168.1.100";

    for (let i = 0; i < 601; i++) {
      await app.request("/health", { headers: { "x-forwarded-for": ip } });
    }

    const res = await app.request("/health", { headers: { "x-forwarded-for": ip } });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
    expect(await res.text()).toBe("Too Many Requests");
  });

  it("should rate limit auth endpoints separately", async () => {
    const { app } = createServer({ dev: true, port: 3011, prefix: "/api/trpc", host: "127.0.0.1" });
    const ip = "192.168.1.200";

    for (let i = 0; i < 31; i++) {
      await app.request("/api/trpc", { headers: { "x-forwarded-for": ip } });
    }

    const res = await app.request("/api/trpc", { headers: { "x-forwarded-for": ip } });
    expect(res.status).toBe(429);
    expect(await res.text()).toBe("Too Many Requests");
  });

  it("should respond to oRPC endpoint", async () => {
    const { app } = createServer({ dev: true, port: 3012, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/api/trpc");
    expect([200, 404, 405, 500]).toContain(res.status);
  });

  it("should handle custom prefix", async () => {
    const { app } = createServer({
      dev: true,
      port: 3013,
      prefix: "/custom/trpc",
      host: "127.0.0.1",
    });
    const res = await app.request("/custom/trpc");
    expect([200, 404, 405, 500]).toContain(res.status);
  });

  it("should handle requests with custom headers", async () => {
    const { app } = createServer({ dev: true, port: 3014, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health", {
      headers: {
        "X-Custom-Header": "custom-value",
        Authorization: "Bearer test-token",
        Accept: "application/json",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should handle HEAD requests", async () => {
    const { app } = createServer({ dev: true, port: 3015, prefix: "/api/trpc", host: "127.0.0.1" });
    const res = await app.request("/health", { method: "HEAD" });
    expect([200, 404]).toContain(res.status);
  });

  it("should stop gracefully even if not started", async () => {
    const { stop } = createServer({
      dev: true,
      port: 3016,
      prefix: "/api/trpc",
      host: "127.0.0.1",
    });
    await expect(stop()).resolves.not.toThrow();
  });
});
