import { describe, expect, test } from "bun:test";

// Note: env.ts executes immediately on import, so we can only test it
// with environment variables already set. Missing env vars would cause
// the import to throw before tests can run.

describe("[INTEGRATION] env.ts with valid environment variables", () => {
  test("exports env object with all required properties", async () => {
    // Dynamic import to test the module
    const { env } = await import("../env");

    expect(env).toHaveProperty("supabaseUrl");
    expect(env).toHaveProperty("supabaseAnonKey");
    expect(env).toHaveProperty("trpcUrl");
    expect(env).toHaveProperty("trpcWsUrl");
  });

  test("supabaseUrl matches PUBLIC_SUPABASE_URL", async () => {
    const { env } = await import("../env");

    expect(env.supabaseUrl).toBe(process.env.PUBLIC_SUPABASE_URL);
  });

  test("supabaseAnonKey matches PUBLIC_SUPABASE_ANON_KEY", async () => {
    const { env } = await import("../env");

    expect(env.supabaseAnonKey).toBe(process.env.PUBLIC_SUPABASE_ANON_KEY);
  });

  test("trpcUrl matches PUBLIC_TRPC_API_URL", async () => {
    const { env } = await import("../env");

    expect(env.trpcUrl).toBe(process.env.PUBLIC_TRPC_API_URL);
  });

  test("trpcWsUrl uses PUBLIC_TRPC_WS_URL when set", async () => {
    // When PUBLIC_TRPC_WS_URL is set, it should be used directly
    const wsUrl = process.env.PUBLIC_TRPC_WS_URL;
    const { env } = await import("../env");

    if (wsUrl) {
      expect(env.trpcWsUrl).toBe(wsUrl);
    }
  });

  test("env values are non-empty strings", async () => {
    const { env } = await import("../env");

    expect(typeof env.supabaseUrl).toBe("string");
    expect(env.supabaseUrl.length).toBeGreaterThan(0);

    expect(typeof env.supabaseAnonKey).toBe("string");
    expect(env.supabaseAnonKey.length).toBeGreaterThan(0);

    expect(typeof env.trpcUrl).toBe("string");
    expect(env.trpcUrl.length).toBeGreaterThan(0);

    expect(typeof env.trpcWsUrl).toBe("string");
    expect(env.trpcWsUrl.length).toBeGreaterThan(0);
  });

  test("trpcUrl and trpcWsUrl are valid URLs", async () => {
    const { env } = await import("../env");

    // Should not throw
    expect(() => new URL(env.trpcUrl)).not.toThrow();
    expect(() => new URL(env.trpcWsUrl)).not.toThrow();
  });

  test("supabaseUrl is a valid URL", async () => {
    const { env } = await import("../env");

    expect(() => new URL(env.supabaseUrl)).not.toThrow();
  });

  test("trpcWsUrl uses ws:// or wss:// protocol", async () => {
    const { env } = await import("../env");

    const hasValidProtocol =
      env.trpcWsUrl.startsWith("ws://") || env.trpcWsUrl.startsWith("wss://");
    expect(hasValidProtocol).toBe(true);
  });

  test("trpcUrl uses http:// or https:// protocol", async () => {
    const { env } = await import("../env");

    const hasValidProtocol =
      env.trpcUrl.startsWith("http://") || env.trpcUrl.startsWith("https://");
    expect(hasValidProtocol).toBe(true);
  });
});

describe("[INTEGRATION] env.ts trpcWsUrl fallback behavior", () => {
  test("trpcWsUrl is derived from trpcUrl when not explicitly set", async () => {
    // This test documents the behavior: if PUBLIC_TRPC_WS_URL is not set,
    // trpcWsUrl should be derived from trpcUrl by replacing http with ws
    const { env } = await import("../env");

    const trpcUrl = env.trpcUrl;
    const trpcWsUrl = env.trpcWsUrl;

    // If trpcUrl is http, trpcWsUrl should be ws
    // If trpcUrl is https, trpcWsUrl should be wss
    if (trpcUrl.startsWith("https:")) {
      expect(trpcWsUrl.startsWith("wss:")).toBe(true);
    } else if (trpcUrl.startsWith("http:")) {
      expect(trpcWsUrl.startsWith("ws:")).toBe(true);
    }
  });
});

describe("[INTEGRATION] env.ts snapshot verification", () => {
  test("env exports match expected structure", async () => {
    const { env } = await import("../env");

    // Verify the structure hasn't changed unexpectedly
    const keys = Object.keys(env).sort();
    expect(keys).toEqual([
      "supabaseAnonKey",
      "supabaseUrl",
      "trpcUrl",
      "trpcWsUrl",
    ]);
  });
});
