import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fastifyHeadersToFetchHeaders } from "../headers";

describe("fastifyHeadersToFetchHeaders", () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("Basic Header Conversion", () => {
    it("should convert simple string headers", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
        "authorization": "Bearer token123",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("content-type")).toBe("application/json");
      expect(fetchHeaders.get("authorization")).toBe("Bearer token123");
    });

    it("should handle empty headers object", () => {
      const fetchHeaders = fastifyHeadersToFetchHeaders({});

      expect(fetchHeaders).toBeInstanceOf(Headers);
      expect([...fetchHeaders.keys()]).toHaveLength(0);
    });

    it("should handle undefined headers", () => {
      const fetchHeaders = fastifyHeadersToFetchHeaders(undefined);

      expect(fetchHeaders).toBeInstanceOf(Headers);
      expect([...fetchHeaders.keys()]).toHaveLength(0);
    });

    it("should handle null headers", () => {
      const fetchHeaders = fastifyHeadersToFetchHeaders(null as unknown as undefined);

      expect(fetchHeaders).toBeInstanceOf(Headers);
      expect([...fetchHeaders.keys()]).toHaveLength(0);
    });
  });

  describe("Array Value Handling", () => {
    it("should convert array headers to multiple values", () => {
      const fastifyHeaders = {
        "set-cookie": ["cookie1=value1", "cookie2=value2"],
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);
      const cookies = fetchHeaders.getSetCookie();

      expect(cookies).toHaveLength(2);
      expect(cookies).toContain("cookie1=value1");
      expect(cookies).toContain("cookie2=value2");
    });

    it("should handle single-item arrays", () => {
      const fastifyHeaders = {
        "set-cookie": ["single=value"],
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);
      const cookies = fetchHeaders.getSetCookie();

      expect(cookies).toHaveLength(1);
      expect(cookies).toContain("single=value");
    });

    it("should handle empty arrays", () => {
      const fastifyHeaders = {
        "x-empty": [],
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("x-empty")).toBeNull();
    });

    it("should handle arrays with non-string values gracefully", () => {
      const fastifyHeaders = {
        "x-mixed": ["valid", 123, null, undefined, "also-valid"],
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders as Record<string, unknown[]>);

      expect(fetchHeaders.get("x-mixed")).toBe("valid, also-valid");
    });
  });

  describe("Mixed Header Types", () => {
    it("should handle headers with both string and array values", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
        "set-cookie": ["cookie1=value1", "cookie2=value2"],
        "authorization": "Bearer token",
        "x-custom-array": ["value1", "value2"],
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("content-type")).toBe("application/json");
      expect(fetchHeaders.get("authorization")).toBe("Bearer token");
      expect(fetchHeaders.getSetCookie()).toHaveLength(2);
    });

    it("should handle numeric header values", () => {
      const fastifyHeaders = {
        "content-length": 1024,
        "x-count": 42,
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders as Record<string, unknown>);

      expect(fetchHeaders.get("content-length")).toBe("1024");
      expect(fetchHeaders.get("x-count")).toBe("42");
    });

    it("should handle boolean header values", () => {
      const fastifyHeaders = {
        "x-bool-true": true,
        "x-bool-false": false,
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders as Record<string, unknown>);

      expect(fetchHeaders.get("x-bool-true")).toBe("true");
      expect(fetchHeaders.get("x-bool-false")).toBe("false");
    });
  });

  describe("Undefined Value Handling", () => {
    it("should skip undefined header values", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
        "x-undefined": undefined,
        "authorization": "Bearer token",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("content-type")).toBe("application/json");
      expect(fetchHeaders.get("authorization")).toBe("Bearer token");
      expect(fetchHeaders.get("x-undefined")).toBeNull();
    });

    it("should handle all undefined values", () => {
      const fastifyHeaders = {
        "x-undefined-1": undefined,
        "x-undefined-2": undefined,
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect([...fetchHeaders.keys()]).toHaveLength(0);
    });
  });

  describe("Header Name Handling", () => {
    it("should preserve header names as-is", () => {
      const fastifyHeaders = {
        "X-Custom-Header": "value1",
        "x-custom-header": "value2",
        "X-CUSTOM-HEADER": "value3",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("X-Custom-Header")).toBeDefined();
    });

    it("should handle headers with special characters in values", () => {
      const fastifyHeaders = {
        "x-special": "value with spaces and symbols!@#",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("x-special")).toBe("value with spaces and symbols!@#");
    });
  });

  describe("Common HTTP Headers", () => {
    it("should handle standard request headers", () => {
      const fastifyHeaders = {
        "accept": "application/json",
        "accept-encoding": "gzip, deflate",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "Bearer token123",
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "content-length": "1234",
        "content-type": "application/json",
        "host": "localhost:3000",
        "user-agent": "Mozilla/5.0",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("accept")).toBe("application/json");
      expect(fetchHeaders.get("authorization")).toBe("Bearer token123");
      expect(fetchHeaders.get("content-type")).toBe("application/json");
    });

    it("should handle standard response headers", () => {
      const fastifyHeaders = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, PUT, DELETE",
        "content-encoding": "gzip",
        "content-type": "application/json",
        "date": "Mon, 01 Jan 2024 00:00:00 GMT",
        "etag": '"abc123"',
        "server": "Fastify",
        "set-cookie": ["session=abc123; HttpOnly", "user=john"],
        "x-request-id": "uuid-123",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("content-type")).toBe("application/json");
      expect(fetchHeaders.get("server")).toBe("Fastify");
      expect(fetchHeaders.getSetCookie()).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string values", () => {
      const fastifyHeaders = {
        "x-empty": "",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("x-empty")).toBe("");
    });

    it("should handle very long header values", () => {
      const longValue = "a".repeat(10000);
      const fastifyHeaders = {
        "x-long": longValue,
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders.get("x-long")).toBe(longValue);
    });

    it("should handle many headers", () => {
      const fastifyHeaders: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        fastifyHeaders[`x-header-${i}`] = `value-${i}`;
      }

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect([...fetchHeaders.keys()]).toHaveLength(100);
      expect(fetchHeaders.get("x-header-50")).toBe("value-50");
    });


  });

  describe("Logging", () => {
    it("should log header conversion", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
      };

      fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(console.log).toHaveBeenCalledWith(
        "Converted Fastify headers to Fetch headers:",
        expect.any(Headers)
      );
    });

    it("should log even with empty headers", () => {
      fastifyHeadersToFetchHeaders({});

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("Return Value", () => {
    it("should return a Headers instance", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
      };

      const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders).toBeInstanceOf(Headers);
    });

    it("should return a new Headers instance on each call", () => {
      const fastifyHeaders = {
        "content-type": "application/json",
      };

      const fetchHeaders1 = fastifyHeadersToFetchHeaders(fastifyHeaders);
      const fetchHeaders2 = fastifyHeadersToFetchHeaders(fastifyHeaders);

      expect(fetchHeaders1).not.toBe(fetchHeaders2);
      expect(fetchHeaders1.get("content-type")).toBe(fetchHeaders2.get("content-type"));
    });
  });
});
