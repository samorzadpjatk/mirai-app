import { userAgents } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { createRouterClient } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase } from "../../test-helpers";
import {
  createORPCContext,
  createORPCRouter,
  enableUserAgentTelemetry,
  publicProcedure,
} from "../trpc";
import type { TRPCContext } from "../trpc";

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
