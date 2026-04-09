/// <reference lib="dom" />

import { describe, test, expect, mock } from "bun:test";

// Mock astro:middleware before importing middleware
mock.module("astro:middleware", () => ({
  defineMiddleware: (handler: unknown) => handler,
}));

// Mock other dependencies
mock.module("@mirai-app/frameworks/supabase", () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: mock(() =>
        Promise.resolve({
          data: { user: null },
          error: new Error("No user"),
        }),
      ),
    },
  }),
}));

mock.module("@trpc/client", () => ({
  createTRPCUntypedClient: () => ({
    query: () => Promise.resolve({ json: { role: "ADMIN" } }),
  }),
  httpBatchLink: (opts: unknown) => opts,
}));

mock.module("../lib/env", () => ({
  env: {
    supabaseUrl: "http://localhost:54321",
    supabaseAnonKey: "mock-key",
    trpcUrl: "http://localhost:3001/trpc",
  },
}));

describe("[UNIT] middleware", () => {
  test("exports onRequest handler", async () => {
    // Import after mocks are set up
    const { onRequest } = await import("../middleware");

    expect(typeof onRequest).toBe("function");
  });

  test("handler accepts context and next parameters", async () => {
    const { onRequest } = await import("../middleware");

    const mockContext = {
      url: new URL("http://localhost:3000/login"),
      cookies: {
        get: () => undefined,
      },
      redirect: (path: string) => ({ type: "redirect", path }),
    };

    const mockNext = () => ({ type: "next" });

    // Should not throw
    const result = await onRequest(mockContext, mockNext);
    expect(result).toBeDefined();
  });

  test("handler can be called with valid token", async () => {
    const { onRequest } = await import("../middleware");

    const mockContext = {
      url: new URL("http://localhost:3000/login"),
      cookies: {
        get: (name: string) =>
          name === "sb-access-token" ? { value: "valid-token" } : undefined,
      },
      redirect: (path: string) => ({ type: "redirect", path }),
    };

    const mockNext = () => ({ type: "next" });

    // Should not throw
    const result = await onRequest(mockContext, mockNext);
    expect(result).toBeDefined();
  });
});
