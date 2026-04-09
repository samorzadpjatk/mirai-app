import { describe, test, expect, beforeAll } from "bun:test";

describe("[UNIT] config.ts", () => {
  // Set env vars before any tests run
  beforeAll(() => {
    process.env.TRPC_SERVER_PORT = "3001";
    process.env.TRPC_SERVER_HOST = "localhost";
  });

  test("exports serverConfig with correct values", async () => {
    const { serverConfig } = await import("../../config");

    expect(serverConfig.port).toBe(3001);
    expect(serverConfig.host).toBe("localhost");
    expect(serverConfig.prefix).toBe("/api/trpc");
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
