import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServer } from "../server";

describe("WebSocket Server", () => {
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    server = createServer({
      dev: true,
      port: 3001,
      prefix: "/trpc",
    });
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe("createServer", () => {
    it("should create a server instance", () => {
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
      expect(server.start).toBeTypeOf("function");
      expect(server.stop).toBeTypeOf("function");
    });

    it("should have a health check endpoint", async () => {
      const response = await server.server.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe("OK");
    });
  });

  describe("server configuration", () => {
    it("should use default options when not provided", () => {
      const defaultServer = createServer({});
      expect(defaultServer).toBeDefined();
      expect(defaultServer.server).toBeDefined();
    });

    it("should accept custom port and prefix", () => {
      const customServer = createServer({
        port: 4000,
        prefix: "/custom-trpc",
      });
      expect(customServer).toBeDefined();
    });
  });
});
