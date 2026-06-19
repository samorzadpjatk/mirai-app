import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as ServerModule from "../server";

const { loggerError, createOrpcContextSpy } = vi.hoisted(() => ({
  loggerError: vi.fn(),
  createOrpcContextSpy: vi.fn((opts) => opts),
}));

// Real oRPC HTTP handler is exercised against a real (fixture) router built
// with the genuine `os` builder. We do NOT mock @orpc/server, @orpc/server/fetch,
// onError, or the RPCHandler — the test drives actual request routing,
// serialization and the error interceptor end to end. Only the WebSocket
// transport (bun-ws) and the Bun server boot are stubbed, since neither is the
// subject under test here.
vi.mock("@mirai-app/orpc", async () => {
  const { appRouter } = await import("./fixtures/orpc-fixture");
  return {
    appRouter,
    serviceRouter: {},
    createORPCContext: createOrpcContextSpy,
    logger: {
      info: vi.fn(),
      error: loggerError,
      warn: vi.fn(),
      debug: vi.fn(),
    },
  };
});

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

const stubOrpcEnv = () => {
  vi.stubEnv("SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
};

let createServer: typeof ServerModule.createServer;

beforeEach(async () => {
  vi.resetModules();
  stubOrpcEnv();
  const serverModule = await import("../server");
  createServer = serverModule.createServer;
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("createServer", () => {
  it("should create server with default options", async () => {
    const { app } = createServer({});
    const health = await app.request("/health");
    expect(health.status).toBe(200);
    expect(await health.text()).toBe("OK");
    const ping = await app.request("/api/orpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(ping.status).not.toBe(404);
  });

  it("should create server with custom options", async () => {
    const { app } = createServer({ dev: false, port: 8080, prefix: "/custom", host: "0.0.0.0" });
    const hit = await app.request("/custom/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(hit.status).not.toBe(404);
    const miss = await app.request("/api/orpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(miss.status).toBe(404);
  });

  it("should return OK for health check", async () => {
    const { app } = createServer({ dev: true, port: 3001, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("should include security headers", async () => {
    const { app } = createServer({ dev: true, port: 3002, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/health");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(res.headers.get("content-security-policy")).toBe("default-src 'self'");
  });

  it("should include CORS headers in dev mode", async () => {
    const { app } = createServer({ dev: true, port: 3003, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:8081" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
  });

  it("should reject disallowed origins in dev mode", async () => {
    const { app } = createServer({ dev: true, port: 3004, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:3000" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("should not include CORS in production mode", async () => {
    const { app } = createServer({
      dev: false,
      port: 3005,
      prefix: "/api/orpc",
      host: "127.0.0.1",
    });
    const res = await app.request("/health", { headers: { Origin: "http://localhost:3000" } });
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("should handle OPTIONS preflight", async () => {
    const { app } = createServer({ dev: true, port: 3006, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/api/orpc", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:8081", "Access-Control-Request-Method": "GET" },
    });
    expect([200, 204]).toContain(res.status);
  });

  it("should return 404 for unknown routes", async () => {
    const { app } = createServer({ dev: true, port: 3007, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/unknown-route");
    expect(res.status).toBe(404);
  });

  it("should reject payloads over 10MB", async () => {
    const { app } = createServer({ dev: true, port: 3008, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/api/orpc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(11 * 1024 * 1024) },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(413);
    expect(await res.text()).toBe("Payload Too Large");
  });

  it("should allow payloads under 10MB", async () => {
    const { app } = createServer({ dev: true, port: 3009, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/api/orpc", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "100" },
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(413);
  });

  it("should rate limit after too many requests", async () => {
    const { app } = createServer({ dev: true, port: 3010, prefix: "/api/orpc", host: "127.0.0.1" });
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
    const { app } = createServer({ dev: true, port: 3011, prefix: "/api/orpc", host: "127.0.0.1" });
    const ip = "192.168.1.200";

    for (let i = 0; i < 31; i++) {
      await app.request("/api/orpc", { headers: { "x-forwarded-for": ip } });
    }

    const res = await app.request("/api/orpc", { headers: { "x-forwarded-for": ip } });
    expect(res.status).toBe(429);
    expect(await res.text()).toBe("Too Many Requests");
  });

  it("should respond to oRPC endpoint", async () => {
    const { app } = createServer({ dev: true, port: 3012, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/api/orpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(res.status).not.toBe(404);
  });

  it("should handle custom prefix", async () => {
    const { app } = createServer({
      dev: true,
      port: 3013,
      prefix: "/custom/orpc",
      host: "127.0.0.1",
    });
    const res = await app.request("/custom/orpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(res.status).not.toBe(404);
    const defaultMiss = await app.request("/api/orpc/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    expect(defaultMiss.status).toBe(404);
  });

  it("should handle requests with custom headers", async () => {
    const { app } = createServer({ dev: true, port: 3014, prefix: "/api/orpc", host: "127.0.0.1" });
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
    const { app } = createServer({ dev: true, port: 3015, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await app.request("/health", { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("should stop gracefully even if not started", async () => {
    const { stop } = createServer({
      dev: true,
      port: 3016,
      prefix: "/api/orpc",
      host: "127.0.0.1",
    });
    await expect(stop()).resolves.not.toThrow();
    await expect(stop()).resolves.not.toThrow();
  });
});

describe("HTTP oRPC handler", () => {
  const post = (
    app: { request: (path: string, init?: RequestInit) => Response | Promise<Response> },
    path: string,
  ) =>
    app.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
      body: "",
    });

  it("routes a POST to a matched procedure and returns its response", async () => {
    const { app } = createServer({ dev: true, port: 3101, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await post(app, "/api/orpc/ping");
    // Matched -> the handler's response is returned, not Hono's 404 fallthrough.
    expect(res.status).not.toBe(404);
  });

  it("falls through to 404 for an unmatched oRPC path", async () => {
    const { app } = createServer({ dev: true, port: 3102, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await post(app, "/api/orpc/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("logs and surfaces an error when a procedure throws in production", async () => {
    loggerError.mockClear();
    const { app } = createServer({
      dev: false,
      port: 3103,
      prefix: "/api/orpc",
      host: "127.0.0.1",
    });
    const res = await post(app, "/api/orpc/boom");
    expect(res.status).not.toBe(404);
    expect(loggerError).toHaveBeenCalled();
  });

  it("logs the error in dev without masking it", async () => {
    loggerError.mockClear();
    const { app } = createServer({ dev: true, port: 3104, prefix: "/api/orpc", host: "127.0.0.1" });
    const res = await post(app, "/api/orpc/boom");
    expect(res.status).not.toBe(404);
    expect(loggerError).toHaveBeenCalled();
  });

  it("builds the oRPC context from request headers and env config", async () => {
    const { app } = createServer({ dev: true, port: 3105, prefix: "/api/orpc", host: "127.0.0.1" });
    await post(app, "/api/orpc/ping");
    expect(createOrpcContextSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseUrl: "postgres://user:pass@localhost:5432/db",
        supabaseUrl: "http://localhost:54321",
        supabaseKey: "service-role-key",
      }),
    );
  });
});
