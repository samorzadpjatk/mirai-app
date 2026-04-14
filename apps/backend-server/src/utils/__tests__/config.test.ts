import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// Store original env values
const originalEnv = { ...process.env };

describe("[UNIT] config.ts", () => {
  // Set env vars BEFORE any imports (modules read env at load time)
  beforeAll(() => {
    process.env.NODE_ENV = "development";
    process.env.HONO_SERVER_PORT = "3001";
    process.env.HONO_SERVER_HOST = "localhost";

    // Clear module cache to force re-evaluation of hono-config
    // @ts-ignore - Bun's module cache API
    if (typeof Bun !== "undefined" && Bun.gc) {
      // Clear the specific module paths from cache
      const modulePaths = [
        "/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/src/config/hono-config.ts",
        "/Users/rafalopilowski/Projekty/migration/pjapp/apps/backend-server/src/config.ts",
      ];
      for (const path of modulePaths) {
        // @ts-ignore
        delete require?.cache?.[path];
      }
    }
  });

  afterAll(() => {
    // Restore original env values
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.HONO_SERVER_PORT = originalEnv.HONO_SERVER_PORT;
    process.env.HONO_SERVER_HOST = originalEnv.HONO_SERVER_HOST;
  });

  test("exports serverConfig with correct values", async () => {
    // Import fresh to get env-specific config
    const { serverConfig } = await import("../../config");

    expect(serverConfig.port).toBe(3001);
    expect(serverConfig.host).toBe("localhost");
    expect(serverConfig.prefix).toBe("/graphql");
    expect(serverConfig.dev).toBe(true);
  });

  test("port is a number", async () => {
    const { serverConfig } = await import("../../config");

    expect(typeof serverConfig.port).toBe("number");
  });

  test("serverConfig has all required properties", async () => {
    const { serverConfig } = await import("../../config");

    expect(serverConfig).toHaveProperty("dev");
    expect(serverConfig).toHaveProperty("port");
    expect(serverConfig).toHaveProperty("prefix");
    expect(serverConfig).toHaveProperty("host");
  });
});
