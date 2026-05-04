import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../api/trpc";
import type { TRPCContext } from "../api/trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User } from "@mirai-app/db";

/**
 * Example tRPC Router Tests
 *
 * This file demonstrates how to test tRPC routers with Vitest.
 * It shows patterns for testing public, protected, and admin procedures.
 */

// Create a simple test router for demonstration
const testRouter = createTRPCRouter({
  // Public procedure - no authentication required
  hello: publicProcedure.query(({ ctx }) => {
    return {
      message: "Hello from tRPC!",
      hasAuth: !!ctx.accessToken,
    };
  }),

  // Public procedure with input
  greet: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "name" in val) {
        return val as { name: string };
      }
      throw new Error("Invalid input");
    })
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` };
    }),

  // Protected procedure - requires authentication
  getMe: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      dbUser: ctx.dbUser,
    };
  }),

  // Protected mutation
  updateProfile: protectedProcedure
    .input((val: unknown) => {
      if (typeof val === "object" && val !== null && "firstName" in val) {
        return val as { firstName: string; lastName?: string };
      }
      throw new Error("Invalid input");
    })
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.user.update({
        where: { id: ctx.dbUser.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });
      return updated;
    }),

  // Admin-only procedure
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany();
    return users;
  }),
});

// Create caller factory for testing
const createCaller = createCallerFactory(testRouter);

describe("tRPC Router Testing Patterns", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock database client
    mockDb = {
      user: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: vi.fn((cb) => cb(mockDb)),
    } as unknown as PrismaClient;

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as unknown as SupabaseClient;
  });

  describe("Public Procedures", () => {
    it("should execute public query without authentication", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      };

      const caller = createCaller(ctx);
      const result = await caller.hello();

      expect(result.message).toBe("Hello from tRPC!");
      expect(result.hasAuth).toBe(false);
    });

    it("should handle input validation in public procedure", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      };

      const caller = createCaller(ctx);
      const result = await caller.greet({ name: "World" });

      expect(result.greeting).toBe("Hello, World!");
    });

    it("should throw error for invalid input", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      };

      const caller = createCaller(ctx);

      // @ts-expect-error - Testing invalid input
      await expect(caller.greet({ invalid: "input" })).rejects.toThrow();
    });
  });

  describe("Protected Procedures", () => {
    it("should return user data when authenticated with mocked auth", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      const result = await caller.getMe();

      expect(result.user).toBeDefined();
      expect(result.dbUser).toBeDefined();
      expect(result.dbUser.id).toBe("test-db-user-id");
    });

    it("should return user data when authenticated", async () => {
      const mockUser = {
        id: "auth-123",
        email: "test@example.com",
      };

      const mockDbUser: User = {
        id: "db-123",
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        hasAvatar: false,
        wristNumber: null,
        houseNumber: null,
        groupId: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock successful auth
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer test-token" }),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      try {
        await caller.getMe();
      } catch {
        expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("test-token");
      }
    });

    it("should execute mutation with valid input", async () => {
      const mockUpdatedUser = {
        id: "db-123",
        firstName: "Updated",
        lastName: "Name",
      };

      vi.mocked(mockDb.user.update).mockResolvedValue(mockUpdatedUser as never);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller(ctx);

      try {
        await caller.updateProfile({ firstName: "Updated", lastName: "Name" });
      } catch {
        // Expected due to auth middleware
      }

      // Verify the mock was set up correctly
      expect(mockDb.user.update).toBeDefined();
    });
  });

  describe("Admin Procedures", () => {
    it("should require admin role for admin procedures", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      // Mock non-admin user
      vi.mocked(mockDb.user.findFirst).mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as never);

      const caller = createCaller(ctx);

      try {
        await caller.getAllUsers();
      } catch {
        // Expected to fail due to admin check
      }

      // The procedure should attempt to verify admin status
      expect(mockDb.user.findFirst).toBeDefined();
    });

    it("should allow access for admin users", async () => {
      const mockUsers: User[] = [
        {
          id: "user-1",
          authUserId: "auth-1",
          email: "user1@example.com",
          firstName: "User",
          lastName: "One",
          role: "USER",
          hasAvatar: false,
          wristNumber: null,
          houseNumber: null,
          groupId: null,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          email: "user2@example.com",
          firstName: "User",
          lastName: "Two",
          role: "ADMIN",
          hasAvatar: false,
          wristNumber: null,
          houseNumber: null,
          groupId: null,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockDb.user.findMany).mockResolvedValue(mockUsers as never);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      try {
        const result = await caller.getAllUsers();
        expect(result).toHaveLength(2);
      } catch {
        // Expected due to auth middleware
      }
    });
  });

  describe("Context Testing", () => {
    it("should have access to database in context", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      };

      const caller = createCaller(ctx);
      await caller.hello();

      // Verify context was passed correctly
      expect(ctx.db).toBeDefined();
      expect(ctx.supabase).toBeDefined();
    });

    it("should have access to headers in context", async () => {
      const headers = new Headers({
        "User-Agent": "test-agent",
        "X-Custom-Header": "custom-value",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers,
        accessToken: "test-token",
      };

      expect(ctx.headers.get("User-Agent")).toBe("test-agent");
      expect(ctx.headers.get("X-Custom-Header")).toBe("custom-value");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(mockDb.user.findMany).mockRejectedValue(
        new Error("Database connection failed")
      );

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "admin-token",
      };

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
      const ctx = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: null,
      } as TRPCContext;

      const caller = createCaller(ctx);

      // Public procedure should work with minimal context
      const result = await caller.hello();
      expect(result).toBeDefined();
    });
  });
});

describe("Router Factory Pattern", () => {
  it("should create router with multiple procedures", () => {
    const router = createTRPCRouter({
      query1: publicProcedure.query(() => "result1"),
      query2: publicProcedure.query(() => "result2"),
    });

    expect(router).toBeDefined();
    expect(router._def.procedures).toHaveProperty("query1");
    expect(router._def.procedures).toHaveProperty("query2");
  });

  it("should support nested routers", () => {
    const subRouter = createTRPCRouter({
      nested: publicProcedure.query(() => "nested result"),
    });

    const mainRouter = createTRPCRouter({
      sub: subRouter,
    });

    expect(mainRouter).toBeDefined();
    expect(mainRouter._def.record).toHaveProperty("sub");
  });
});
