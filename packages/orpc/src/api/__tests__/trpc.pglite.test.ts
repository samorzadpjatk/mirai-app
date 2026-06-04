import { userAgents } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase } from "../../test-helpers";
import {
  createORPCContext,
  createORPCRouter,
  enableUserAgentTelemetry,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
  serviceAccountProcedure,
} from "../trpc";
import type { TRPCContext } from "../trpc";
import {
  AuthenticationError,
  AuthorizationError,
  requireAuth,
  requireModerator,
  requireAdmin,
} from "@mirai-app/auth";
import { ORPCError } from "@orpc/server";

describe("createORPCContext token extraction", () => {
  const baseOpts = {
    databaseUrl: "postgres://localhost",
    supabaseUrl: "http://localhost",
    supabaseKey: "key",
  };

  it("should extract Bearer token from lowercase authorization header", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "Bearer test-token-123" }),
    });

    expect(ctx.accessToken).toBe("test-token-123");
  });

  it("should extract Bearer token from uppercase Authorization header", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ Authorization: "Bearer test-token-456" }),
    });

    expect(ctx.accessToken).toBe("test-token-456");
  });

  it("should return null when no authorization header is present", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers(),
    });

    expect(ctx.accessToken).toBeNull();
  });

  it("should return null for non-Bearer scheme", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "Basic dXNlcjpwYXNz" }),
    });

    expect(ctx.accessToken).toBeNull();
  });

  it("should return null for Bearer scheme without token", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "Bearer" }),
    });

    expect(ctx.accessToken).toBeNull();
  });

  it("should handle lowercase bearer scheme", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "bearer lowercase-token" }),
    });

    expect(ctx.accessToken).toBe("lowercase-token");
  });

  it("should trim whitespace from token with single space", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "Bearer spaced-token " }),
    });

    expect(ctx.accessToken).toBe("spaced-token");
  });

  it("should give connection params priority over headers", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ authorization: "Bearer header-token" }),
      connectionParams: { authorization: "param-token" },
    });

    expect(ctx.accessToken).toBe("param-token");
  });

  it("should fall back to connection params when no header token", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers(),
      connectionParams: { authorization: "param-token" },
    });

    expect(ctx.accessToken).toBe("param-token");
  });

  it("should trim connection params token", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers(),
      connectionParams: { authorization: "  trimmed-param-token  " },
    });

    expect(ctx.accessToken).toBe("trimmed-param-token");
  });

  it("should return null for empty connection params authorization", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers(),
      connectionParams: { authorization: "" },
    });

    expect(ctx.accessToken).toBeNull();
  });

  it("should return null for whitespace-only connection params authorization", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers(),
      connectionParams: { authorization: "   " },
    });

    expect(ctx.accessToken).toBeNull();
  });

  it("should merge connection params into headers", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ "x-existing": "value" }),
      connectionParams: { "x-extra": "extra-value" },
    });

    expect(ctx.headers.get("x-existing")).toBe("value");
    expect(ctx.headers.get("x-extra")).toBe("extra-value");
  });
});

describe("publicProcedure with telemetry disabled", () => {
  const createTestRouter = () =>
    createORPCRouter({
      test: publicProcedure.handler(() => "ok"),
    });

  const createTestContext = (): TRPCContext => ({
    db: {} as TRPCContext["db"],
    supabase: createMockSupabase() as TRPCContext["supabase"],
    headers: new Headers(),
    accessToken: null,
  });

  it("should return ok without telemetry", async () => {
    const router = createTestRouter();
    const ctx = createTestContext();
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).resolves.toBe("ok");
  });
});

describe("getPlatformFromUserAgent via telemetry middleware", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
    enableUserAgentTelemetry();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  const createTestRouter = () =>
    createORPCRouter({
      test: publicProcedure.handler(() => "ok"),
    });

  const createTestContext = (headers: Headers): TRPCContext => ({
    db: testDb.db,
    supabase: createMockSupabase() as TRPCContext["supabase"],
    headers,
    accessToken: null,
  });

  it("should detect iOS user agent", async () => {
    const router = createTestRouter();
    const ctx = createTestContext(
      new Headers({
        "user-agent": "MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0",
      }),
    );

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    // Wait for fire-and-forget insert to complete
    await new Promise((r) => setTimeout(r, 100));

    const rows = await testDb.db.select().from(userAgents);
    expect(rows.length).toBe(1);
    expect(rows[0].userAgent).toBe("MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0");
    expect(rows[0].platform).toBe("ios");
  });

  it("should detect Android user agent", async () => {
    const router = createTestRouter();
    const ctx = createTestContext(
      new Headers({
        "user-agent": "okhttp/4.12.0",
      }),
    );

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    // Wait for fire-and-forget insert to complete
    await new Promise((r) => setTimeout(r, 100));

    const rows = await testDb.db.select().from(userAgents);
    expect(rows.length).toBe(1);
    expect(rows[0].userAgent).toBe("okhttp/4.12.0");
    expect(rows[0].platform).toBe("android");
  });

  it("should not log for unknown user agent", async () => {
    const router = createTestRouter();
    const ctx = createTestContext(
      new Headers({
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      }),
    );

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    // Wait for any potential fire-and-forget insert to complete
    await new Promise((r) => setTimeout(r, 100));

    const rows = await testDb.db.select().from(userAgents);
    expect(rows.length).toBe(0);
  });

  it("should handle null user agent", async () => {
    const router = createTestRouter();
    const ctx = createTestContext(new Headers());

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    // Wait for any potential fire-and-forget insert to complete
    await new Promise((r) => setTimeout(r, 100));

    const rows = await testDb.db.select().from(userAgents);
    expect(rows.length).toBe(0);
  });

  it("should handle db insert rejection gracefully", async () => {
    const router = createTestRouter();
    const mockDb = {
      ...testDb.db,
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error("db error")),
      }),
    } as TRPCContext["db"];
    const ctx = createTestContext(
      new Headers({
        "user-agent": "MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0",
      }),
    );
    ctx.db = mockDb;

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    await new Promise((r) => setTimeout(r, 100));
  });

  it("should handle synchronous db error", async () => {
    const router = createTestRouter();
    const mockDb = {
      ...testDb.db,
      insert: vi.fn().mockImplementation(() => {
        throw new Error("sync error");
      }),
    } as TRPCContext["db"];
    const ctx = createTestContext(
      new Headers({
        "user-agent": "MIRAI/21 CFNetwork/3860.300.31 Darwin/25.2.0",
      }),
    );
    ctx.db = mockDb;

    const caller = createRouterClient(router, { context: ctx });
    await caller.test();

    await new Promise((r) => setTimeout(r, 100));
  });
});

describe("createORPCContext header merging", () => {
  const baseOpts = {
    databaseUrl: "postgres://localhost",
    supabaseUrl: "http://localhost",
    supabaseKey: "key",
  };

  it("should override existing headers with connection params", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ "x-auth": "header-value" }),
      connectionParams: { "x-auth": "param-value" },
    });

    expect(ctx.headers.get("x-auth")).toBe("param-value");
  });

  it("should preserve headers not in connection params", () => {
    const ctx = createORPCContext({
      ...baseOpts,
      headers: new Headers({ "x-keep": "keep-value" }),
      connectionParams: { "x-new": "new-value" },
    });

    expect(ctx.headers.get("x-keep")).toBe("keep-value");
    expect(ctx.headers.get("x-new")).toBe("new-value");
  });
});

describe("protectedProcedure", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  const createTestRouter = () =>
    createORPCRouter({
      test: protectedProcedure.handler(() => "ok"),
    });

  const createTestContext = (accessToken: string | null): TRPCContext => ({
    db: testDb.db,
    supabase: createMockSupabase() as TRPCContext["supabase"],
    headers: new Headers(),
    accessToken,
  });

  it("should throw UNAUTHORIZED when AuthenticationError occurs", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new AuthenticationError("Unauthorized"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should re-throw non-AuthenticationError", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("Unexpected"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(Error);
  });
});

describe("moderatorProcedure", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  const createTestRouter = () =>
    createORPCRouter({
      test: moderatorProcedure.handler(() => "ok"),
    });

  const createTestContext = (accessToken: string | null): TRPCContext => ({
    db: testDb.db,
    supabase: createMockSupabase() as TRPCContext["supabase"],
    headers: new Headers(),
    accessToken,
  });

  it("should throw UNAUTHORIZED when AuthenticationError occurs", async () => {
    vi.mocked(requireModerator).mockRejectedValueOnce(new AuthenticationError("Unauthorized"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should throw FORBIDDEN when AuthorizationError occurs", async () => {
    vi.mocked(requireModerator).mockRejectedValueOnce(new AuthorizationError("Forbidden"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should re-throw non-AuthenticationError", async () => {
    vi.mocked(requireModerator).mockRejectedValueOnce(new Error("Unexpected"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(Error);
  });
});

describe("adminProcedure", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  const createTestRouter = () =>
    createORPCRouter({
      test: adminProcedure.handler(() => "ok"),
    });

  const createTestContext = (accessToken: string | null): TRPCContext => ({
    db: testDb.db,
    supabase: createMockSupabase() as TRPCContext["supabase"],
    headers: new Headers(),
    accessToken,
  });

  it("should throw UNAUTHORIZED when AuthenticationError occurs", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new AuthenticationError("Unauthorized"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should throw FORBIDDEN when AuthorizationError occurs", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new AuthorizationError("Forbidden"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should re-throw non-AuthenticationError", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unexpected"));
    const router = createTestRouter();
    const ctx = createTestContext(null);
    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(Error);
  });
});

describe("serviceAccountProcedure", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
  const originalEnv = process.env;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  afterAll(async () => {
    await testDb.cleanup();
    process.env = originalEnv;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  const createTestRouter = () =>
    createORPCRouter({
      test: serviceAccountProcedure.handler(() => "ok"),
    });

  const createTestContext = (serviceToken?: string): TRPCContext => {
    const headers = new Headers();
    if (serviceToken) {
      headers.set("x-service-token", serviceToken);
    }
    return {
      db: testDb.db,
      supabase: createMockSupabase() as TRPCContext["supabase"],
      headers,
      accessToken: null,
    };
  };

  it("should throw FORBIDDEN when SERVICE_ACCOUNT_TOKEN is not configured", async () => {
    delete process.env.SERVICE_ACCOUNT_TOKEN;
    const router = createTestRouter();
    const ctx = createTestContext("valid-token");

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should throw FORBIDDEN when service token is missing", async () => {
    process.env.SERVICE_ACCOUNT_TOKEN = "expected-token";
    const router = createTestRouter();
    const ctx = createTestContext();

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should throw FORBIDDEN when service token is invalid", async () => {
    process.env.SERVICE_ACCOUNT_TOKEN = "expected-token";
    const router = createTestRouter();
    const ctx = createTestContext("wrong-token");

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should succeed with valid service token", async () => {
    process.env.SERVICE_ACCOUNT_TOKEN = "valid-token";
    const router = createTestRouter();
    const ctx = createTestContext("valid-token");

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).resolves.toBe("ok");
  });

  it("should throw FORBIDDEN when service token has same length but wrong content", async () => {
    process.env.SERVICE_ACCOUNT_TOKEN = "expected-token";
    const router = createTestRouter();
    const ctx = createTestContext("wrong-token!!!");

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);
  });

  it("should throw FORBIDDEN when Buffer.from throws unexpectedly", async () => {
    process.env.SERVICE_ACCOUNT_TOKEN = "expected-token";
    const router = createTestRouter();
    const ctx = createTestContext("valid-token");

    const spy = vi.spyOn(Buffer, "from").mockImplementation(() => {
      throw new Error("Buffer boom");
    });

    const caller = createRouterClient(router, { context: ctx });
    await expect(caller.test()).rejects.toThrow(ORPCError);

    spy.mockRestore();
  });
});
