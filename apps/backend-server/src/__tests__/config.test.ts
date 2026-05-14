import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Server Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("Environment Variable Validation", () => {
    it("should throw error when TRPC_SERVER_PORT is missing", async () => {
      delete process.env.TRPC_SERVER_PORT;
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      await expect(import("../config")).rejects.toThrow(
        "Missing TRPC_SERVER_PORT or TRPC_SERVER_HOST environment variable.",
      );
    });

    it("should throw error when TRPC_SERVER_HOST is missing", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      delete process.env.TRPC_SERVER_HOST;

      await expect(import("../config")).rejects.toThrow(
        "Missing TRPC_SERVER_PORT or TRPC_SERVER_HOST environment variable.",
      );
    });

    it("should throw error when both environment variables are missing", async () => {
      delete process.env.TRPC_SERVER_PORT;
      delete process.env.TRPC_SERVER_HOST;

      await expect(import("../config")).rejects.toThrow(
        "Missing TRPC_SERVER_PORT or TRPC_SERVER_HOST environment variable.",
      );
    });
  });

  describe("Configuration Object", () => {
    it("should create config with correct port from environment", async () => {
      process.env.TRPC_SERVER_PORT = "8080";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(serverConfig.port).toBe(8080);
    });

    it("should create config with correct host from environment", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "0.0.0.0";

      const { serverConfig } = await import("../config");

      expect(serverConfig.host).toBe("0.0.0.0");
    });

    it("should always set dev mode to true", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(serverConfig.dev).toBe(true);
    });

    it("should always use /api/trpc as prefix", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(serverConfig.prefix).toBe("/api/trpc");
    });

    it("should handle different port numbers", async () => {
      const ports = ["3000", "8080", "9000", "10000", "1"];

      for (const port of ports) {
        vi.resetModules();
        process.env.TRPC_SERVER_PORT = port;
        process.env.TRPC_SERVER_HOST = "127.0.0.1";

        const { serverConfig } = await import("../config");

        expect(serverConfig.port).toBe(Number(port));
      }
    });

    it("should handle different host values", async () => {
      const hosts = ["127.0.0.1", "0.0.0.0", "localhost", "192.168.1.1"];

      for (const host of hosts) {
        vi.resetModules();
        process.env.TRPC_SERVER_PORT = "3000";
        process.env.TRPC_SERVER_HOST = host;

        const { serverConfig } = await import("../config");

        expect(serverConfig.host).toBe(host);
      }
    });
  });

  describe("Port Number Conversion", () => {
    it("should convert string port to number", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(typeof serverConfig.port).toBe("number");
      expect(serverConfig.port).toBe(3000);
    });

    it("should handle numeric string with leading zeros", async () => {
      process.env.TRPC_SERVER_PORT = "03000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(serverConfig.port).toBe(3000);
    });

    it("should handle edge case port numbers", async () => {
      const edgeCases = [
        { input: "1", expected: 1 },
        { input: "80", expected: 80 },
        { input: "443", expected: 443 },
        { input: "8080", expected: 8080 },
        { input: "65535", expected: 65535 },
      ];

      for (const { input, expected } of edgeCases) {
        vi.resetModules();
        process.env.TRPC_SERVER_PORT = input;
        process.env.TRPC_SERVER_HOST = "127.0.0.1";

        const { serverConfig } = await import("../config");

        expect(serverConfig.port).toBe(expected);
      }
    });
  });

  describe("Configuration Structure", () => {
    it("should export serverConfig as ServerOptions type", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      expect(serverConfig).toHaveProperty("dev");
      expect(serverConfig).toHaveProperty("port");
      expect(serverConfig).toHaveProperty("prefix");
      expect(serverConfig).toHaveProperty("host");
    });

    it("should have all required ServerOptions properties", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig } = await import("../config");

      const expectedKeys = ["dev", "port", "prefix", "host"];
      expectedKeys.forEach((key) => {
        expect(serverConfig).toHaveProperty(key);
      });
    });
  });

  describe("Module Re-import Behavior", () => {
    it("should maintain same values on multiple imports with same env", async () => {
      process.env.TRPC_SERVER_PORT = "3000";
      process.env.TRPC_SERVER_HOST = "127.0.0.1";

      const { serverConfig: config1 } = await import("../config");
      const { serverConfig: config2 } = await import("../config");

      expect(config1).toBe(config2);
    });
  });
});

import { vi } from "vitest";
