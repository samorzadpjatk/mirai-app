 
 
 
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { noop } from "@mirai-app/shared/test-utils";

// Set up console spy BEFORE importing the module under test
const consoleSpy = vi.spyOn(console, "log").mockImplementation(noop);

// Mock the @trpc/client module
vi.mock("@trpc/client", () => ({
   
  createTRPCClient: vi.fn(() => ({
    query: vi.fn(),
    mutation: vi.fn(),
    subscription: vi.fn(),
  })),
  createWSClient: vi.fn(() => ({
     
    close: vi.fn().mockResolvedValue(undefined),
  })),
   
  httpLink: vi.fn(() => ({ type: "httpLink" })),
   
  wsLink: vi.fn(() => ({ type: "wsLink" })),
   
  retryLink: vi.fn(() => ({ type: "retryLink" })),
   
  splitLink: vi.fn(({ true: trueLink, false: falseLink }: { true: unknown; false: unknown }) => ({
    type: "splitLink",
    trueLink,
    falseLink,
  })),
}));

// Import mocked functions for assertions - createTRPCClient not used directly in tests
import {
  createWSClient,
  httpLink,
  wsLink,
  retryLink,
  splitLink,
} from "@trpc/client";

// Mock SuperJSON
vi.mock("superjson", () => ({
  default: {
     
    serialize: vi.fn(<T,>(data: T): T => data),
     
    deserialize: vi.fn(<T,>(data: T): T => data),
  },
}));

// Now import the module under test
import { getTRPCClient } from "../vanilia";

describe("getTRPCClient", () => {
  beforeEach(() => {
     
    vi.clearAllMocks();
     
    consoleSpy.mockClear();
  });

  afterEach(() => {
     
    consoleSpy.mockClear();
  });

  it("should create a client with HTTP URL and WS URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const result = getTRPCClient(httpUrl, wsUrl);

    expect(result).toHaveProperty("client");
    expect(result).toHaveProperty("cleanup");
    expect(typeof result.cleanup).toBe("function");
  });

  it("should create a client without authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const result = getTRPCClient(httpUrl, wsUrl);

    expect(result.client).toBeDefined();
     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Creating WebSocket client with token:",
      "NO"
    );
  });

  it("should create a client with authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-auth-token-12345";

    const result = getTRPCClient(httpUrl, wsUrl, token);

    expect(result.client).toBeDefined();
     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Creating WebSocket client with token:",
      "YES"
    );
     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Token preview:",
       
      expect.stringContaining("...")
    );
  });

  it("should include token preview in logs", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-auth-token-12345";

    getTRPCClient(httpUrl, wsUrl, token);

     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Token preview:",
      "test-auth-token-1234..."
    );
  });

  it("should provide a cleanup function that closes WebSocket", async () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    const { cleanup } = getTRPCClient(httpUrl, wsUrl);

    expect(typeof cleanup).toBe("function");

    const cleanupResult = cleanup();
    expect(cleanupResult).toBeInstanceOf(Promise);

    await expect(cleanup()).resolves.toBeUndefined();
  });

  it("should handle different URL formats", () => {
    const testCases = [
      { http: "http://api.example.com", ws: "ws://api.example.com" },
      { http: "https://api.example.com/v1", ws: "wss://api.example.com/v1" },
      { http: "http://localhost:2022", ws: "ws://localhost:2022" },
    ];

    testCases.forEach(({ http, ws }) => {
      const result = getTRPCClient(http, ws);
      expect(result.client).toBeDefined();
      expect(result.cleanup).toBeDefined();
    });
  });

  it("should handle long authorization tokens", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const longToken = "a".repeat(1000);

    const result = getTRPCClient(httpUrl, wsUrl, longToken);

    expect(result.client).toBeDefined();
     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Token preview:",
      "a".repeat(20) + "..."
    );
  });

  it("should handle empty authorization token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const emptyToken = "";

    const result = getTRPCClient(httpUrl, wsUrl, emptyToken);

    expect(result.client).toBeDefined();
     
    expect(consoleSpy).toHaveBeenCalledWith(
      "[WS Client] Creating WebSocket client with token:",
      "NO"
    );
  });

  it("should handle special characters in URLs", () => {
    const httpUrl = "http://localhost:3000/path?query=value";
    const wsUrl = "ws://localhost:3000/path";

    const result = getTRPCClient(httpUrl, wsUrl);

    expect(result.client).toBeDefined();
    expect(result.cleanup).toBeDefined();
  });
});

describe("WebSocket Client Creation", () => {
  beforeEach(() => {
     
    vi.clearAllMocks();
     
    consoleSpy.mockClear();
  });

  afterEach(() => {
     
    consoleSpy.mockClear();
  });

  it("should encode authorization token in WebSocket URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "Bearer token123";

    getTRPCClient(httpUrl, wsUrl, token);

     
    expect(createWSClient).toHaveBeenCalled();
    const callArgs = vi.mocked(createWSClient).mock.calls[0]?.[0];
    expect(callArgs?.url).toContain("authorization=");
    expect(callArgs?.url).toContain(encodeURIComponent("Bearer token123"));
  });

  it("should set lazy connection with 60 second close timeout", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(createWSClient).mock.calls[0]?.[0];
    expect(callArgs?.lazy).toEqual({ enabled: true, closeMs: 60_000 });
  });

  it("should include connection params with authorization", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-token";

    getTRPCClient(httpUrl, wsUrl, token);

    const callArgs = vi.mocked(createWSClient).mock.calls[0]?.[0];
    expect(typeof callArgs?.connectionParams).toBe("function");
    const connectionParamsFn = callArgs?.connectionParams as (() => { authorization: string | undefined });
    expect(connectionParamsFn()).toEqual({ authorization: token });
  });

  it("should handle undefined authorization in connection params", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(createWSClient).mock.calls[0]?.[0];
    const connectionParamsFn = callArgs?.connectionParams as (() => { authorization: undefined });
    expect(connectionParamsFn()).toEqual({ authorization: undefined });
  });
});

describe("Retry Link Configuration", () => {
  it("should configure retry link with correct options", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

     
    expect(retryLink).toHaveBeenCalled();

    const callArgs = vi.mocked(retryLink).mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("retry");
    expect(callArgs).toHaveProperty("retryDelayMs");
    expect(typeof callArgs?.retry).toBe("function");
    expect(typeof callArgs?.retryDelayMs).toBe("function");
  });

  it("should retry on FetchError", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(retryLink).mock.calls[0]?.[0];
    const retryFn = callArgs?.retry;


    const fetchError = { name: "FetchError", data: {}, cause: undefined, shape: null, meta: undefined, message: "Fetch error" } as const;
    const mockOp = { id: 1, type: "query" as const, input: undefined, path: "test", context: {}, signal: undefined };
    expect(retryFn?.({ op: mockOp, attempts: 1, error: fetchError })).toBe(true);
    expect(retryFn?.({ op: mockOp, attempts: 4, error: fetchError })).toBe(true);
    expect(retryFn?.({ op: mockOp, attempts: 5, error: fetchError })).toBe(false);
  });

  it("should retry on 5xx server errors", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(retryLink).mock.calls[0]?.[0];
    const retryFn = callArgs?.retry;

    const mockOp = { id: 1, type: "query" as const, input: undefined, path: "test", context: {}, signal: undefined };

    const serverError = { data: { httpStatus: 500 }, cause: undefined, shape: null, meta: undefined, message: "Server error", name: "TRPCClientError" } as const;
    expect(retryFn?.({ op: mockOp, attempts: 1, error: serverError })).toBe(true);

    const serverError502 = { data: { httpStatus: 502 }, cause: undefined, shape: null, meta: undefined, message: "Server error", name: "TRPCClientError" } as const;
    expect(retryFn?.({ op: mockOp, attempts: 2, error: serverError502 })).toBe(true);

    const clientError = { data: { httpStatus: 400 }, cause: undefined, shape: null, meta: undefined, message: "Client error", name: "TRPCClientError" } as const;
    expect(retryFn?.({ op: mockOp, attempts: 1, error: clientError })).toBe(false);
  });

  it("should use exponential backoff with max 30 second delay", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(retryLink).mock.calls[0]?.[0];
    const retryDelayMsFn = callArgs?.retryDelayMs;

    expect(retryDelayMsFn?.(0)).toBe(1000);
    expect(retryDelayMsFn?.(1)).toBe(2000);
    expect(retryDelayMsFn?.(2)).toBe(4000);
    expect(retryDelayMsFn?.(3)).toBe(8000);
    expect(retryDelayMsFn?.(4)).toBe(16000);

    expect(retryDelayMsFn?.(5)).toBe(30000);
    expect(retryDelayMsFn?.(10)).toBe(30000);
  });

  it("should not retry when max attempts reached", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(retryLink).mock.calls[0]?.[0];
    const retryFn = callArgs?.retry;

    const mockOp = { id: 1, type: "query" as const, input: undefined, path: "test", context: {}, signal: undefined };

    const fetchError = { name: "FetchError", cause: undefined, shape: null, data: null, meta: undefined, message: "Fetch error" } as const;

    expect(retryFn?.({ op: mockOp, attempts: 5, error: fetchError })).toBe(false);
    expect(retryFn?.({ op: mockOp, attempts: 6, error: fetchError })).toBe(false);
  });
});

describe("Split Link Configuration", () => {
  it("should configure split link for subscriptions vs queries/mutations", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

     
    expect(splitLink).toHaveBeenCalled();

    const callArgs = vi.mocked(splitLink).mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("condition");
    expect(callArgs).toHaveProperty("true");
    expect(callArgs).toHaveProperty("false");
  });

  it("should route subscriptions through WebSocket", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(splitLink).mock.calls[0]?.[0];
    const conditionFn = callArgs?.condition;


    const subscriptionOp = { type: "subscription" } as { type: "subscription" };

    const queryOp = { type: "query" } as { type: "query" };

    const mutationOp = { type: "mutation" } as { type: "mutation" };

    expect(conditionFn?.(subscriptionOp as never)).toBe(true);
    expect(conditionFn?.(queryOp as never)).toBe(false);
    expect(conditionFn?.(mutationOp as never)).toBe(false);
  });
});

describe("HTTP Link Configuration", () => {
  it("should configure HTTP link with correct URL", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

     
    expect(httpLink).toHaveBeenCalled();

    const callArgs = vi.mocked(httpLink).mock.calls[0]?.[0];
    expect(callArgs?.url).toBe(httpUrl);
  });

  it("should include authorization header when token provided", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";
    const token = "test-token";

    getTRPCClient(httpUrl, wsUrl, token);

    const callArgs = vi.mocked(httpLink).mock.calls[0]?.[0];
    const headersFn = callArgs?.headers as (() => Record<string, string>) | undefined;

    expect(typeof headersFn).toBe("function");
    expect(headersFn?.()).toEqual({ Authorization: "Bearer test-token" });
  });

  it("should not include authorization header when no token", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(httpLink).mock.calls[0]?.[0];
    const headersFn = callArgs?.headers as (() => Record<string, string>) | undefined;

    expect(typeof headersFn).toBe("function");
    expect(headersFn?.()).toEqual({});
  });

  it("should use SuperJSON transformer for HTTP link", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

    const callArgs = vi.mocked(httpLink).mock.calls[0]?.[0];

    expect(callArgs).toHaveProperty("transformer");
  });
});

describe("WebSocket Link Configuration", () => {
  it("should configure WebSocket link with client and transformer", () => {
    const httpUrl = "http://localhost:3000";
    const wsUrl = "ws://localhost:3000";

    getTRPCClient(httpUrl, wsUrl);

     
    expect(wsLink).toHaveBeenCalled();

    const callArgs = vi.mocked(wsLink).mock.calls[0]?.[0];
    expect(callArgs).toHaveProperty("client");
    expect(callArgs).toHaveProperty("transformer");
  });
});
