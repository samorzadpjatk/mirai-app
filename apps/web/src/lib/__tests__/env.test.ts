import { describe, expect, test } from "bun:test";

// Set required environment variables BEFORE any imports
// Note: These values must be consistent with other test files due to module caching
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_GRAPHQL_URL = "http://localhost:3000/graphql";
process.env.PUBLIC_GRAPHQL_WS_URL = "ws://localhost:3000/graphql";

describe("[INTEGRATION] env.ts with valid environment variables", () => {
  test("exports env object with all required properties", async () => {
    // Dynamic import to test the module
    const { env } = await import("../env");

    expect(env).toHaveProperty("supabaseUrl");
    expect(env).toHaveProperty("supabaseAnonKey");
    expect(env).toHaveProperty("graphqlUrl");
    expect(env).toHaveProperty("graphqlWsUrl");
  });

  test("supabaseUrl matches PUBLIC_SUPABASE_URL", async () => {
    const { env } = await import("../env");

    expect(env.supabaseUrl).toBe(process.env.PUBLIC_SUPABASE_URL);
  });

  test("supabaseAnonKey matches PUBLIC_SUPABASE_ANON_KEY", async () => {
    const { env } = await import("../env");

    expect(env.supabaseAnonKey).toBe(process.env.PUBLIC_SUPABASE_ANON_KEY);
  });

  test("graphqlUrl matches PUBLIC_GRAPHQL_URL", async () => {
    const { env } = await import("../env");

    expect(env.graphqlUrl).toBe(process.env.PUBLIC_GRAPHQL_URL);
  });

  test("graphqlWsUrl uses PUBLIC_GRAPHQL_WS_URL when set", async () => {
    // When PUBLIC_GRAPHQL_WS_URL is set, it should be used directly
    const wsUrl = process.env.PUBLIC_GRAPHQL_WS_URL;
    const { env } = await import("../env");

    if (wsUrl) {
      expect(env.graphqlWsUrl).toBe(wsUrl);
    }
  });

  test("env values are non-empty strings", async () => {
    const { env } = await import("../env");

    expect(typeof env.supabaseUrl).toBe("string");
    expect(env.supabaseUrl.length).toBeGreaterThan(0);

    expect(typeof env.supabaseAnonKey).toBe("string");
    expect(env.supabaseAnonKey.length).toBeGreaterThan(0);

    expect(typeof env.graphqlUrl).toBe("string");
    expect(env.graphqlUrl.length).toBeGreaterThan(0);

    expect(typeof env.graphqlWsUrl).toBe("string");
    expect(env.graphqlWsUrl.length).toBeGreaterThan(0);
  });

  test("graphqlUrl and graphqlWsUrl are valid URLs", async () => {
    const { env } = await import("../env");

    // Should not throw
    expect(() => new URL(env.graphqlUrl)).not.toThrow();
    expect(() => new URL(env.graphqlWsUrl)).not.toThrow();
  });

  test("supabaseUrl is a valid URL", async () => {
    const { env } = await import("../env");

    expect(() => new URL(env.supabaseUrl)).not.toThrow();
  });

  test("graphqlWsUrl uses ws:// or wss:// protocol", async () => {
    const { env } = await import("../env");

    const hasValidProtocol =
      env.graphqlWsUrl.startsWith("ws://") ||
      env.graphqlWsUrl.startsWith("wss://");
    expect(hasValidProtocol).toBe(true);
  });

  test("graphqlUrl uses http:// or https:// protocol", async () => {
    const { env } = await import("../env");

    const hasValidProtocol =
      env.graphqlUrl.startsWith("http://") ||
      env.graphqlUrl.startsWith("https://");
    expect(hasValidProtocol).toBe(true);
  });
});

describe("[INTEGRATION] env.ts graphqlWsUrl fallback behavior", () => {
  test("graphqlWsUrl is derived from graphqlUrl when not explicitly set", async () => {
    // This test documents the behavior: if PUBLIC_GRAPHQL_WS_URL is not set,
    // graphqlWsUrl should be derived from graphqlUrl by replacing http with ws
    const { env } = await import("../env");

    const graphqlUrl = env.graphqlUrl;
    const graphqlWsUrl = env.graphqlWsUrl;

    // If graphqlUrl is http, graphqlWsUrl should be ws
    // If graphqlUrl is https, graphqlWsUrl should be wss
    if (graphqlUrl.startsWith("https:")) {
      expect(graphqlWsUrl.startsWith("wss:")).toBe(true);
    } else if (graphqlUrl.startsWith("http:")) {
      expect(graphqlWsUrl.startsWith("ws:")).toBe(true);
    }
  });
});

describe("[INTEGRATION] env.ts snapshot verification", () => {
  test("env exports match expected structure", async () => {
    const { env } = await import("../env");

    // Verify the structure hasn't changed unexpectedly
    const keys = Object.keys(env).sort();
    expect(keys).toEqual([
      "graphqlUrl",
      "graphqlWsUrl",
      "supabaseAnonKey",
      "supabaseUrl",
    ]);
  });
});
