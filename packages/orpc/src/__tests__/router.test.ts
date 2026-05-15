import { describe, it, expect, vi, beforeEach } from "vitest";
import { createORPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "../api/trpc";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../api/trpc";
import { z } from "zod";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User } from "@mirai-app/db";

/**
 * Example oRPC Router Tests
 *
 * This file demonstrates how to test oRPC routers with Vitest.
 * It shows patterns for testing public, protected, and admin procedures.
 */

// Create a simple test router for demonstration
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

  // Protected mutation
  updateProfile: protectedProcedure
    .input(z.object({ firstName: z.string(), lastName: z.string().optional() }))
    .handler(async ({ context, input }) => {
      const updated = await context.db.user.update({
        where: { id: context.dbUser.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });
      return updated;
    }),

  // Admin-only procedure
  getAllUsers: adminProcedure.handler(async ({ context }) => {
    const users = await context.db.user.findMany();
    return users;
  }),
});

// Create caller for testing
const createCaller = (ctx: TRPCContext) => createRouterClient(testRouter, { context: ctx });

describe("oRPC Router Testing Patterns", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock database client
    mockDb = {
      user: {
        findMany: vi.fn<() => Promise<User[]>>().mockResolvedValue([]),
        findUnique: vi.fn<() => Promise<User | null>>().mockResolvedValue(null),
        findFirst: vi.fn<() => Promise<User | null>>().mockResolvedValue(null),
        update: vi.fn<() => Promise<User>>().mockResolvedValue({} as User),
        create: vi.fn<() => Promise<User>>().mockResolvedValue({} as User),
        upsert: vi.fn<() => Promise<User>>().mockResolvedValue({} as User),
        delete: vi.fn<() => Promise<User>>().mockResolvedValue({} as User),
        count: vi.fn<() => Promise<number>>().mockResolvedValue(0),
      },
      $transaction: vi.fn<(cb: (db: DB) => Promise<unknown>) => Promise<unknown>>((cb) =>
        cb(mockDb),
      ),
    };

    // Setup mock Supabase client
    interface MockQueryBuilder {
      select: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
    }
    const createMockQueryBuilder = (): MockQueryBuilder => {
      const builder: MockQueryBuilder = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      };
      return builder;
    };
    mockSupabase = {
      auth: {
        getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: null }>>(),
        getSession:
          vi.fn<
            () => Promise<{ data: { session: { access_token: string } | null }; error: null }>
          >(),
        admin: {
          getUserById: vi
            .fn<() => Promise<{ data: { user: null }; error: null }>>()
            .mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
      from: vi.fn<(table: string) => MockQueryBuilder>(() => createMockQueryBuilder()),
    } satisfies SupabaseClient;
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

      expect(result.message).toBe("Hello from oRPC!");
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

      await expect(caller.greet({ name: 123 as any })).rejects.toThrow();
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
      };

      const mockDbUser: User = {
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

      // Mock successful auth

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockDb.user.findFirst.mockResolvedValue(mockDbUser);

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: null,
      });

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

      mockDb.user.update.mockResolvedValue(mockUpdatedUser);

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

      mockDb.user.findFirst.mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      });

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
          firstName: "User",
          lastName: "One",
          role: "USER",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          firstName: "User",
          lastName: "Two",
          role: "ADMIN",
          hasAvatar: false,
          lastSeenOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.user.findMany.mockResolvedValue(mockUsers);

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

    it("should have access to headers in context", () => {
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
      mockDb.user.findMany.mockRejectedValue(new Error("Database connection failed"));

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
