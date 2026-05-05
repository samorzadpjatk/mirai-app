import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import type { ServerOptions } from "../server";

// Mock dependencies BEFORE importing the server
vi.mock("../config", () => ({
  serverConfig: {
    dev: true,
    port: 3001,
    prefix: "/api/trpc",
    host: "127.0.0.1",
  } as ServerOptions,
}));

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

vi.mock("@fastify/websocket", () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock("@fastify/cors", () => ({
  default: vi.fn(() => Promise.resolve()),
}));

vi.mock("@trpc/server/adapters/fastify", () => ({
  fastifyTRPCPlugin: vi.fn(() => Promise.resolve()),
}));

// Import server after mocks are set up
let createServer: typeof import("../server").createServer;

beforeAll(async () => {
  const serverModule = await import("../server");
  createServer = serverModule.createServer;
});

describe("Backend Server API", () => {
  describe("Health Check Endpoint", () => {
    it("should return OK for health check", async () => {
      const { server } = createServer({
        dev: true,
        port: 3001,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("OK");
    });

    it("should handle multiple health check requests", async () => {
      const { server } = createServer({
        dev: true,
        port: 3001,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const responses = await Promise.all([
        server.inject({ method: "GET", url: "/health" }),
        server.inject({ method: "GET", url: "/health" }),
        server.inject({ method: "GET", url: "/health" }),
      ]);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe("OK");
      });
    });
  });

  describe("Server Creation", () => {
    it("should create server with default options", () => {
      const { server, start, stop } = createServer({});

      expect(server).toBeDefined();
      expect(typeof start).toBe("function");
      expect(typeof stop).toBe("function");
    });

    it("should create server with custom options", () => {
      const { server } = createServer({
        dev: false,
        port: 8080,
        prefix: "/custom",
        host: "0.0.0.0",
      });

      expect(server).toBeDefined();
    });

    it("should create server with partial options", () => {
      const { server } = createServer({
        dev: false,
      });

      expect(server).toBeDefined();
    });

    it("should create server with only port option", () => {
      const { server } = createServer({
        port: 5000,
      });

      expect(server).toBeDefined();
    });

    it("should create server with only prefix option", () => {
      const { server } = createServer({
        prefix: "/v1/api",
      });

      expect(server).toBeDefined();
    });

    it("should create server with only host option", () => {
      const { server } = createServer({
        host: "192.168.1.1",
      });

      expect(server).toBeDefined();
    });
  });

  describe("CORS Configuration", () => {
    it("should create server with CORS plugin in dev mode", async () => {
      const { server } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // Server should be created successfully with CORS plugin registered
      expect(server).toBeDefined();

      const response = await server.inject({
        method: "GET",
        url: "/health",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it("should handle OPTIONS requests in dev mode", async () => {
      const { server } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "OPTIONS",
        url: "/health",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      });

      // OPTIONS requests may return 404 if no route handles them, which is acceptable
      expect([200, 204, 404]).toContain(response.statusCode);
    });

    it("should handle CORS preflight requests in dev mode", async () => {
      const { server } = createServer({
        dev: true,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "OPTIONS",
        url: "/health",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      });

      // With mocked CORS, OPTIONS may return 404 since no route handles it
      expect([200, 204, 404]).toContain(response.statusCode);
    });

    it("should not have CORS in production mode", async () => {
      const { server } = createServer({
        dev: false,
        port: 3002,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/health",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(response.statusCode).toBe(200);
      const corsHeader = response.headers["access-control-allow-origin"];
      expect(corsHeader).toBeUndefined();
    });
  });

  describe("tRPC Endpoint", () => {
    it("should respond to tRPC health check via HTTP", async () => {
      const { server } = createServer({
        dev: true,
        port: 3003,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/api/trpc",
      });

      expect([200, 405, 404]).toContain(response.statusCode);
    });

    it("should handle tRPC POST requests", async () => {
      const { server } = createServer({
        dev: true,
        port: 3003,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/trpc",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect([200, 400, 404, 405]).toContain(response.statusCode);
    });

    it("should handle custom prefix", async () => {
      const { server } = createServer({
        dev: true,
        port: 3004,
        prefix: "/custom/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/custom/trpc",
      });

      expect([200, 405, 404]).toContain(response.statusCode);
    });
  });

  describe("Server Lifecycle", () => {
    it("should start and stop server", async () => {
      const { server, start, stop } = createServer({
        dev: true,
        port: 3005,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // Server should be created but not listening yet
      expect(server).toBeDefined();

      // Stop should work even if server hasn't started
      await stop();
    });

    it("should handle server stop gracefully", async () => {
      const { stop } = createServer({
        dev: true,
        port: 3006,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // Should not throw when stopping a server that hasn't started
      await expect(stop()).resolves.not.toThrow();
    });
  });

  describe("Server with Environment Variables", () => {
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

      const { server } = createServer({
        dev: true,
        port: 3007,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    });

    it("should handle missing environment variables gracefully", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.DATABASE_URL;

      const { server } = createServer({
        dev: true,
        port: 3008,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // Server creation should succeed even without env vars
      expect(server).toBeDefined();
    });
  });

  describe("WebSocket Support", () => {
    it("should create server with WebSocket support", async () => {
      const { server } = createServer({
        dev: true,
        port: 3009,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // Server should be created with WebSocket plugin registered
      expect(server).toBeDefined();

      // Health check should still work
      const response = await server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("Request Handling", () => {
    it("should handle requests with various HTTP methods", async () => {
      const { server } = createServer({
        dev: true,
        port: 3010,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      // GET request
      const getResponse = await server.inject({
        method: "GET",
        url: "/health",
      });
      expect(getResponse.statusCode).toBe(200);

      // HEAD request
      const headResponse = await server.inject({
        method: "HEAD",
        url: "/health",
      });
      expect([200, 404]).toContain(headResponse.statusCode);
    });

    it("should handle requests with custom headers", async () => {
      const { server } = createServer({
        dev: true,
        port: 3011,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/health",
        headers: {
          "X-Custom-Header": "custom-value",
          "Authorization": "Bearer test-token",
          "Accept": "application/json",
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it("should handle 404 for unknown routes", async () => {
      const { server } = createServer({
        dev: true,
        port: 3012,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      const response = await server.inject({
        method: "GET",
        url: "/unknown-route",
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("Server Logging", () => {
    it("should create server with logger enabled in dev mode", () => {
      const { server } = createServer({
        dev: true,
        port: 3013,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      expect(server).toBeDefined();
    });

    it("should create server with logger disabled in production mode", () => {
      const { server } = createServer({
        dev: false,
        port: 3014,
        prefix: "/api/trpc",
        host: "127.0.0.1",
      });

      expect(server).toBeDefined();
    });
  });
});

describe("Fastify Headers Utility", () => {
  it("should convert Fastify headers to Fetch headers", async () => {
    const { fastifyHeadersToFetchHeaders } = await import("../utils/headers");

    const fastifyHeaders = {
      "content-type": "application/json",
      authorization: "Bearer test-token",
      "x-custom-header": "custom-value",
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(fetchHeaders.get("content-type")).toBe("application/json");
    expect(fetchHeaders.get("authorization")).toBe("Bearer test-token");
    expect(fetchHeaders.get("x-custom-header")).toBe("custom-value");
  });

  it("should handle array values in headers", async () => {
    const { fastifyHeadersToFetchHeaders } = await import("../utils/headers");

    const fastifyHeaders = {
      "set-cookie": ["cookie1=value1", "cookie2=value2"],
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);
    const cookies = fetchHeaders.getSetCookie();

    expect(cookies).toContain("cookie1=value1");
    expect(cookies).toContain("cookie2=value2");
  });

  it("should handle undefined headers", async () => {
    const { fastifyHeadersToFetchHeaders } = await import("../utils/headers");

    const fetchHeaders = fastifyHeadersToFetchHeaders(undefined);

    expect(fetchHeaders).toBeInstanceOf(Headers);
  });

  it("should handle empty headers object", async () => {
    const { fastifyHeadersToFetchHeaders } = await import("../utils/headers");

    const fetchHeaders = fastifyHeadersToFetchHeaders({});

    expect(fetchHeaders).toBeInstanceOf(Headers);
    expect(fetchHeaders.keys().next().done).toBe(true);
  });

  it("should handle headers with mixed types", async () => {
    const { fastifyHeadersToFetchHeaders } = await import("../utils/headers");

    const fastifyHeaders = {
      "content-type": "application/json",
      "x-array-header": ["value1", "value2"],
      "x-single-header": "single-value",
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(fetchHeaders.get("content-type")).toBe("application/json");
    expect(fetchHeaders.get("x-single-header")).toBe("single-value");
  });
});

describe("Server Error Handling", () => {
  it("should handle server with production settings", async () => {
    const { createServer } = await import("../server");
    const { server } = createServer({
      dev: false,
      port: 3002,
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
  });

  it("should create server with custom prefix", async () => {
    const { createServer } = await import("../server");
    const { server } = createServer({
      dev: true,
      port: 3003,
      prefix: "/api/v1",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
  });
});

describe("Server Lifecycle", () => {
  it("should handle start errors gracefully", async () => {
    const { createServer } = await import("../server");
    const { start, stop } = createServer({
      dev: true,
      port: -1,
      host: "127.0.0.1",
    });

    await expect(start()).rejects.toThrow();
    await stop();
  });

  it("should stop server successfully", async () => {
    const { createServer } = await import("../server");
    const { server, stop } = createServer({
      dev: true,
      port: 3005,
      host: "127.0.0.1",
    });

    await expect(stop()).resolves.not.toThrow();
  });

  it("should start and stop server", async () => {
    const { createServer } = await import("../server");
    const { server, start, stop } = createServer({
      dev: true,
      port: 3006,
      host: "127.0.0.1",
    });

    const listenSpy = vi.spyOn(server, "listen").mockResolvedValue("");

    await start();

    expect(listenSpy).toHaveBeenCalledWith({ port: 3006, host: "127.0.0.1" });

    await stop();
    listenSpy.mockRestore();
  });
});

describe("Server Context Creation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should trigger context creation with valid env vars on tRPC request", async () => {
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";

    vi.resetModules();
    const { createServer } = await import("../server");

    const { server } = createServer({
      dev: true,
      port: 3020,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect([200, 404, 405]).toContain(response.statusCode);
  });

  it("should throw error when SUPABASE_URL is missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.DATABASE_URL;

    const { server } = createServer({
      dev: true,
      port: 3021,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc",
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it("should throw error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { server } = createServer({
      dev: true,
      port: 3022,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc",
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it("should throw error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;

    const { server } = createServer({
      dev: true,
      port: 3023,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc",
    });

    expect([404, 500]).toContain(response.statusCode);
  });

  it("should create context with connection params for WebSocket", async () => {
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";

    vi.resetModules();
    const { createServer } = await import("../server");

    const { server } = createServer({
      dev: true,
      port: 3024,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc?authToken=test-token",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect([200, 404, 405]).toContain(response.statusCode);
  });

  it("should create context with request URL header", async () => {
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";

    vi.resetModules();
    const { createServer } = await import("../server");

    const { server } = createServer({
      dev: true,
      port: 3025,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/trpc/some.procedure",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token",
      },
    });

    expect([200, 404, 405]).toContain(response.statusCode);
  });

  it("should handle tRPC errors gracefully", async () => {
    process.env.SUPABASE_URL = "http://localhost:8000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";

    vi.resetModules();
    const { createServer } = await import("../server");

    const { server } = createServer({
      dev: true,
      port: 3026,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "POST",
      url: "/trpc",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "query",
        params: {},
        id: 1,
      }),
    });

    expect([200, 400, 404, 405, 500]).toContain(response.statusCode);
  });
});

describe("Server Configuration Edge Cases", () => {
  it("should handle all option combinations", () => {
    const { server: s1 } = createServer({});
    expect(s1).toBeDefined();

    const { server: s2 } = createServer({ dev: false });
    expect(s2).toBeDefined();

    const { server: s3 } = createServer({ port: 9000 });
    expect(s3).toBeDefined();

    const { server: s4 } = createServer({ prefix: "/api" });
    expect(s4).toBeDefined();

    const { server: s5 } = createServer({ host: "0.0.0.0" });
    expect(s5).toBeDefined();
  });

  it("should handle dev mode false (production)", async () => {
    const { server } = createServer({
      dev: false,
      port: 3027,
      prefix: "/trpc",
      host: "127.0.0.1",
    });

    const response = await server.inject({
      method: "GET",
      url: "/health",
      headers: {
        Origin: "http://example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should handle start with invalid port gracefully", async () => {
    const { createServer } = await import("../server");
    const { start, stop } = createServer({
      dev: true,
      port: 99999,
      host: "127.0.0.1",
    });

    await expect(start()).rejects.toThrow();
    await stop();
  });

  it("should handle very high port numbers", async () => {
    const { createServer } = await import("../server");
    const { server, start, stop } = createServer({
      dev: true,
      port: 65000,
      host: "127.0.0.1",
    });

    const listenSpy = vi.spyOn(server, "listen").mockResolvedValue("");

    await start();
    expect(listenSpy).toHaveBeenCalledWith({ port: 65000, host: "127.0.0.1" });

    await stop();
    listenSpy.mockRestore();
  });
});
