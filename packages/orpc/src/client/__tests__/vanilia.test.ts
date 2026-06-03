import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { noop } from "@mirai-app/shared/test-utils";

// Set up console spy BEFORE importing the module under test
const consoleSpy = vi.spyOn(console, "log").mockImplementation(noop);

// Mock the @orpc/client module
vi.mock("@orpc/client", () => ({
  createORPCClient: vi.fn(() => ({})),
  ORPCError: class ORPCError extends Error {
    status: number;
    code: string;
    constructor(code: string, opts?: { message?: string; status?: number; cause?: unknown }) {
      super(opts?.message ?? code);
      this.code = code;
      this.status = opts?.status ?? 500;
    }
  },
}));

// Mock the @orpc/client/fetch module
vi.mock("@orpc/client/fetch", () => ({
  RPCLink: vi.fn(),
}));

// Mock the @orpc/client/websocket module
vi.mock("@orpc/client/websocket", () => ({
  RPCLink: vi.fn(),
}));

// Mock global WebSocket
const mockWebSocketInstances: { close: ReturnType<typeof vi.fn> }[] = [];
vi.stubGlobal(
  "WebSocket",
  vi.fn().mockImplementation(function () {
    const instance = { close: vi.fn().mockResolvedValue(undefined) };
    mockWebSocketInstances.push(instance);
    return instance;
  }),
);

// Import mocked modules for assertions
import { RPCLink as RPCLinkFetch } from "@orpc/client/fetch";
import { RPCLink as WSLink } from "@orpc/client/websocket";

// Now import the module under test
import { getORPCClient } from "../vanilia";

describe("getORPCClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
    mockWebSocketInstances.length = 0;
    RPCLinkFetch.mockImplementation(function () {
      return {};
    });
    WSLink.mockImplementation(function () {
      return {};
    });
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  it("should create a client with HTTP URL and WS URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const result = getORPCClient(httpUrl, wsUrl);

    expect(result).toHaveProperty("client");
    expect(result).toHaveProperty("cleanup");
    expect(typeof result.cleanup).toBe("function");
  });

  it("should create a client without authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const result = getORPCClient(httpUrl, wsUrl);

    expect(result.client).toBeDefined();
    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
  });

  it("should create a client with authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-auth-token-12345";

    const result = getORPCClient(httpUrl, wsUrl, token);

    expect(result.client).toBeDefined();
    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
  });

  it("should provide a cleanup function that closes WebSocket", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const { cleanup } = getORPCClient(httpUrl, wsUrl);

    expect(typeof cleanup).toBe("function");

    await cleanup();
    expect(mockWebSocketInstances[0]?.close).toHaveBeenCalled();
  });

  it("should handle different URL formats", () => {
    const testCases = [
      { http: "http://api.example.com", ws: "ws://api.example.com" },
      { http: "https://api.example.com/v1", ws: "wss://api.example.com/v1" },
      { http: "http://localhost:2022", ws: "ws://localhost:2022" },
    ];

    testCases.forEach(({ http, ws }) => {
      const result = getORPCClient(http, ws);
      expect(result.client).toBeDefined();
      expect(result.cleanup).toBeDefined();
    });
  });

  it("should handle long authorization tokens", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const longToken = "a".repeat(1000);

    const result = getORPCClient(httpUrl, wsUrl, longToken);

    expect(result.client).toBeDefined();
    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
  });

  it("should handle empty authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const emptyToken = "";

    const result = getORPCClient(httpUrl, wsUrl, emptyToken);

    expect(result.client).toBeDefined();
    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
  });

  it("should handle special characters in URLs", () => {
    const httpUrl = "http://localhost:3000/path?query=value";
    const wsUrl = "ws://localhost:3000/path";

    const result = getORPCClient(httpUrl, wsUrl);

    expect(result.client).toBeDefined();
    expect(result.cleanup).toBeDefined();
  });
});

describe("WebSocket Client Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();
    mockWebSocketInstances.length = 0;
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  it("should create WebSocket without auth in URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "Bearer token123";

    getORPCClient(httpUrl, wsUrl, token);

    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
    const wsUrlArg = (WebSocket as any).mock.calls[0]?.[0] as string;
    expect(wsUrlArg).not.toContain("authorization=");
  });

  it("should create WebSocket without auth when no token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    expect(WebSocket).toHaveBeenCalledWith(wsUrl);
  });
});

describe("HTTP Link Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RPCLinkFetch.mockImplementation(function () {
      return {};
    });
    WSLink.mockImplementation(function () {
      return {};
    });
  });

  it("should configure HTTP link with correct URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    expect(RPCLinkFetch).toHaveBeenCalled();
    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    expect(callArgs?.url).toBe(httpUrl);
  });

  it("should include authorization header when token provided", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-token";

    getORPCClient(httpUrl, wsUrl, token);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const headersFn = callArgs?.headers as (() => Record<string, string>) | undefined;

    expect(typeof headersFn).toBe("function");
    expect(headersFn?.()).toEqual({ Authorization: "Bearer test-token" });
  });

  it("should not include authorization header when no token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const headersFn = callArgs?.headers as (() => Record<string, string>) | undefined;

    expect(typeof headersFn).toBe("function");
    expect(headersFn?.()).toEqual({});
  });

  it("should configure retry interceptor", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("interceptors");
    expect(Array.isArray(callArgs.interceptors)).toBe(true);
    expect(callArgs.interceptors).toHaveLength(1);
  });
});

describe("Retry Interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RPCLinkFetch.mockImplementation(function () {
      return {};
    });
    WSLink.mockImplementation(function () {
      return {};
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should retry on ORPCError with status >= 500", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const serverError = new ORPCError("INTERNAL_SERVER_ERROR", { status: 500 });

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(serverError);
      }
      return Promise.resolve("success");
    });

    const result = await interceptor({ next: nextFn, path: "test" });
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(3);
  }, 60_000);

  it("should retry on FetchError", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const fetchError = new Error("Fetch error");
    fetchError.name = "FetchError";

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(fetchError);
      }
      return Promise.resolve("success");
    });

    const result = await interceptor({ next: nextFn, path: "test" });
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(2);
  }, 60_000);

  it("should not retry after max attempts", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const serverError = new ORPCError("INTERNAL_SERVER_ERROR", { status: 500 });

    const nextFn = vi.fn().mockRejectedValue(serverError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toThrow();
    expect(nextFn).toHaveBeenCalledTimes(5);
  }, 60_000);

  it("should not retry non-retryable errors", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const clientError = new Error("Client error");

    const nextFn = vi.fn().mockRejectedValue(clientError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toThrow("Client error");
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("should not retry ORPCError with status 400 (client error)", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const clientError = new ORPCError("BAD_REQUEST", { status: 400 });

    const nextFn = vi.fn().mockRejectedValue(clientError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toThrow();
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("should not retry ORPCError with status 499 (client error boundary)", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const clientError = new ORPCError("BAD_REQUEST", { status: 499 });

    const nextFn = vi.fn().mockRejectedValue(clientError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toThrow();
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on TypeError (network failure)", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const typeError = new TypeError("Network request failed");

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(typeError);
      }
      return Promise.resolve("success");
    });

    const result = await interceptor({ next: nextFn, path: "test" });
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(2);
  }, 60_000);

  it("should not retry on plain Error (non-retryable)", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const plainError = new Error("Some random error");

    const nextFn = vi.fn().mockRejectedValue(plainError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toThrow("Some random error");
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("should not retry on non-Error object", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const nonError = { message: "Not an error" };

    const nextFn = vi.fn().mockRejectedValue(nonError);

    await expect(interceptor({ next: nextFn, path: "test" })).rejects.toBe(nonError);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on ORPCError with status 502 (Bad Gateway)", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const serverError = new ORPCError("BAD_GATEWAY", { status: 502 });

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(serverError);
      }
      return Promise.resolve("success");
    });

    const result = await interceptor({ next: nextFn, path: "test" });
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(2);
  }, 60_000);

  it("should use exponential backoff with increasing delays", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const serverError = new ORPCError("INTERNAL_SERVER_ERROR", { status: 500 });

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(serverError);
      }
      return Promise.resolve("success");
    });

    const promise = interceptor({ next: nextFn, path: "test" });

    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    const result = await promise;
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(3);
  }, 60_000);

  it("should cap delay at 30 seconds", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getORPCClient(httpUrl, wsUrl);

    const callArgs = RPCLinkFetch.mock.calls[0]?.[0];
    const interceptor = callArgs?.interceptors[0] as (ctx: {
      next: typeof vi.fn;
      path: string;
    }) => Promise<unknown>;

    const { ORPCError } = await import("@orpc/client");
    const serverError = new ORPCError("INTERNAL_SERVER_ERROR", { status: 500 });

    let attempts = 0;
    const nextFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 5) {
        return Promise.reject(serverError);
      }
      return Promise.resolve("success");
    });

    const promise = interceptor({ next: nextFn, path: "test" });

    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.advanceTimersByTimeAsync(30_000);

    const result = await promise;
    expect(result).toBe("success");
    expect(nextFn).toHaveBeenCalledTimes(5);
  }, 60_000);
});

describe("createWsConnection", () => {
  const enhancedWsInstances: Array<{
    close: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    _originalSend: ReturnType<typeof vi.fn>;
    _listeners: Record<string, Array<(event: unknown) => void>>;
    _trigger: (event: string, data: unknown) => void;
  }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    enhancedWsInstances.length = 0;
    RPCLinkFetch.mockImplementation(function () {
      return {};
    });
    WSLink.mockImplementation(function () {
      return {};
    });

    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(function (url: string) {
        const listeners: Record<string, Array<(event: unknown) => void>> = {};
        const originalSend = vi.fn();
        const ws = {
          url,
          close: vi.fn().mockResolvedValue(undefined),
          addEventListener: vi.fn((event: string, handler: (event: unknown) => void) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
          }),
          send: originalSend,
          _originalSend: originalSend,
          _listeners: listeners,
          _trigger: (event: string, data: unknown) => {
            listeners[event]?.forEach((h) => h(data));
          },
        };
        enhancedWsInstances.push(ws);
        return ws;
      }),
    );
  });

  afterEach(() => {
    vi.stubGlobal(
      "WebSocket",
      vi.fn().mockImplementation(function () {
        const instance = { close: vi.fn().mockResolvedValue(undefined) };
        mockWebSocketInstances.push(instance);
        return instance;
      }),
    );
  });

  it("should queue connection_init on open and send after ack", () => {
    getORPCClient("http://localhost", "ws://localhost", "test-token");
    const ws = enhancedWsInstances[0];

    ws._trigger("open", {});
    expect(ws._originalSend).not.toHaveBeenCalled();

    ws._trigger("message", { data: JSON.stringify({ type: "connection_ack" }) });
    expect(ws._originalSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: "connection_init",
        payload: { authorization: "Bearer test-token" },
      }),
    );
  });

  it("should queue messages before auth acknowledgement and send after", () => {
    getORPCClient("http://localhost", "ws://localhost", "token");
    const ws = enhancedWsInstances[0];

    ws._trigger("open", {});
    expect(ws._originalSend).not.toHaveBeenCalled();

    ws.send("queued-message");
    expect(ws._originalSend).not.toHaveBeenCalledWith("queued-message");

    ws._trigger("message", { data: JSON.stringify({ type: "connection_ack" }) });

    expect(ws._originalSend).toHaveBeenCalledWith(
      JSON.stringify({
        type: "connection_init",
        payload: { authorization: "Bearer token" },
      }),
    );
    expect(ws._originalSend).toHaveBeenCalledWith("queued-message");
  });

  it("should not send connection_init when no token", () => {
    getORPCClient("http://localhost", "ws://localhost");
    const ws = enhancedWsInstances[0];

    ws._trigger("open", {});
    expect(ws._originalSend).not.toHaveBeenCalled();
  });

  it("should send messages immediately when no token", () => {
    getORPCClient("http://localhost", "ws://localhost");
    const ws = enhancedWsInstances[0];

    ws.send("immediate-message");
    expect(ws._originalSend).toHaveBeenCalledWith("immediate-message");
  });

  it("should ignore non-JSON message events", () => {
    getORPCClient("http://localhost", "ws://localhost", "token");
    const ws = enhancedWsInstances[0];

    ws._trigger("open", {});
    ws.send("msg1");

    ws._trigger("message", { data: "not-json" });
    expect(ws._originalSend).not.toHaveBeenCalled();

    ws._trigger("message", { data: JSON.stringify({ type: "other" }) });
    expect(ws._originalSend).not.toHaveBeenCalled();
  });

  it("should handle cleanup closing the WebSocket", async () => {
    const { cleanup } = getORPCClient("http://localhost", "ws://localhost", "token");
    const ws = enhancedWsInstances[0];

    await cleanup();
    expect(ws.close).toHaveBeenCalled();
  });
});
