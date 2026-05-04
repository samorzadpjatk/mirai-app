import { describe, it, expect, vi } from "vitest";
import { createServer } from "../server";
import type { ServerOptions } from "../server";

vi.mock("../config", () => ({
  serverConfig: {
    dev: true,
    port: 3001,
    prefix: "/api/trpc",
    host: "127.0.0.1",
  } as ServerOptions,
}));

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
  });

  describe("CORS Configuration", () => {
    it("should have CORS enabled in dev mode", async () => {
      const { server } = createServer({
        dev: true,
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
      expect(corsHeader).toBeDefined();
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
});
