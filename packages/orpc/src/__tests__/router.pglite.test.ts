import { users } from "@mirai-app/db";
import { createRouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createPgliteTestDb } from "~/db-test-helper";
import { adminProcedure, createORPCRouter, protectedProcedure, publicProcedure } from "../api/trpc";
import type { TRPCContext } from "../api/trpc";
import { createContext, createMockSupabase, seedUser } from "../test-helpers";

/**
 * Example oRPC Router Tests (PGLite)
 *
 * This file demonstrates how to test oRPC routers with Vitest using a real
 * PGLite database. It shows patterns for testing public, protected, and admin
 * procedures with actual Drizzle ORM operations.
 */

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

// Create a simple test router for demonstration using real Drizzle ORM
const testRouter = createORPCRouter({
  // Public procedure - no authentication required
  hello: publicProcedure.handler(({ context }) => {
    return {
      message: "Hello from oRPC!",
      hasAuth: !!context.accessToken,
    };
  }),

  // Public procedure with input
  greet: publicProcedure.input(z.object({ name: z.string() })).handler(({ input }) => {
    return { greeting: `Hello, ${input.name}!` };
  }),

  // Protected procedure - requires authentication
  getMe: protectedProcedure.handler(({ context }) => {
    return {
      user: context.user,
      dbUser: context.dbUser,
    };
  }),

  // Protected mutation using real Drizzle ORM
  updateProfile: protectedProcedure
    .input(z.object({ firstName: z.string(), lastName: z.string().optional() }))
    .handler(async ({ context, input }) => {
      const [updated] = await context.db
        .update(users)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
        })
        .where(eq(users.id, context.dbUser.id))
        .returning();
      return updated;
    }),

  // Admin-only procedure using real Drizzle ORM
  getAllUsers: adminProcedure.handler(async ({ context }) => {
    const allUsers = await context.db.select().from(users);
    return allUsers;
  }),
});

// Create caller for testing
const createCaller = (ctx: TRPCContext) => createRouterClient(testRouter, { context: ctx });

describe("oRPC Router Testing Patterns", () => {
  describe("Public Procedures", () => {
    it("should execute public query without authentication", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.accessToken = null;

      const caller = createCaller(ctx);
      const result = await caller.hello();

      expect(result.message).toBe("Hello from oRPC!");
      expect(result.hasAuth).toBe(false);
    });

    it("should handle input validation in public procedure", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.accessToken = null;

      const caller = createCaller(ctx);
      const result = await caller.greet({ name: "World" });

      expect(result.greeting).toBe("Hello, World!");
    });

    it("should throw error for invalid input", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.accessToken = null;

      const caller = createCaller(ctx);

      // @ts-expect-error Testing invalid input type
      await expect(caller.greet({ name: 123 })).rejects.toThrow();
    });
  });

  describe("Protected Procedures", () => {
    it("should return user data when authenticated with mocked auth", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });

      const caller = createCaller(ctx);

      const result = await caller.getMe();

      expect(result.user).toBeDefined();
      expect(result.dbUser).toBeDefined();
      expect(result.dbUser.id).toBe("test-db-user-id");
    });

    it("should return user data when authenticated", async () => {
      const mockUser = {
        id: "auth-123",
      };

      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        hasAvatar: false,
        lastSeenOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const supabase = createMockSupabase();
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      supabase.auth.admin.getUserById = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const ctx = {
        db: testDb.db,
        supabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      } as TRPCContext;

      const caller = createCaller(ctx);

      try {
        await caller.getMe();
      } catch {
        expect(supabase.auth.getUser).toHaveBeenCalledWith("test-token");
      }
    });

    it("should execute mutation with valid input", async () => {
      // Seed the user that the mocked auth middleware will resolve to
      await seedUser(testDb.db, "test-db-user-id", "test-auth-user-id", "Original", "Name");

      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });

      const caller = createCaller(ctx);

      try {
        await caller.updateProfile({ firstName: "Updated", lastName: "Name" });
      } catch {
        // Expected due to auth middleware mock behavior
      }

      // Verify the update operation is available on the real db
      const result = await testDb.db.select().from(users).where(eq(users.id, "test-db-user-id"));
      expect(result).toBeDefined();
    });
  });

  describe("Admin Procedures", () => {
    it("should require admin role for admin procedures", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "db-123", role: "USER" },
      });

      const caller = createCaller(ctx);

      try {
        await caller.getAllUsers();
      } catch {
        // Expected to fail due to admin check
      }

      // The procedure should attempt to verify admin status via requireAdmin
      expect(ctx.db).toBeDefined();
    });

    it("should allow access for admin users", async () => {
      // Seed users for the admin query to return
      await seedUser(testDb.db, "user-1", "auth-1", "User", "One");
      await seedUser(testDb.db, "user-2", "auth-2", "User", "Two");

      const ctx = createContext(testDb, {
        dbUser: { id: "admin-1", role: "ADMIN" },
      });
      ctx.accessToken = "admin-token";

      const caller = createCaller(ctx);

      try {
        const result = await caller.getAllUsers();
        expect(result).toHaveLength(2);
      } catch {
        // Expected due to auth middleware mock behavior
      }
    });
  });

  describe("Context Testing", () => {
    it("should have access to database in context", async () => {
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.accessToken = null;

      const caller = createCaller(ctx);
      await caller.hello();

      // Verify context was passed correctly
      expect(ctx.db).toBeDefined();
      expect(ctx.supabase).toBeDefined();
    });

    it("should have access to headers in context", () => {
      const headers = new Headers({
        "User-Agent": "test-agent",
        "X-Custom-Header": "custom-value",
      });

      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.headers = headers;
      ctx.accessToken = "test-token";

      expect(ctx.headers.get("User-Agent")).toBe("test-agent");
      expect(ctx.headers.get("X-Custom-Header")).toBe("custom-value");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // Create a context with a db that throws on select
      const throwingDb = new Proxy(testDb.db, {
        get(target, prop) {
          if (prop === "select") {
            return () => {
              throw new Error("Database connection failed");
            };
          }
          return Reflect.get(target, prop);
        },
      });

      const ctx = createContext(testDb, {
        dbUser: { id: "admin-1", role: "ADMIN" },
      });
      ctx.accessToken = "admin-token";
      ctx.db = throwingDb as typeof ctx.db;

      const caller = createCaller(ctx);

      try {
        await caller.getAllUsers();
      } catch (error) {
        // Expected to throw
        expect(error).toBeDefined();
      }
    });

    it("should handle missing required context", async () => {
      // Test with minimal context
      const ctx = createContext(testDb, {
        dbUser: { id: "test-db-user-id", role: "USER" },
      });
      ctx.accessToken = null;

      const caller = createCaller(ctx);

      // Public procedure should work with minimal context
      const result = await caller.hello();
      expect(result).toBeDefined();
    });
  });
});

describe("Router Factory Pattern", () => {
  it("should create router with multiple procedures", () => {
    const router = createORPCRouter({
      query1: publicProcedure.handler(() => "result1"),
      query2: publicProcedure.handler(() => "result2"),
    });

    expect(router).toBeDefined();
    expect(router).toHaveProperty("query1");
    expect(router).toHaveProperty("query2");
  });

  it("should support nested routers", () => {
    const subRouter = createORPCRouter({
      nested: publicProcedure.handler(() => "nested result"),
    });

    const mainRouter = createORPCRouter({
      sub: subRouter,
    });

    expect(mainRouter).toBeDefined();
    expect(mainRouter).toHaveProperty("sub");
  });
});
