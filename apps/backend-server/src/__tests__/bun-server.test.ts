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

    const mockApp = { fetch: vi.fn(() => new Response("OK")) };
    const mockWsHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };
    const mockServiceHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };

    const { start, stop } = createBunServer({
      port: 3005,
      hostname: "127.0.0.1",
      prefix: "/api/trpc",
      servicePrefix: "/internal/trpc",
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
      prefix: "/api/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
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
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn(() => new Response("OK")) },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockServer = { upgrade: vi.fn(() => true) };
    const upgradeReq = new Request("ws://localhost:3007/trpc");
    const result = await serveOptions.fetch(upgradeReq, mockServer);
    expect(mockServer.upgrade).toHaveBeenCalledWith(upgradeReq, {
      data: { url: "ws://localhost:3007/trpc" },
    });
    expect(result).toBeUndefined();
  });

  it("should handle WebSocket upgrade at service endpoint", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3007,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn(() => new Response("OK")) },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockServer = { upgrade: vi.fn(() => true) };
    const serviceReq = new Request("ws://localhost:3007/internal/trpc");
    const result = await serveOptions.fetch(serviceReq, mockServer);
    expect(mockServer.upgrade).toHaveBeenCalledWith(serviceReq, {
      data: { url: "ws://localhost:3007/internal/trpc" },
    });
    expect(result).toBeUndefined();
  });

  it("should fallback to HTTP when WebSocket upgrade fails", async () => {
    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const { start } = createBunServer({
      port: 3007,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn(() => new Response("OK")) },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
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
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { connectionParams: undefined, url: "/trpc", authProcessed: false },
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

    const mockWsHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };
    const mockServiceHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };

    const { start } = createBunServer({
      port: 3042,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: {
        connectionParams: { authorization: "Bearer test" },
        url: "/trpc",
        authProcessed: true,
      },
      send: vi.fn(),
    };

    await serveOptions.websocket.message(
      mockWs,
      JSON.stringify({ i: 1, p: { u: "/trpc/test", b: {} } }),
    );

    expect(mockWsHandler.message).toHaveBeenCalled();
  });

  it("should handle websocket message with service endpoint", async () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };
    const mockServiceHandler = { message: vi.fn().mockResolvedValue(undefined), close: vi.fn() };

    const { start } = createBunServer({
      port: 3046,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

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

    expect(mockServiceHandler.message).toHaveBeenCalled();
  });

  it("should handle websocket close for service endpoint", () => {
    vi.stubEnv("SUPABASE_URL", "http://localhost:8000");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");

    const serveSpy = vi.fn(() => ({ stop: vi.fn() }));
    mockBunServe(serveSpy);

    const mockWsHandler = { message: vi.fn(), close: vi.fn() };
    const mockServiceHandler = { message: vi.fn(), close: vi.fn() };

    const { start } = createBunServer({
      port: 3047,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { url: "/internal/trpc" },
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

    const mockWsHandler = { message: vi.fn(), close: vi.fn() };
    const mockServiceHandler = { message: vi.fn(), close: vi.fn() };

    const { start } = createBunServer({
      port: 3048,
      hostname: "127.0.0.1",
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: mockWsHandler,
      serviceWsRpcHandler: mockServiceHandler,
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

    const mockWs = {
      data: { url: "/trpc" },
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
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

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
      prefix: "/trpc",
      servicePrefix: "/internal/trpc",
      app: { fetch: vi.fn() },
      wsRpcHandler: { message: vi.fn(), close: vi.fn() },
      serviceWsRpcHandler: { message: vi.fn(), close: vi.fn() },
    });

    start();
    const serveOptions = getServeOptions(serveSpy);

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
  });
});
