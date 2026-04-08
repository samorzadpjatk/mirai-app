import { describe, test, expect, mock, beforeAll, afterEach } from "bun:test";

// Track registered plugins and routes for verification
const registeredPlugins: Array<{ plugin: string; options?: unknown }> = [];
const registeredRoutes: Array<{
  method: string;
  path: string;
  handler?: unknown;
}> = [];
const errorHandlers: Array<{ path: string; error: Error }> = [];

// Mock dependencies with tracking
mock.module("@fastify/websocket", () => ({
  default: async () => {
    registeredPlugins.push({ plugin: "websocket" });
  },
}));

mock.module("@fastify/cors", () => ({
  default: async (_server: unknown, options: unknown) => {
    registeredPlugins.push({ plugin: "cors", options });
  },
}));

mock.module("@trpc/server/adapters/fastify", () => ({
  fastifyTRPCPlugin: async (_server: unknown, options: unknown) => {
    registeredPlugins.push({ plugin: "trpc", options });
    // Store the onError handler for testing
    const trpcOptions = (
      options as {
        trpcOptions?: {
          onError?: (opts: { path: string; error: Error }) => void;
        };
      }
    )?.trpcOptions;
    if (trpcOptions?.onError) {
      // Store reference to test later
      (
        globalThis as {
          trpcOnError?: (opts: { path: string; error: Error }) => void;
        }
      ).trpcOnError = trpcOptions.onError;
    }
  },
}));

mock.module("fastify", () => ({
  default: (opts: { logger?: boolean } = {}) => ({
    register: async (plugin: unknown, options?: unknown) => {
      // Handle both function plugins and named plugins
      if (typeof plugin === "function") {
        await plugin(null, options);
      }
    },
    get: (path: string, handler: unknown) => {
      registeredRoutes.push({ method: "GET", path, handler });
    },
    listen: async () => {},
    close: async () => {},
    log: { error: () => {}, info: () => {} },
    logger: opts.logger,
  }),
}));

mock.module("@mirai-app/trpc", () => ({
  appRouter: {},
  createTRPCContext: () => ({}),
}));

mock.module("../utils/headers", () => ({
  fastifyHeadersToFetchHeaders: () => new Map(),
}));

// Set required env vars
beforeAll(() => {
  process.env.SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
  process.env.DATABASE_URL = "postgresql://localhost:5432/test";
});

afterEach(() => {
  // Clear tracking arrays between tests
  registeredPlugins.length = 0;
  registeredRoutes.length = 0;
  errorHandlers.length = 0;
  delete (globalThis as { trpcOnError?: unknown }).trpcOnError;
});

describe("createServer", () => {
  test("exports createServer function", async () => {
    const { createServer } = await import("../../server");
    expect(typeof createServer).toBe("function");
  });

  test("createServer returns server object with required methods", async () => {
    const { createServer } = await import("../../server");
    const server = createServer({});

    expect(server).toHaveProperty("server");
    expect(server).toHaveProperty("start");
    expect(server).toHaveProperty("stop");
  });

  test("start method is a function", async () => {
    const { createServer } = await import("../../server");
    const { start } = createServer({});

    expect(typeof start).toBe("function");
  });

  test("stop method is a function", async () => {
    const { createServer } = await import("../../server");
    const { stop } = await createServer({});

    expect(typeof stop).toBe("function");
  });

  test("uses default options when none provided", async () => {
    const { createServer } = await import("../../server");
    const server = createServer({});

    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  test("accepts custom port", async () => {
    const { createServer } = await import("../../server");
    const server = createServer({ port: 8080 });

    expect(server).toBeDefined();
  });

  test("accepts custom host", async () => {
    const { createServer } = await import("../../server");
    const server = createServer({ host: "0.0.0.0" });

    expect(server).toBeDefined();
  });

  test("accepts custom prefix", async () => {
    const { createServer } = await import("../../server");
    const server = createServer({ prefix: "/custom/trpc" });

    expect(server).toBeDefined();
  });
});

describe("ServerOptions interface", () => {
  test("interface allows partial options", async () => {
    const { createServer } = await import("../../server");

    // Should not throw with partial options
    expect(() => createServer({ port: 3000 })).not.toThrow();
    expect(() => createServer({ host: "localhost" })).not.toThrow();
    expect(() => createServer({ prefix: "/api" })).not.toThrow();
    expect(() => createServer({ dev: false })).not.toThrow();
  });
});

describe("Health Check Endpoint", () => {
  test("registers GET /health endpoint", async () => {
    const { createServer } = await import("../../server");
    createServer({});

    const healthRoute = registeredRoutes.find(
      (r) => r.method === "GET" && r.path === "/health",
    );
    expect(healthRoute).toBeDefined();
  });

  test("health endpoint returns 'OK'", async () => {
    const { createServer } = await import("../../server");
    createServer({});

    const healthRoute = registeredRoutes.find(
      (r) => r.method === "GET" && r.path === "/health",
    );
    expect(healthRoute).toBeDefined();
    expect(typeof healthRoute?.handler).toBe("function");

    // Call the handler and verify response
    const response = (healthRoute?.handler as () => string)();
    expect(response).toBe("OK");
  });
});

describe("CORS Configuration", () => {
  test("registers CORS plugin in dev mode", async () => {
    const { createServer } = await import("../../server");
    createServer({ dev: true });

    const corsPlugin = registeredPlugins.find((p) => p.plugin === "cors");
    expect(corsPlugin).toBeDefined();
  });

  test("CORS is configured with origin: true", async () => {
    const { createServer } = await import("../../server");
    createServer({ dev: true });

    const corsPlugin = registeredPlugins.find((p) => p.plugin === "cors");
    expect(corsPlugin).toBeDefined();
    expect(corsPlugin?.options).toEqual({ origin: true, credentials: true });
  });

  test("CORS plugin is not registered in production mode", async () => {
    const { createServer } = await import("../../server");
    createServer({ dev: false });

    // Note: We can't fully verify CORS is skipped without more complex mocking,
    // but we verify the server still creates successfully
    expect(registeredPlugins.some((p) => p.plugin === "cors")).toBe(false);
  });
});

describe("WebSocket Plugin", () => {
  test("registers WebSocket plugin", async () => {
    const { createServer } = await import("../../server");
    createServer({});

    const wsPlugin = registeredPlugins.find((p) => p.plugin === "websocket");
    expect(wsPlugin).toBeDefined();
  });
});

describe("tRPC Plugin", () => {
  test("registers tRPC plugin with correct prefix", async () => {
    const { createServer } = await import("../../server");
    createServer({ prefix: "/api/trpc" });

    const trpcPlugin = registeredPlugins.find((p) => p.plugin === "trpc");
    expect(trpcPlugin).toBeDefined();
    expect((trpcPlugin?.options as { prefix?: string })?.prefix).toBe(
      "/api/trpc",
    );
  });

  test("tRPC plugin uses WebSocket", async () => {
    const { createServer } = await import("../../server");
    createServer({});

    const trpcPlugin = registeredPlugins.find((p) => p.plugin === "trpc");
    expect(trpcPlugin).toBeDefined();
    expect((trpcPlugin?.options as { useWSS?: boolean })?.useWSS).toBe(true);
  });

  test("tRPC plugin has error handler", async () => {
    const { createServer } = await import("../../server");
    createServer({});

    const trpcOnError = (
      globalThis as {
        trpcOnError?: (opts: { path: string; error: Error }) => void;
      }
    ).trpcOnError;
    expect(typeof trpcOnError).toBe("function");
  });

  test("tRPC error handler logs errors to console", async () => {
    const consoleSpy = mock(() => {});
    const originalConsoleError = console.error;
    console.error = consoleSpy;

    const { createServer } = await import("../../server");
    createServer({});

    const trpcOnError = (
      globalThis as {
        trpcOnError?: (opts: { path: string; error: Error }) => void;
      }
    ).trpcOnError;

    if (trpcOnError) {
      const testError = new Error("Test tRPC error");
      trpcOnError({ path: "test.procedure", error: testError });

      expect(consoleSpy).toHaveBeenCalled();
    }

    console.error = originalConsoleError;
  });
});

describe("Server Context Creation", () => {
  test("throws error when SUPABASE_URL is missing", async () => {
    const originalUrl = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "";

    mock.module("@trpc/server/adapters/fastify", () => ({
      fastifyTRPCPlugin: async (_server: unknown, options: unknown) => {
        const trpcOptions = (
          options as {
            trpcOptions?: {
              createContext?: (opts: {
                req: { headers: Record<string, string>; url?: string };
              }) => unknown;
            };
          }
        )?.trpcOptions;
        if (trpcOptions?.createContext) {
          try {
            trpcOptions.createContext({ req: { headers: {} } });
            expect(false).toBe(true); // Should have thrown
          } catch (error) {
            expect((error as Error).message).toContain(
              "Missing Supabase credentials",
            );
          }
        }
      },
    }));

    const { createServer } = await import("../../server");
    createServer({});

    process.env.SUPABASE_URL = originalUrl;
  });

  test("throws error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    mock.module("@trpc/server/adapters/fastify", () => ({
      fastifyTRPCPlugin: async (_server: unknown, options: unknown) => {
        const trpcOptions = (
          options as {
            trpcOptions?: {
              createContext?: (opts: {
                req: { headers: Record<string, string>; url?: string };
              }) => unknown;
            };
          }
        )?.trpcOptions;
        if (trpcOptions?.createContext) {
          try {
            trpcOptions.createContext({ req: { headers: {} } });
            expect(false).toBe(true); // Should have thrown
          } catch (error) {
            expect((error as Error).message).toContain(
              "Missing Supabase credentials",
            );
          }
        }
      },
    }));

    const { createServer } = await import("../../server");
    createServer({});

    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  test("throws error when DATABASE_URL is missing", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "";

    mock.module("@trpc/server/adapters/fastify", () => ({
      fastifyTRPCPlugin: async (_server: unknown, options: unknown) => {
        const trpcOptions = (
          options as {
            trpcOptions?: {
              createContext?: (opts: {
                req: { headers: Record<string, string>; url?: string };
              }) => unknown;
            };
          }
        )?.trpcOptions;
        if (trpcOptions?.createContext) {
          try {
            trpcOptions.createContext({ req: { headers: {} } });
            expect(false).toBe(true); // Should have thrown
          } catch (error) {
            expect((error as Error).message).toContain(
              "Missing database credentials",
            );
          }
        }
      },
    }));

    const { createServer } = await import("../../server");
    createServer({});

    process.env.DATABASE_URL = originalDbUrl;
  });
});

describe("Server Start/Stop", () => {
  test("start calls server.listen with correct parameters", async () => {
    const listenMock = mock(() => Promise.resolve());

    mock.module("fastify", () => ({
      default: () => ({
        register: async () => {},
        get: () => {},
        listen: listenMock,
        close: async () => {},
        log: { error: () => {} },
      }),
    }));

    const { createServer } = await import("../../server");
    const { start } = createServer({ port: 3000, host: "127.0.0.1" });

    await start();

    expect(listenMock).toHaveBeenCalled();
  });

  test("stop calls server.close", async () => {
    const closeMock = mock(() => Promise.resolve());

    mock.module("fastify", () => ({
      default: () => ({
        register: async () => {},
        get: () => {},
        listen: async () => {},
        close: closeMock,
        log: { error: () => {} },
      }),
    }));

    const { createServer } = await import("../../server");
    const { stop } = createServer({});

    await stop();

    expect(closeMock).toHaveBeenCalled();
  });
});
