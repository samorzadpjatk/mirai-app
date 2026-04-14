import { describe, test, expect } from "bun:test";

// Set env vars BEFORE any imports (modules read env at load time)
process.env.HONO_SERVER_PORT = "3001";
process.env.HONO_SERVER_HOST = "localhost";

describe("[UNIT] config.ts", () => {
  test("exports serverConfig with correct values", async () => {
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
