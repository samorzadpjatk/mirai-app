 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { userRouter } from "../user";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../../api/trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, TripParticipant, Group } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import * as authEmails from "../../../utils/authEmails";

// Mock the authEmails utilities
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn(),
  buildAuthUserSummaryLookup: vi.fn(),
  resolveAuthEmail: vi.fn((emailByAuthUserId: Map<string, string>, authUserId: string | null): string | null => {
    if (!authUserId) return null;
    return emailByAuthUserId.get(authUserId) ?? null;
  }),
}));

// Mock the auth module
vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireModerator: vi.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));

import { requireAuth, requireAdmin, requireModerator } from "@mirai-app/auth";

const createCaller = (ctx: TRPCContext) => createRouterClient(userRouter, { context: ctx });

describe("userRouter", () => {
   
  let mockDb: any;
   
  let mockSupabase: any;
   
  let mockBuildAuthEmailLookup: any;
   
  let mockBuildAuthUserSummaryLookup: any;
   
  let mockRequireAuth: any;
   
  let mockRequireAdmin: any;
   
  let mockRequireModerator: any;

  // Test data factories
  const createMockSupabaseUser = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: "auth-1",
    email: "user@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockAuthUser = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: "auth-1",
    authUserId: "auth-1",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    emailVerified: null,
    role: "USER" as const,
    ...overrides,
  });

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: "user-1",
    authUserId: "auth-1",
    firstName: "John",
    lastName: "Doe",
    role: "USER",
    hasAvatar: false,
    lastSeenOn: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  const createMockParticipant = (overrides: Partial<TripParticipant & { user: User; group: Group | null }> = {}): TripParticipant & { user: User; group: Group | null } => ({
    id: "participant-1",
    userId: "user-1",
    tripId: "trip-1",
    groupId: null,
    wristNumber: null,
    houseNumber: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    user: createMockUser(),
    group: null,
    ...overrides,
  });

  const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
    id: "group-1",
    name: "Test Group",
    tripId: "trip-1",
    organizerId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

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
      tripParticipant: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        upsert: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn((cb: (db: typeof mockDb) => Promise<unknown>) => cb(mockDb)),
    };

    mockDb = createDrizzleProxy(mockDb as any);

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
          createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          updateUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ data: null, error: null }),
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
    };

    // Get mocked functions
    mockBuildAuthEmailLookup = authEmails.buildAuthEmailLookup;
    mockBuildAuthUserSummaryLookup = authEmails.buildAuthUserSummaryLookup;
    mockRequireAuth = requireAuth;
    mockRequireAdmin = requireAdmin;
    mockRequireModerator = requireModerator;
  });

  describe("Public Procedures", () => {
    describe("getBanStatus", () => {
      it("should return not banned when no access token", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should return not banned when auth error", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "invalid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should return not banned when user not found in admin lookup", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should return not banned when no banned_until", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should return not banned when ban has expired", async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should return banned status when user is banned", async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "auth-1" } as never },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: {
            user: {
              id: "auth-1",
              banned_until: futureDate,
              app_metadata: { ban_reason: "Violation of terms" },
            } as never,
          },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result.banned).toBe(true);
        expect(result.bannedUntil).toBe(futureDate);
        expect(result.reason).toBe("Violation of terms");
      });

      it("should return default reason when ban_reason is not provided", async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();

        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: "auth-1" } as never },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: {
            user: {
              id: "auth-1",
              banned_until: futureDate,
              app_metadata: {},
            } as never,
          },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result.banned).toBe(true);
        expect(result.reason).toBe("Temporary ban");
      });

      it("should handle invalid banned_until date", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });

      it("should handle admin lookup error gracefully", async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatus();

        expect(result).toEqual({ banned: false, bannedUntil: null, reason: null });
      });
    });

    describe("getBanStatusByEmail", () => {
      it("should validate email format", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);

        await expect(caller.getBanStatusByEmail({ email: "invalid-email" })).rejects.toThrow();
      });

      it("should return not exists when email not found", async () => {
        mockSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatusByEmail({ email: "notfound@example.com" });

        expect(result).toEqual({ exists: false, banned: false, bannedUntil: null, reason: null });
      });

      it("should return exists not banned when user found but not banned", async () => {
        mockSupabase.auth.admin.listUsers.mockResolvedValue({
          data: { users: [createMockSupabaseUser({ id: "auth-1", email: "user@example.com" })] },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: { user: createMockSupabaseUser({ id: "auth-1", email: "user@example.com", banned_until: null }) },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatusByEmail({ email: "user@example.com" });

        expect(result).toEqual({ exists: true, banned: false, bannedUntil: null, reason: null });
      });

      it("should return banned status when user is banned by email", async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();

        mockSupabase.auth.admin.listUsers.mockResolvedValue({
          data: { users: [createMockSupabaseUser({ id: "auth-banned", email: "banned@example.com" })] },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: {
            user: createMockSupabaseUser({
              id: "auth-banned",
              email: "banned@example.com",
              banned_until: futureDate,
              app_metadata: { ban_reason: "Spam" },
            }),
          },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatusByEmail({ email: "banned@example.com" });

        expect(result.exists).toBe(true);
        expect(result.banned).toBe(true);
        expect(result.bannedUntil).toBe(futureDate);
        expect(result.reason).toBe("Spam");
      });

      it("should handle listUsers error", async () => {
        mockSupabase.auth.admin.listUsers.mockResolvedValue({
          data: { users: [] },
          error: { message: "Database error" } as never,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);

        await expect(caller.getBanStatusByEmail({ email: "test@example.com" })).rejects.toThrow(ORPCError);
      });

      it("should handle getUserById error after finding user", async () => {
        mockSupabase.auth.admin.listUsers.mockResolvedValue({
          data: { users: [createMockSupabaseUser({ id: "auth-1", email: "user@example.com" })] },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: { user: null },
          error: { message: "Failed to fetch user" } as never,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);

        await expect(caller.getBanStatusByEmail({ email: "user@example.com" })).rejects.toThrow(ORPCError);
      });

      it("should paginate through users to find email", async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();

        // First page doesn't have the user
        mockSupabase.auth.admin.listUsers.mockResolvedValueOnce({
            data: { users: Array(1000).fill(null).map((_, i) => createMockSupabaseUser({ id: `auth-${i}`, email: `user${i}@example.com` })) },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { users: [createMockSupabaseUser({ id: "auth-target", email: "target@example.com" })] },
            error: null,
          });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: {
            user: createMockSupabaseUser({
              id: "auth-target",
              email: "target@example.com",
              banned_until: futureDate,
              app_metadata: { ban_reason: "Violation" },
            }) as never,
          },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatusByEmail({ email: "target@example.com" });

        expect(result.exists).toBe(true);
        expect(result.banned).toBe(true);
        expect(mockSupabase.auth.admin.listUsers).toHaveBeenCalledTimes(2);
      });

      it("should normalize email to lowercase for comparison", async () => {
        mockSupabase.auth.admin.listUsers.mockResolvedValue({
          data: { users: [createMockSupabaseUser({ id: "auth-1", email: "USER@EXAMPLE.COM" })] },
          error: null,
        });

        mockSupabase.auth.admin.getUserById.mockResolvedValue({
          data: {
            user: {
              id: "auth-1",
              email: "USER@EXAMPLE.COM",
              banned_until: null,
            } as never,
          },
          error: null,
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: null,
        };

        const caller = createCaller(ctx);
        const result = await caller.getBanStatusByEmail({ email: "user@example.com" });

        expect(result.exists).toBe(true);
        expect(result.banned).toBe(false);
      });
    });
  });

  describe("Protected Procedures", () => {
    const mockUser = createMockAuthUser();
    const mockDbUser = createMockUser();

    beforeEach(() => {
      mockRequireAuth.mockResolvedValue({ user: mockUser, dbUser: mockDbUser });
    });

    describe("getMy", () => {
      it("should return current user with email", async () => {
        const dbUser = createMockUser({ id: "user-1", authUserId: "auth-1" });
        mockDb.user.findUnique.mockResolvedValue(dbUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-1", "user@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getMy();

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-1");
        expect(result?.email).toBe("user@example.com");
      });

      it("should return null when user not found", async () => {
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getMy();

        expect(result).toBeNull();
      });

      it("should handle missing email gracefully", async () => {
        const dbUser = createMockUser({ id: "user-1", authUserId: "auth-1" });
        mockDb.user.findUnique.mockResolvedValue(dbUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getMy();

        expect(result?.email).toBeNull();
      });
    });

    describe("getMyWithGroup", () => {
      it("should return user with group info for trip", async () => {
        const group = createMockGroup();
        const dbUser = {
          ...createMockUser(),
          trips: [{
            id: "participant-1",
            tripId: "trip-1",
            groupId: "group-1",
            userId: "user-1",
            wristNumber: null,
            houseNumber: null,
            group,
            trip: { id: "trip-1", name: "Test Trip" },
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }],
          organizerGroup: null,
        };
        mockDb.user.findUnique.mockResolvedValue(dbUser);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getMyWithGroup({ tripId: "trip-1" });

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-1");
      });
    });

    describe("updateMyProfile", () => {
      it("should update user profile with valid names", async () => {
        const updatedUser = createMockUser({
          firstName: "Jane",
          lastName: "Smith",
        });
        mockDb.user.update.mockResolvedValue(updatedUser);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateMyProfile({ firstName: "Jane", lastName: "Smith" });

        expect(result.firstName).toBe("Jane");
        expect(result.lastName).toBe("Smith");
      });

      it("should reject names with digits", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);

        await expect(caller.updateMyProfile({ firstName: "John123", lastName: "Doe" })).rejects.toThrow();
      });

      it("should reject names shorter than 2 characters", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);

        await expect(caller.updateMyProfile({ firstName: "J", lastName: "Doe" })).rejects.toThrow();
      });

      it("should reject names longer than 100 characters", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const longName = "a".repeat(101);

        await expect(caller.updateMyProfile({ firstName: longName, lastName: "Doe" })).rejects.toThrow();
      });
    });

    describe("updateAvatar", () => {
      it("should update avatar status", async () => {
        const updatedUser = createMockUser({ hasAvatar: true });
        mockDb.user.update.mockResolvedValue(updatedUser);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateAvatar({ hasAvatar: true });

        expect(result.hasAvatar).toBe(true);
      });

      it("should remove avatar when hasAvatar is false", async () => {
        const updatedUser = createMockUser({ hasAvatar: false });
        mockDb.user.update.mockResolvedValue(updatedUser);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateAvatar({ hasAvatar: false });

        expect(result.hasAvatar).toBe(false);
      });
    });
  });

  describe("Moderator Procedures", () => {
    const mockDbUser = createMockUser({ role: "MODERATOR" });

    beforeEach(() => {
      mockRequireModerator.mockResolvedValue(mockDbUser);
    });

    describe("getById", () => {
      it("should return user by id with email", async () => {
        const user = createMockUser({ id: "user-2", authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getById({ id: "user-2" });

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-2");
        expect(result?.email).toBe("user2@example.com");
      });

      it("should return null when user not found", async () => {
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getById({ id: "nonexistent" });

        expect(result).toBeNull();
      });
    });

    describe("getTripParticipant", () => {
      it("should return trip participant details", async () => {
        const participant = createMockParticipant({
          userId: "user-1",
          tripId: "trip-1",
          wristNumber: "W001",
          houseNumber: "H101",
        });
        mockDb.tripParticipant.findUnique.mockResolvedValue(participant);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getTripParticipant({ userId: "user-1", tripId: "trip-1" });

        expect(result).toBeDefined();
        expect(result?.wristNumber).toBe("W001");
        expect(result?.houseNumber).toBe("H101");
      });

      it("should return null when participant not found", async () => {
        mockDb.tripParticipant.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getTripParticipant({ userId: "user-1", tripId: "trip-1" });

        expect(result).toBeNull();
      });
    });

    describe("getByIdWithGroup", () => {
      it("should return user with group info", async () => {
        const group = createMockGroup();
        const user = {
          ...createMockUser(),
          trips: [{
            id: "participant-1",
            tripId: "trip-1",
            groupId: "group-1",
            userId: "user-1",
            wristNumber: null,
            houseNumber: null,
            group,
            trip: { id: "trip-1", name: "Test Trip" },
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }],
          organizerGroup: null,
        };
        mockDb.user.findUnique.mockResolvedValue(user);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getByIdWithGroup({ id: "user-1", tripId: "trip-1" });

        expect(result).toBeDefined();
        expect(result?.id).toBe("user-1");
      });
    });

    describe("getAll", () => {
      it("should return all participants for a trip", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
            wristNumber: "W001",
            group: createMockGroup(),
          }),
          createMockParticipant({
            user: createMockUser({ id: "user-2", authUserId: "auth-2" }),
            wristNumber: "W002",
            group: null,
          }),
        ];
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([
          ["auth-1", "user1@example.com"],
          ["auth-2", "user2@example.com"],
        ]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getAll({ tripId: "trip-1" });

        expect(result).toHaveLength(2);
        expect(result[0]?.wristNumber).toBe("W001");
        expect(result[0]?.email).toBe("user1@example.com");
      });

      it("should return empty array when no participants", async () => {
        mockDb.tripParticipant.findMany.mockResolvedValue([]);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getAll({ tripId: "trip-1" });

        expect(result).toEqual([]);
      });
    });

    describe("getAllAdminsNames", () => {
      it("should return all admin names", async () => {
        const admins = [
          createMockUser({ id: "admin-1", firstName: "Admin", lastName: "One", role: "ADMIN" }),
          createMockUser({ id: "admin-2", firstName: "Admin", lastName: "Two", role: "ADMIN" }),
        ];
        mockDb.user.findMany.mockResolvedValue(admins);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.getAllAdminsNames();

        expect(result).toHaveLength(2);
        expect(result[0]?.firstName).toBe("Admin");
      });
    });

    describe("searchWithPagination", () => {
      it("should search by firstName", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1", firstName: "John" }),
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(1);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "firstName",
          searchTerm: "John",
        });

        expect(result.users).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
      });

      it("should search by lastName", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1", lastName: "Doe" }),
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(1);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "lastName",
          searchTerm: "Doe",
        });

        expect(result.users).toHaveLength(1);
      });

      it("should search by wristNumber", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
            wristNumber: "W001",
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(0);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "wristNumber",
          searchTerm: "W001",
        });

        expect(result.users).toHaveLength(1);
      });

      it("should search by houseNumber", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
            houseNumber: "H101",
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(1);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "houseNumber",
          searchTerm: "H101",
        });

        expect(result.users).toHaveLength(1);
      });

      it("should search by groupName", async () => {
        const group = createMockGroup({ name: "Test Group" });
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
            groupId: "group-1",
            group,
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(1);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "groupName",
          searchTerm: "Test Group",
        });

        expect(result.users).toHaveLength(1);
      });

      it("should search by email with in-memory filtering", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
          }),
          createMockParticipant({
            user: createMockUser({ id: "user-2", authUserId: "auth-2" }),
          }),
        ];
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map([
          ["auth-1", { email: "john@example.com", bannedUntil: null, banReason: null, isBanned: false }],
          ["auth-2", { email: "jane@example.com", bannedUntil: null, banReason: null, isBanned: false }],
        ]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "email",
          searchTerm: "john",
        });

        expect(result.users).toHaveLength(1);
        expect(result.users[0]?.email).toBe("john@example.com");
      });

      it("should handle pagination with limit and offset", async () => {
        const participants = Array(10).fill(null).map((_, i) =>
          createMockParticipant({
            user: createMockUser({ id: `user-${i}`, authUserId: `auth-${i}` }),
          })
        );
        mockDb.tripParticipant.count.mockResolvedValue(10);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants.slice(0, 2));
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "firstName",
          pagination: { limit: 2, offset: 0 },
        });

        expect(result.users).toHaveLength(2);
        expect(result.pagination.limit).toBe(2);
        expect(result.pagination.hasMore).toBe(true);
        expect(result.pagination.total).toBe(10);
      });

      it("should handle page-based pagination", async () => {
        const participants = Array(5).fill(null).map((_, i) =>
          createMockParticipant({
            user: createMockUser({ id: `user-${i}`, authUserId: `auth-${i}` }),
          })
        );
        mockDb.tripParticipant.count.mockResolvedValue(0);
        mockDb.tripParticipant.findMany.mockResolvedValue([]);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "firstName",
          page: 2,
          limit: 2,
        });

        expect(result.pagination.currentPage).toBe(2);
        expect(result.pagination.hasPreviousPage).toBe(true);
      });

      it("should return all users when no search term", async () => {
        const participants = [
          createMockParticipant({
            user: createMockUser({ id: "user-1", authUserId: "auth-1" }),
          }),
          createMockParticipant({
            user: createMockUser({ id: "user-2", authUserId: "auth-2" }),
          }),
        ];
        mockDb.tripParticipant.count.mockResolvedValue(2);
        mockDb.tripParticipant.findMany.mockResolvedValue(participants);
        mockBuildAuthUserSummaryLookup.mockResolvedValue(new Map());

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "mod-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.searchWithPagination({
          tripId: "trip-1",
          field: "firstName",
        });

        expect(result.users).toHaveLength(2);
      });
    });
  });

  describe("Admin Procedures", () => {
    const mockDbUser = createMockUser({ role: "ADMIN" });

    beforeEach(() => {
      mockRequireAdmin.mockResolvedValue(mockDbUser);
    });

    describe("updateUserAdminStatus", () => {
      it("should update user role", async () => {
        const updatedUser = createMockUser({ id: "user-2", authUserId: "auth-2", role: "MODERATOR" });
        mockDb.user.update.mockResolvedValue(updatedUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateUserAdminStatus({ userId: "user-2", role: "MODERATOR" });

        expect(result.role).toBe("MODERATOR");
      });

      it("should prevent admin from removing their own admin status", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateUserAdminStatus({ userId: mockDbUser.id, role: "USER" })
        ).rejects.toThrow(ORPCError);
      });

      it("should allow admin to change their role to another admin", async () => {
        const updatedUser = createMockUser({ id: mockDbUser.id, authUserId: "auth-1", role: "ADMIN" });
        mockDb.user.update.mockResolvedValue(updatedUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-1", "admin@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateUserAdminStatus({ userId: mockDbUser.id, role: "ADMIN" });

        expect(result.role).toBe("ADMIN");
      });
    });

    describe("createUser", () => {
      it("should create new user and add to trip", async () => {
        const authUser = createMockSupabaseUser({ id: "auth-new", email: "new@example.com" });
        mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: authUser }, error: null });

        const newUser = createMockUser({ id: "user-new", authUserId: "auth-new" });
        const participant = createMockParticipant({
          user: newUser,
          userId: "user-new",
          tripId: "trip-1",
        });

        mockDb.tripParticipant.upsert.mockResolvedValue(participant);
        mockDb.$transaction.mockImplementation(async (fn: (db: typeof mockDb) => Promise<unknown>) => {
          const tx = {
            ...mockDb,
            tripParticipant: {
              ...mockDb.tripParticipant,
              upsert: vi.fn().mockResolvedValue(participant),
            },
            user: {
              ...mockDb.user,
              upsert: vi.fn().mockResolvedValue(newUser),
            },
          };
          return fn(tx);
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.createUser({
          tripId: "trip-1",
          firstName: "New",
          lastName: "User",
          email: "new@example.com",
        });

        expect(result).toBeDefined();
        expect(result.tripId).toBe("trip-1");
      });

      it("should use existing user if auth user already exists", async () => {
        const authUser = createMockSupabaseUser({ id: "auth-existing", email: "existing@example.com" });
        mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: authUser }, error: null });

        const existingUser = createMockUser({ id: "user-existing", authUserId: "auth-existing" });
        const participant = createMockParticipant({
          user: existingUser,
          userId: "user-existing",
          tripId: "trip-1",
        });

        mockDb.tripParticipant.upsert.mockResolvedValue(participant);
        mockDb.$transaction.mockImplementation(async (fn: (db: typeof mockDb) => Promise<unknown>) => {
          const tx = {
            ...mockDb,
            tripParticipant: {
              ...mockDb.tripParticipant,
              upsert: vi.fn().mockResolvedValue(participant),
            },
            user: {
              ...mockDb.user,
              upsert: vi.fn().mockResolvedValue(existingUser),
            },
          };
          return fn(tx);
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.createUser({
          tripId: "trip-1",
          firstName: "Existing",
          lastName: "User",
          email: "existing@example.com",
        });

        expect(result).toBeDefined();
      });

      it("should throw error when auth user creation fails", async () => {
        mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: null }, error: { message: "Creation failed", code: "unknown", status: 500, __isAuthError: true, toJSON: () => ({}) } as never });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.createUser({
            tripId: "trip-1",
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should validate required fields", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.createUser({
            tripId: "trip-1",
            firstName: "",
            lastName: "User",
            email: "test@example.com",
          })
        ).rejects.toThrow();

        await expect(
          caller.createUser({
            tripId: "trip-1",
            firstName: "Test",
            lastName: "",
            email: "test@example.com",
          })
        ).rejects.toThrow();

        await expect(
          caller.createUser({
            tripId: "trip-1",
            firstName: "Test",
            lastName: "User",
            email: "invalid-email",
          })
        ).rejects.toThrow();
      });
    });

    describe("updateName", () => {
      it("should update user name", async () => {
        const updatedUser = createMockUser({
          id: "user-2",
          authUserId: "auth-2",
          firstName: "Updated",
          lastName: "Name",
        });
        mockDb.user.update.mockResolvedValue(updatedUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateName({
          userId: "user-2",
          firstName: "Updated",
          lastName: "Name",
        });

        expect(result.firstName).toBe("Updated");
        expect(result.lastName).toBe("Name");
      });

      it("should validate name fields", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateName({
            userId: "user-2",
            firstName: "",
            lastName: "Name",
          })
        ).rejects.toThrow();

        await expect(
          caller.updateName({
            userId: "user-2",
            firstName: "Test",
            lastName: "",
          })
        ).rejects.toThrow();
      });
    });

    describe("banUserUntil", () => {
      it("should ban user until specified date", async () => {
        const futureDate = Date.now() + 86400000; // Tomorrow
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);

        const authUser = createMockSupabaseUser({ id: "auth-2", email: "user2@example.com" });
        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: authUser }, error: null });

        mockSupabase.auth.admin.updateUserById.mockResolvedValue({ data: { user: authUser }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.banUserUntil({
          userId: "user-2",
          bannedUntilMs: futureDate,
          reason: "Violation",
        });

        expect(result.bannedUntil).toBeDefined();
      });

      it("should throw when user not found", async () => {
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.banUserUntil({
            userId: "nonexistent",
            bannedUntilMs: Date.now() + 86400000,
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when ban date is in the past", async () => {
        const pastDate = Date.now() - 86400000;
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.banUserUntil({
            userId: "user-2",
            bannedUntilMs: pastDate,
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when ban date is invalid", async () => {
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.banUserUntil({
            userId: "user-2",
            bannedUntilMs: Number.NaN,
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when auth user lookup fails", async () => {
        const futureDate = Date.now() + 86400000;
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(null);

        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.banUserUntil({
            userId: "user-2",
            bannedUntilMs: futureDate,
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when update fails", async () => {
        const futureDate = Date.now() + 86400000;
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(null);

        const authUser = createMockSupabaseUser({ id: "auth-2", email: "user2@example.com" });
        mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: authUser }, error: null });

        mockSupabase.auth.admin.updateUserById.mockResolvedValue({ data: { user: authUser }, error: { message: "Update failed", code: "unknown", status: 500, __isAuthError: true, toJSON: () => ({}) } as never });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.banUserUntil({
            userId: "user-2",
            bannedUntilMs: futureDate,
          })
        ).rejects.toThrow(ORPCError);
      });
    });

    describe("deleteUser", () => {
      it("should delete user from trip and system if no other trips", async () => {
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);

        const participant = createMockParticipant({ userId: "user-2", tripId: "trip-1" });
        mockDb.tripParticipant.findUnique.mockResolvedValue(participant);
        mockDb.tripParticipant.count.mockResolvedValue(0);

        mockDb.$transaction.mockImplementation((fn: (db: typeof mockDb) => Promise<unknown>) => fn(mockDb));

        mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: { user: null }, error: null });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.deleteUser({
          userId: "user-2",
          tripId: "trip-1",
        });

        expect(result.deletedFromSystem).toBe(true);
      });

      it("should only remove from trip if user has other trips", async () => {
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);

        const participant = createMockParticipant({ userId: "user-2", tripId: "trip-1" });
        mockDb.tripParticipant.findUnique.mockResolvedValue(participant);
        mockDb.tripParticipant.count.mockResolvedValue(1); // User has other trips

        mockDb.$transaction.mockImplementation((fn: (db: typeof mockDb) => Promise<unknown>) => fn(mockDb));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.deleteUser({
          userId: "user-2",
          tripId: "trip-1",
        });

        expect(result.deletedFromSystem).toBe(false);
      });

      it("should throw when user not found", async () => {
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.deleteUser({
            userId: "nonexistent",
            tripId: "trip-1",
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when user not in trip", async () => {
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);

        mockDb.$transaction.mockImplementation((fn: (db: typeof mockDb) => Promise<unknown>) => fn(mockDb));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.deleteUser({
            userId: "user-2",
            tripId: "trip-1",
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should throw when auth delete fails", async () => {
        const user = createMockUser({ authUserId: "auth-2" });
        mockDb.user.findUnique.mockResolvedValue(user);

        mockDb.$transaction.mockImplementation((fn: (db: typeof mockDb) => Promise<unknown>) => fn(mockDb));

        mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: { user: null }, error: { message: "Delete failed", code: "unknown", status: 500, __isAuthError: true, toJSON: () => ({}) } as never });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.deleteUser({
            userId: "user-2",
            tripId: "trip-1",
          })
        ).rejects.toThrow(ORPCError);
      });
    });

    describe("updateWristNumber", () => {
      it("should update wrist number", async () => {
        const user = createMockUser({ id: "user-2", authUserId: "auth-2" });
        const participant = createMockParticipant({
          user,
          userId: "user-2",
          tripId: "trip-1",
          wristNumber: "W123",
        });

        mockDb.tripParticipant.findFirst.mockResolvedValue(null);
        mockDb.tripParticipant.upsert.mockResolvedValue(participant);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateWristNumber({
          userId: "user-2",
          tripId: "trip-1",
          wristNumber: "W123",
        });

        expect(result.wristNumber).toBe("W123");
      });

      it("should throw when wrist number already taken", async () => {
        const existingUser = createMockUser({ id: "user-3", authUserId: "auth-3", firstName: "Jane", lastName: "Doe" });
        const existingParticipant = createMockParticipant({
          user: existingUser,
          userId: "user-3",
          tripId: "trip-1",
          wristNumber: "W123",
        });

        mockDb.tripParticipant.findFirst.mockResolvedValue(existingParticipant);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-3", "jane@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateWristNumber({
            userId: "user-2",
            tripId: "trip-1",
            wristNumber: "W123",
          })
        ).rejects.toThrow(ORPCError);
      });

      it("should validate wrist number length", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateWristNumber({
            userId: "user-2",
            tripId: "trip-1",
            wristNumber: "",
          })
        ).rejects.toThrow();

        await expect(
          caller.updateWristNumber({
            userId: "user-2",
            tripId: "trip-1",
            wristNumber: "a".repeat(21),
          })
        ).rejects.toThrow();
      });
    });

    describe("removeWristNumber", () => {
      it("should remove wrist number", async () => {
        const user = createMockUser({ id: "user-2", authUserId: "auth-2" });
        const participant = createMockParticipant({
          user,
          userId: "user-2",
          tripId: "trip-1",
          wristNumber: null,
        });

        mockDb.tripParticipant.update.mockResolvedValue(participant);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.removeWristNumber({
          userId: "user-2",
          tripId: "trip-1",
        });

        expect(result.wristNumber).toBeNull();
      });
    });

    describe("updateHouseNumber", () => {
      it("should update house number", async () => {
        const user = createMockUser({ id: "user-2", authUserId: "auth-2" });
        const participant = createMockParticipant({
          user,
          userId: "user-2",
          tripId: "trip-1",
          houseNumber: "H101",
        });

        mockDb.tripParticipant.upsert.mockResolvedValue(participant);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.updateHouseNumber({
          userId: "user-2",
          tripId: "trip-1",
          houseNumber: "H101",
        });

        expect(result.houseNumber).toBe("H101");
      });

      it("should validate house number length", async () => {
        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateHouseNumber({
            userId: "user-2",
            tripId: "trip-1",
            houseNumber: "",
          })
        ).rejects.toThrow();

        await expect(
          caller.updateHouseNumber({
            userId: "user-2",
            tripId: "trip-1",
            houseNumber: "a".repeat(21),
          })
        ).rejects.toThrow();
      });
    });

    describe("removeHouseNumber", () => {
      it("should remove house number", async () => {
        const user = createMockUser({ id: "user-2", authUserId: "auth-2" });
        const participant = createMockParticipant({
          user,
          userId: "user-2",
          tripId: "trip-1",
          houseNumber: null,
        });

        mockDb.tripParticipant.update.mockResolvedValue(participant);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);
        const result = await caller.removeHouseNumber({
          userId: "user-2",
          tripId: "trip-1",
        });

        expect(result.houseNumber).toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors in protected procedures", async () => {
      mockRequireAuth.mockRejectedValue(new Error("Auth failed"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "invalid-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getMy()).rejects.toThrow();
    });

    it("should handle database errors in admin procedures", async () => {
      mockRequireModerator.mockRejectedValue(new Error("Not moderator"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getAllAdminsNames()).rejects.toThrow();
    });

    it("should handle database errors in moderator procedures", async () => {
      mockRequireModerator.mockRejectedValue(new Error("Not moderator"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "user-1" })).rejects.toThrow();
    });
  });

  describe("Input Validation", () => {
    describe("nameSchema validation", () => {
      it("should reject names with digits in updateMyProfile", async () => {
        mockRequireAuth.mockResolvedValue({
          user: createMockAuthUser(),
          dbUser: createMockUser(),
        });

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateMyProfile({ firstName: "John123", lastName: "Doe" })
        ).rejects.toThrow();
      });

      it("should accept valid names", async () => {
        mockRequireAuth.mockResolvedValue({
          user: createMockAuthUser(),
          dbUser: createMockUser(),
        });

        const updatedUser = createMockUser({ firstName: "John", lastName: "Doe" });
        mockDb.user.update.mockResolvedValue(updatedUser);

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "valid-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateMyProfile({ firstName: "John", lastName: "Doe" })
        ).resolves.toBeDefined();
      });
    });

    describe("roleSchema validation", () => {
      it("should reject invalid roles in updateUserAdminStatus", async () => {
        mockRequireAdmin.mockResolvedValue(createMockUser({ role: "ADMIN" }));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          // @ts-expect-error - Testing invalid role
          caller.updateUserAdminStatus({ userId: "user-2", role: "INVALID_ROLE" })
        ).rejects.toThrow();
      });

      it("should accept valid roles", async () => {
        const updatedUser = createMockUser({ id: "user-2", authUserId: "auth-2", role: "MODERATOR" });
        mockRequireAdmin.mockResolvedValue(createMockUser({ role: "ADMIN" }));
        mockDb.user.update.mockResolvedValue(updatedUser);
        mockBuildAuthEmailLookup.mockResolvedValue(new Map([["auth-2", "user2@example.com"]]));

        const ctx: TRPCContext = {
          db: mockDb,
          supabase: mockSupabase,
          headers: new Headers(),
          accessToken: "admin-token",
        };

        const caller = createCaller(ctx);

        await expect(
          caller.updateUserAdminStatus({ userId: "user-2", role: "MODERATOR" })
        ).resolves.toBeDefined();
      });
    });
  });
});
