 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { coinRouter } from "../../routers/coin";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, Group, CoinTransaction } from "@mirai-app/db";

// Mock the utility modules
vi.mock("../../../utils/activityFeed", () => ({
  captureTripRankingSnapshot: vi.fn().mockResolvedValue(new Map()),
  createRankChangeActivities: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn(),
  requireModerator: vi.fn().mockResolvedValue({
    id: "moderator-123",
    authUserId: "moderator-123",
    email: "moderator@example.com",
    firstName: "Test",
    lastName: "Moderator",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "MODERATOR",
    groupId: null,
    emailVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

const createCaller = (ctx: TRPCContext) => createRouterClient(coinRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "MODERATOR",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock group
const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "group-123",
  name: "Test Group",
  description: "A test group",
  image: null,
  code: "1234",
  coins: 100,
  tripId: "trip-123",
  organizerId: "user-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock coin transaction
const createMockCoinTransaction = (overrides: Partial<CoinTransaction> = {}): CoinTransaction => ({
  id: "transaction-123",
  groupId: "group-123",
  amount: 50,
  reason: "Test transaction",
  adminId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("coinRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockModeratorUser: User;
  let mockGroup: Group;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModeratorUser = createMockUser({ id: "moderator-123", authUserId: "moderator-123", role: "MODERATOR" });
    mockGroup = createMockGroup({ id: "group-123", tripId: "trip-123", coins: 100 });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "moderator-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "moderator-123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed-url.example.com/image.jpg" },
            error: null,
          }),
        }),
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

    // Setup mock database client
    mockDb = {
      user: {
        findFirst: vi.fn().mockResolvedValue(mockModeratorUser),
        findUnique: vi.fn().mockResolvedValue(mockModeratorUser),
      },
      group: {
        findUnique: vi.fn().mockResolvedValue(mockGroup),
        update: vi.fn().mockResolvedValue(mockGroup),
      },
      coinTransaction: {
        create: vi.fn().mockResolvedValue(createMockCoinTransaction()),
      },
      $transaction: vi.fn(async (callback: unknown): Promise<unknown> => {
        if (typeof callback === "function") {
          return await (callback as (db: typeof mockDb) => unknown)(mockDb);
        }
        return Promise.all(callback as unknown[]);
      }),
    };
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("addCoins", () => {
    it("should add coins to a group successfully", async () => {
      const updatedGroup = createMockGroup({ id: "group-123", coins: 150 });
      const transaction = createMockCoinTransaction({
        id: "transaction-1",
        groupId: "group-123",
        amount: 50,
        reason: "Bonus coins",
        adminId: "moderator-123",
        group: {
          id: "group-123",
          name: "Test Group",
          coins: 150,
        },
        admin: {
          id: "moderator-123",
          firstName: "Test",
          lastName: "Moderator",
        },
      });

       
      vi.mocked(mockDb.group.findUnique).mockResolvedValue(mockGroup);
       
      vi.mocked(mockDb.group.update).mockResolvedValue(updatedGroup);
       
      vi.mocked(mockDb.coinTransaction.create).mockResolvedValue(transaction);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.addCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
        reason: "Bonus coins",
      });

      expect(result.amount).toBe(50);
      expect(result.group.coins).toBe(150);
       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { coins: { increment: 50 } },
      });
       
      expect(mockDb.coinTransaction.create).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when group does not exist", async () => {
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          tripId: "trip-123",
          groupId: "non-existent",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group belongs to different trip", async () => {
      const differentTripGroup = createMockGroup({ id: "group-123", tripId: "different-trip" });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(differentTripGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group is deleted", async () => {
      const deletedGroup = createMockGroup({ id: "group-123", isDeleted: true });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(deletedGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should create rank change activities after adding coins", async () => {
      const { createRankChangeActivities } = await import("../../../utils/activityFeed");

      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);
      (mockDb.group.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.addCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
      });

      expect(createRankChangeActivities).toHaveBeenCalledWith({
        tx: mockDb,
        tripId: "trip-123",
         
        previousSnapshot: expect.any(Map),
        createdByAdmin: "moderator-123",
      });
    });

    it("should work without a reason", async () => {
      const transaction = createMockCoinTransaction({
        id: "transaction-1",
        amount: 50,
        reason: null,
      });

      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);
      (mockDb.group.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);
      (mockDb.coinTransaction.create as ReturnType<typeof vi.fn>).mockResolvedValue(transaction);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.addCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
      });

      expect(result.amount).toBe(50);
      expect(result.reason).toBeNull();
    });
  });

  describe("removeCoins", () => {
    it("should remove coins from a group successfully", async () => {
      const groupWithEnoughCoins = createMockGroup({ id: "group-123", coins: 100, tripId: "trip-123" });
      const updatedGroup = createMockGroup({ id: "group-123", coins: 50 });
      const transaction = createMockCoinTransaction({
        id: "transaction-1",
        groupId: "group-123",
        amount: -50,
        reason: "Penalty",
        adminId: "moderator-123",
        group: {
          id: "group-123",
          name: "Test Group",
          coins: 50,
        },
        admin: {
          id: "moderator-123",
          firstName: "Test",
          lastName: "Moderator",
        },
      });

      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(groupWithEnoughCoins);
      (mockDb.group.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedGroup);
      (mockDb.coinTransaction.create as ReturnType<typeof vi.fn>).mockResolvedValue(transaction);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.removeCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
        reason: "Penalty",
      });

      expect(result.amount).toBe(-50);
      expect(result.group.coins).toBe(50);
       
      expect(mockDb.group.update).toHaveBeenCalledWith({
        where: { id: "group-123" },
        data: { coins: { decrement: 50 } },
      });
    });

    it("should throw BAD_REQUEST when group does not have enough coins", async () => {
      const groupWithLowCoins = createMockGroup({ id: "group-123", coins: 30, tripId: "trip-123" });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(groupWithLowCoins);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when group has zero coins", async () => {
      const groupWithZeroCoins = createMockGroup({ id: "group-123", coins: 0, tripId: "trip-123" });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(groupWithZeroCoins);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 10,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group does not exist", async () => {
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "non-existent",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when group belongs to different trip", async () => {
      const differentTripGroup = createMockGroup({ id: "group-123", tripId: "different-trip", coins: 100 });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(differentTripGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when group is deleted", async () => {
      const deletedGroup = createMockGroup({ id: "group-123", isDeleted: true, tripId: "trip-123", coins: 100 });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(deletedGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should create rank change activities after removing coins", async () => {
      const { createRankChangeActivities } = await import("../../../utils/activityFeed");

      const groupWithEnoughCoins = createMockGroup({ id: "group-123", coins: 100, tripId: "trip-123" });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(groupWithEnoughCoins);
      (mockDb.group.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.removeCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
      });

      expect(createRankChangeActivities).toHaveBeenCalledWith({
        tx: mockDb,
        tripId: "trip-123",
         
        previousSnapshot: expect.any(Map),
        createdByAdmin: "moderator-123",
      });
    });

    it("should work without a reason", async () => {
      const groupWithEnoughCoins = createMockGroup({ id: "group-123", coins: 100, tripId: "trip-123" });
      const transaction = createMockCoinTransaction({
        id: "transaction-1",
        amount: -50,
        reason: null,
      });

      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(groupWithEnoughCoins);
      (mockDb.group.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);
      (mockDb.coinTransaction.create as ReturnType<typeof vi.fn>).mockResolvedValue(transaction);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.removeCoins({
        tripId: "trip-123",
        groupId: "group-123",
        amount: 50,
      });

      expect(result.amount).toBe(-50);
      expect(result.reason).toBeNull();
    });
  });

  describe("Input validation", () => {
    it("should validate amount is at least 1 for addCoins", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 0,
        })
      ).rejects.toThrow();
    });

    it("should validate amount is at least 1 for removeCoins", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 0,
        })
      ).rejects.toThrow();
    });

    it("should validate tripId is required", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.addCoins({
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow();
    });

    it("should validate groupId is required", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.addCoins({
          tripId: "trip-123",
          amount: 50,
        })
      ).rejects.toThrow();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle database errors during addCoins", async () => {
      (mockDb.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Database error"));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.addCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow();
    });

    it("should handle database errors during removeCoins", async () => {
      (mockDb.$transaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Database error"));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.removeCoins({
          tripId: "trip-123",
          groupId: "group-123",
          amount: 50,
        })
      ).rejects.toThrow();
    });
  });
});
