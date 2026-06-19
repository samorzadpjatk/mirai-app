import type { Context } from "@orpc/server";
import type { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import type { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as BunServerModule from "../bun-server";

vi.mock("@mirai-app/orpc", () => ({
  createORPCContext: vi.fn((opts) => opts),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("./utils", () => ({
  getWsEnvConfig: vi.fn(() => ({
    supabaseUrl: "http://localhost:8000",
    supabaseKey: "test-key",
    databaseUrl: "postgresql://localhost:5432/test",
  })),
  parseWsAuthMessage: vi.fn((message, data) => {
    if (typeof message === "string" && message.includes("connection_init")) {
      return {
        connectionParams: { authorization: "Bearer test" },
        authProcessed: true,
        ackSent: true,
      };
    }
    return {
      connectionParams: data.connectionParams,
      authProcessed: true,
      ackSent: false,
    };
  }),
}));

let createBunServer: typeof BunServerModule.createBunServer;
const originalServe = Bun.serve;

beforeEach(async () => {
  vi.resetModules();
  const bunServerModule = await import("../bun-server");
  createBunServer = bunServerModule.createBunServer;
});

afterEach(async () => {
  Bun.serve = originalServe;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// Helper to create a properly typed mock for Bun.serve
function mockBunServe(serveSpy: ReturnType<typeof vi.fn>) {
  // @ts-expect-error - mocking Bun.serve for testing
  Bun.serve = serveSpy;
}

function mockHono() {
  return { fetch: vi.fn() } as unknown as Hono;
}

function mockWsHandler() {
  return { message: vi.fn(), close: vi.fn() } as unknown as BunWsRPCHandler<Context>;
}

function getServeOptions(serveSpy: ReturnType<typeof vi.fn>) {
  return serveSpy.mock.calls[0]![0] as {
    fetch: (
      req: Request,
      server: { upgrade: ReturnType<typeof vi.fn> },
    ) => Promise<Response | undefined>;
    websocket: {
      message: (ws: Record<string, unknown>, message: string | Uint8Array) => Promise<void>;
      close: (ws: Record<string, unknown>) => void;
    };
  };
}

describe("createBunServer", () => {
  it("should start and stop server", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockApp = { fetch: vi.fn(() => new Response("OK")) } as unknown as Hono;
    const mockWsHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;
    const mockServiceHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;

    const { start, stop } = createBunServer({
      port: 3005,
      hostname: "127.0.0.1",
      prefix: "/api/orpc",
      servicePrefix: "/internal/orpc",
      app: mockApp,
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    expect(serveSpy).toHaveBeenCalledTimes(1);
    expect(serveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 3005,
        hostname: "127.0.0.1",
        fetch: expect.any(Function),
        websocket: expect.objectContaining({
          message: expect.any(Function),
          close: expect.any(Function),
        }),
      }),
    );

    await stop();
  });

  it("should handle server startup failure", async () => {
    const serveSpy = vi.fn(() => {
      throw new Error("Invalid port");
    });
    mockBunServe(serveSpy);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    const { start } = createBunServer({
      port: -1,
      hostname: "127.0.0.1",
      prefix: "/api/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("should handle WebSocket upgrade at prefix", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3007,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockServer = { upgrade: vi.fn(() => true) };
    const upgradeReq = new Request("ws://localhost:3007/orpc");
    const result = await serveOptions.fetch(upgradeReq, mockServer);
    expect(mockServer.upgrade).toHaveBeenCalledWith(upgradeReq, {
      data: { url: "ws://localhost:3007/orpc" },
    });
    expect(result).toBeUndefined();
  });

  it("should handle WebSocket upgrade at service endpoint", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3007,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockServer = { upgrade: vi.fn(() => true) };
    const serviceReq = new Request("ws://localhost:3007/internal/orpc");
    const result = await serveOptions.fetch(serviceReq, mockServer);
    expect(mockServer.upgrade).toHaveBeenCalledWith(serviceReq, {
      data: { url: "ws://localhost:3007/internal/orpc" },
    });
    expect(result).toBeUndefined();
  });

  it("should fallback to HTTP when WebSocket upgrade fails", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3007,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: { fetch: vi.fn(() => new Response("OK")) } as unknown as Hono,
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockServer = { upgrade: vi.fn(() => false) };
    const httpReq = new Request("http://localhost:3007/health");
    const result = await serveOptions.fetch(httpReq, mockServer);
    expect(mockServer.upgrade).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
  });

  it("should handle websocket message with connection_init", async () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3041,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { connectionParams: undefined, url: "/orpc", authProcessed: false },
      send: vi.fn(),
    };

    await serveOptions.websocket.message(
      mockWs,
      JSON.stringify({ type: "connection_init", payload: { authorization: "Bearer test-token" } }),
    );

    expect(mockWs.data.authProcessed).toBe(true);
    expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: "connection_ack" }));
  });

  it("should handle websocket message with regular RPC after auth", async () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;
    const mockServiceHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;

    const { start } = createBunServer({
      port: 3042,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: {
        connectionParams: { authorization: "Bearer test" },
        url: "/orpc",
        authProcessed: true,
      },
      send: vi.fn(),
    };

    await serveOptions.websocket.message(
      mockWs,
      JSON.stringify({ i: 1, p: { u: "/orpc/test", b: {} } }),
    );

    expect(mockWsHandler.message).toHaveBeenCalled();
  });

  it("should handle websocket message with service endpoint", async () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;
    const mockServiceHandler = {
      message: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;

    const { start } = createBunServer({
      port: 3046,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: {
        connectionParams: { authorization: "Bearer test" },
        url: "/internal/orpc",
        authProcessed: true,
      },
      send: vi.fn(),
    };

    await serveOptions.websocket.message(
      mockWs,
      JSON.stringify({ i: 1, p: { u: "/internal/orpc/test", b: {} } }),
    );

    expect(mockServiceHandler.message).toHaveBeenCalled();
  });

  it("should handle websocket close for service endpoint", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = {
      message: vi.fn(),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;
    const mockServiceHandler = {
      message: vi.fn(),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;

    const { start } = createBunServer({
      port: 3047,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { url: "/internal/orpc" },
    };

    serveOptions.websocket.close(mockWs);
    expect(mockServiceHandler.close).toHaveBeenCalledWith(mockWs);
  });

  it("should handle websocket close for regular endpoint", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = {
      message: vi.fn(),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;
    const mockServiceHandler = {
      message: vi.fn(),
      close: vi.fn(),
    } as unknown as BunWsRPCHandler<Context>;

    const { start } = createBunServer({
      port: 3048,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { url: "/orpc" },
    };

    serveOptions.websocket.close(mockWs);
    expect(mockWsHandler.close).toHaveBeenCalledWith(mockWs);
  });

  it("should handle missing env vars during websocket message", async () => {
    vi.stubEnv("SUPABASE_URL", undefined);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3043,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: {
        connectionParams: { authorization: "Bearer test" },
        url: "/orpc",
        authProcessed: true,
      },
      send: vi.fn(),
    };

    await expect(
      serveOptions.websocket.message(
        mockWs,
        JSON.stringify({ i: 1, p: { u: "/orpc/test", b: {} } }),
      ),
    ).rejects.toThrow("Missing Supabase credentials");
  });

  it("should handle missing DATABASE_URL during websocket message", async () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", undefined);

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3044,
      hostname: "127.0.0.1",
      prefix: "/orpc",
      servicePrefix: "/internal/orpc",
      app: mockHono(),
      wsRpcHandler: mockWsHandler(),
      serviceWsRpcHandler: mockWsHandler(),
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: {
        connectionParams: { authorization: "Bearer test" },
        url: "/orpc",
        authProcessed: true,
      },
      send: vi.fn(),
    };

    await expect(
      serveOptions.websocket.message(
        mockWs,
        JSON.stringify({ i: 1, p: { u: "/orpc/test", b: {} } }),
      ),
    ).rejects.toThrow("Missing database credentials");
  });
});
