import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Server Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("Environment Variable Validation", () => {
    it("should throw error when ORPC_SERVER_PORT is missing", async () => {
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");
      vi.stubEnv("ORPC_SERVER_PORT", undefined);

      await expect(import("../config")).rejects.toThrow(
        "Missing required environment variable: ORPC_SERVER_PORT",
      );
    });

    it("should throw error when ORPC_SERVER_HOST is missing", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", undefined);

      await expect(import("../config")).rejects.toThrow(
        "Missing required environment variable: ORPC_SERVER_HOST",
      );
    });

    it("should throw error when both environment variables are missing", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", undefined);
      vi.stubEnv("ORPC_SERVER_HOST", undefined);

      await expect(import("../config")).rejects.toThrow(
        "Missing required environment variable: ORPC_SERVER_PORT",
      );
    });
  });

  describe("Configuration Object", () => {
    it("should create config with correct port from environment", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "8080");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      expect(serverConfig.port).toBe(8080);
    });

    it("should create config with correct host from environment", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "0.0.0.0");

      const { serverConfig } = await import("../config");

      expect(serverConfig.host).toBe("0.0.0.0");
    });

    it("should always set dev mode to true", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      expect(serverConfig.dev).toBe(true);
    });

    it("should always use /api/orpc as prefix", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      expect(serverConfig.prefix).toBe("/api/orpc");
    });

    it("should handle different port numbers", async () => {
      const ports = ["3000", "8080", "9000", "10000", "1"];

      for (const port of ports) {
        vi.resetModules();
        vi.stubEnv("ORPC_SERVER_PORT", port);
        vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

        const { serverConfig } = await import("../config");

        expect(serverConfig.port).toBe(Number(port));
      }
    });

    it("should handle different host values", async () => {
      const hosts = ["127.0.0.1", "0.0.0.0", "localhost", "192.168.1.1"];

      for (const host of hosts) {
        vi.resetModules();
        vi.stubEnv("ORPC_SERVER_PORT", "3000");
        vi.stubEnv("ORPC_SERVER_HOST", host);

        const { serverConfig } = await import("../config");

        expect(serverConfig.host).toBe(host);
      }
    });
  });

  describe("Port Number Conversion", () => {
    it("should convert string port to number", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      expect(typeof serverConfig.port).toBe("number");
      expect(serverConfig.port).toBe(3000);
    });

    it("should handle numeric string with leading zeros", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "03000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

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
        vi.stubEnv("ORPC_SERVER_PORT", input);
        vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

        const { serverConfig } = await import("../config");

        expect(serverConfig.port).toBe(expected);
      }
    });
  });

  describe("Configuration Structure", () => {
    it("should export serverConfig as ServerOptions type", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      expect(serverConfig).toHaveProperty("dev");
      expect(serverConfig).toHaveProperty("port");
      expect(serverConfig).toHaveProperty("prefix");
      expect(serverConfig).toHaveProperty("host");
    });

    it("should have all required ServerOptions properties", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig } = await import("../config");

      const expectedKeys = ["dev", "port", "prefix", "host"];
      expectedKeys.forEach((key) => {
        expect(serverConfig).toHaveProperty(key);
      });
    });
  });

  describe("Module Re-import Behavior", () => {
    it("should maintain same values on multiple imports with same env", async () => {
      vi.stubEnv("ORPC_SERVER_PORT", "3000");
      vi.stubEnv("ORPC_SERVER_HOST", "127.0.0.1");

      const { serverConfig: config1 } = await import("../config");
      const { serverConfig: config2 } = await import("../config");

      expect(config1).toBe(config2);
    });
  });
});
