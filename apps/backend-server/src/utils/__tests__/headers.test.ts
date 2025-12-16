import { describe, it, expect } from "vitest";
import { fastifyHeadersToFetchHeaders } from "../headers";
import type { FastifyRequest } from "fastify";

describe("fastifyHeadersToFetchHeaders", () => {
  it("should convert simple string headers", () => {
    const fastifyHeaders: FastifyRequest["headers"] = {
      "content-type": "application/json",
      authorization: "Bearer token123",
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(fetchHeaders.get("content-type")).toBe("application/json");
    expect(fetchHeaders.get("authorization")).toBe("Bearer token123");
  });

  it("should handle array headers by appending multiple values", () => {
    const fastifyHeaders: FastifyRequest["headers"] = {
      "x-custom-header": ["value1", "value2"],
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    // Headers.get() joins multi-value headers using commas per WHATWG spec
    const multiValueHeader = fetchHeaders.get("x-custom-header");
    expect(multiValueHeader?.split(",").map((value) => value.trim())).toEqual([
      "value1",
      "value2",
    ]);
  });

  it("should skip undefined headers", () => {
    const fastifyHeaders: FastifyRequest["headers"] = {
      "content-type": "application/json",
      "x-undefined": undefined,
    };

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(fetchHeaders.get("content-type")).toBe("application/json");
    expect(fetchHeaders.get("x-undefined")).toBeNull();
  });

  it("should handle empty headers object", () => {
    const fastifyHeaders: FastifyRequest["headers"] = {};

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect([...fetchHeaders.keys()]).toHaveLength(0);
  });

  it("should convert non-string values to strings", () => {
    const fastifyHeaders = {
      "content-length": 1234,
    } as unknown as FastifyRequest["headers"];

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    expect(fetchHeaders.get("content-length")).toBe("1234");
  });

  it("should handle null or undefined input gracefully", () => {
    const fetchHeaders = fastifyHeadersToFetchHeaders(
      undefined as unknown as FastifyRequest["headers"],
    );

    expect([...fetchHeaders.keys()]).toHaveLength(0);
  });

  it("should filter out non-string array entries", () => {
    const fastifyHeaders = {
      "x-mixed": ["string-value", undefined, null, 123],
    } as unknown as FastifyRequest["headers"];

    const fetchHeaders = fastifyHeadersToFetchHeaders(fastifyHeaders);

    // Only "string-value" should be appended
    expect(fetchHeaders.get("x-mixed")).toBe("string-value");
  });
});
