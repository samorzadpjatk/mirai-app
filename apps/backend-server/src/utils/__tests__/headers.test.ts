import { describe, test, expect, spyOn } from "bun:test";
import type { FastifyRequest } from "fastify";
import { fastifyHeadersToFetchHeaders } from "../headers";

describe("fastifyHeadersToFetchHeaders", () => {
  describe("simple string header values", () => {
    test("converts single string header value", () => {
      const mockHeaders = {
        "content-type": "application/json",
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("content-type")).toBe("application/json");
    });

    test("converts multiple string headers", () => {
      const mockHeaders = {
        "content-type": "application/json",
        authorization: "Bearer token123",
        "x-custom-header": "custom-value",
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("content-type")).toBe("application/json");
      expect(result.get("authorization")).toBe("Bearer token123");
      expect(result.get("x-custom-header")).toBe("custom-value");
    });

    test("converts headers with empty string values", () => {
      const mockHeaders = {
        "x-empty": "",
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("x-empty")).toBe("");
    });
  });

  describe("array header values (multi-value headers)", () => {
    test("converts array header values using append", () => {
      const mockHeaders = {
        "set-cookie": ["cookie1=value1", "cookie2=value2"],
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("set-cookie")).toBe("cookie1=value1, cookie2=value2");
    });

    test("handles multiple array headers", () => {
      const mockHeaders = {
        "set-cookie": ["a=1", "b=2"],
        "x-multi": ["val1", "val2", "val3"],
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("set-cookie")).toBe("a=1, b=2");
      expect(result.get("x-multi")).toBe("val1, val2, val3");
    });

    test("skips non-string entries in arrays", () => {
      const mockHeaders = {
        "x-mixed": ["valid-string", undefined as unknown as string],
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("x-mixed")).toBe("valid-string");
    });

    test("handles empty arrays", () => {
      const mockHeaders = {
        "x-empty": [],
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("x-empty")).toBeNull();
    });
  });

  describe("filtering undefined values", () => {
    test("filters out undefined header values", () => {
      const mockHeaders = {
        "content-type": "application/json",
        "x-undefined": undefined,
        authorization: "Bearer token",
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("content-type")).toBe("application/json");
      expect(result.get("authorization")).toBe("Bearer token");
      expect(result.get("x-undefined")).toBeNull();
    });

    test("handles all-undefined headers object", () => {
      const mockHeaders = {
        "x-undefined1": undefined,
        "x-undefined2": undefined,
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("x-undefined1")).toBeNull();
      expect(result.get("x-undefined2")).toBeNull();
    });
  });

  describe("empty/undefined headers object", () => {
    test("handles empty headers object", () => {
      const mockHeaders = {} satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result).toBeInstanceOf(Headers);
      expect([...result.keys()]).toHaveLength(0);
    });

    test("handles undefined headers", () => {
      const result = fastifyHeadersToFetchHeaders(
        undefined as unknown as FastifyRequest["headers"],
      );

      expect(result).toBeInstanceOf(Headers);
      expect([...result.keys()]).toHaveLength(0);
    });

    test("handles null headers", () => {
      const result = fastifyHeadersToFetchHeaders(
        null as unknown as FastifyRequest["headers"],
      );

      expect(result).toBeInstanceOf(Headers);
      expect([...result.keys()]).toHaveLength(0);
    });
  });

  describe("non-string value conversion", () => {
    test("converts numbers to strings", () => {
      const mockHeaders = {
        "content-length": 1024 as unknown as string,
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("content-length")).toBe("1024");
    });

    test("converts boolean to string", () => {
      const mockHeaders = {
        "x-bool": true as unknown as string,
      } satisfies FastifyRequest["headers"];

      const result = fastifyHeadersToFetchHeaders(mockHeaders);

      expect(result.get("x-bool")).toBe("true");
    });
  });

  describe("console logging", () => {
    test("logs conversion message", () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

      const mockHeaders = {
        "content-type": "application/json",
      } satisfies FastifyRequest["headers"];

      fastifyHeadersToFetchHeaders(mockHeaders);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Converted Fastify headers to Fetch headers:",
        expect.any(Headers),
      );

      consoleSpy.mockRestore();
    });
  });
});
