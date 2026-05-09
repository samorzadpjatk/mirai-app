/* eslint-disable @typescript-eslint/no-unsafe-call */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { rewardRouter } from "../../routers/reward";
import { createCallerFactory } from "../../trpc";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, Reward, RewardPurchase, Group, Challenge } from "@mirai-app/db";

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn(),
  requireModerator: vi.fn(),
  requireAdmin: vi.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  getServerUser: vi.fn(),
  mapDatabaseUserToAuthUser: vi.fn(),
  parseRolesFromToken: vi.fn(),
  hasRequiredRole: vi.fn(),
  getSession: vi.fn(),
  syncUserToDatabase: vi.fn(),
}));

// Mock the utility modules
vi.mock("../../../utils/storage", () => ({
  normalizeSupabaseStoragePath: vi.fn((value: string) => {
    if (!value) return null;
    if (value.startsWith("http")) return null;
    return { bucket: "images", path: value, storagePath: `images/${value}` };
  }),
}));

vi.mock("../../../utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn().mockResolvedValue(undefined),
}));

const createCaller = createCallerFactory(rewardRouter);

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
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

// Helper to create mock reward
const createMockReward = (overrides: Partial<Reward> & { _count?: { purchases: number } } = {}): Reward =>
  ({
    id: "reward-123",
    name: "Test Reward",
    description: "A test reward",
    availableQuantity: 10,
    image: null,
    coinCost: 50,
    isHidden: false,
    tripId: "trip-123",
    createdById: "admin-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { purchases: 0 },
    ...overrides,
  });

// Helper to create mock reward purchase
const createMockRewardPurchase = (overrides: Partial<RewardPurchase> = {}): RewardPurchase =>
  ({
    id: "purchase-123",
    rewardId: "reward-123",
    groupId: "group-123",
    quantity: 1,
    totalCost: 50,
    purchasedById: "user-123",
    status: "BOUGHT",
    statusUpdatedById: "user-123",
    statusUpdatedAt: new Date(),
    purchasedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as RewardPurchase;

// Helper to create mock challenge
const createMockChallenge = (overrides: Partial<Challenge> = {}): Challenge =>
  ({
    id: "challenge-123",
    tripId: "trip-123",
    name: "Test Challenge",
    description: "Test description",
    image: null,
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    isRecurring: false,
    basePoints: 100,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "ACTIVE",
    startTime: new Date(),
    endTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as Challenge;

describe("rewardRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockModeratorUser: User;
  let mockAdminUser: User;
  let mockGroup: Group;
  let mockReward: Reward;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123", role: "USER", authUserId: "auth-user-123" });
    mockModeratorUser = createMockUser({ id: "moderator-123", role: "MODERATOR", authUserId: "auth-moderator-123" });
    mockAdminUser = createMockUser({ id: "admin-123", role: "ADMIN", authUserId: "auth-admin-123" });
    mockGroup = createMockGroup({ id: "group-123", tripId: "trip-123", coins: 100, organizerId: "user-123" });
    mockReward = createMockReward({ id: "reward-123", tripId: "trip-123", coinCost: 50 });

    const { requireAuth, requireModerator, requireAdmin } = await import("@mirai-app/auth");
     
    vi.mocked(requireAuth).mockResolvedValue({ user: { id: mockUser.authUserId, email: mockUser.email }, dbUser: mockUser });
     
    vi.mocked(requireModerator).mockResolvedValue(mockModeratorUser);
     
    vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123", email: "test@example.com" } },
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
      reward: {
        findMany: vi.fn().mockResolvedValue([mockReward]),
        findUnique: vi.fn().mockResolvedValue(mockReward),
        create: vi.fn().mockResolvedValue(mockReward),
        update: vi.fn().mockResolvedValue(mockReward),
        delete: vi.fn().mockResolvedValue(mockReward),
        count: vi.fn().mockResolvedValue(1),
      },
      rewardPurchase: {
        findMany: vi.fn().mockResolvedValue([createMockRewardPurchase()]),
        findUnique: vi.fn().mockResolvedValue(createMockRewardPurchase()),
        create: vi.fn().mockResolvedValue(createMockRewardPurchase()),
        update: vi.fn().mockResolvedValue(createMockRewardPurchase()),
        count: vi.fn().mockResolvedValue(0),
      },
      group: {
        findMany: vi.fn().mockResolvedValue([mockGroup]),
        findUnique: vi.fn().mockResolvedValue(mockGroup),
        update: vi.fn().mockResolvedValue(mockGroup),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "participant-123",
          userId: "user-123",
          tripId: "trip-123",
          groupId: "group-123",
        }),
        findFirst: vi.fn().mockResolvedValue({
          id: "participant-123",
          userId: "user-123",
          tripId: "trip-123",
          groupId: "group-123",
          group: mockGroup,
        }),
      },
      challenge: {
        findMany: vi.fn().mockResolvedValue([createMockChallenge()]),
      },
      coinTransaction: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn(
        async <T>(
          callback: T extends (tx: unknown) => Promise<unknown>
            ? (tx: typeof mockDb) => Promise<unknown>
            : Promise<unknown>[]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ): Promise<any> => {
          if (typeof callback === "function") {
            const tx = {
              ...mockDb,
              reward: {
                ...mockDb.reward,
                findUnique: vi.fn().mockImplementation((...args: [unknown]) => mockDb.reward.findUnique(...args)),
                update: vi.fn().mockImplementation((...args: [unknown]) => mockDb.reward.update(...args)),
              },
              tripParticipant: {
                ...mockDb.tripParticipant,
                findFirst: vi.fn().mockImplementation((...args: [unknown]) => mockDb.tripParticipant.findFirst(...args)),
              },
              group: {
                ...mockDb.group,
                update: vi.fn().mockImplementation((...args: [unknown]) => mockDb.group.update(...args)),
              },
              rewardPurchase: {
                ...mockDb.rewardPurchase,
                create: vi.fn().mockImplementation((...args: [unknown]) => mockDb.rewardPurchase.create(...args)),
              },
              coinTransaction: {
                ...mockDb.coinTransaction,
                create: vi.fn().mockImplementation((...args: [unknown]) => mockDb.coinTransaction.create(...args)),
              },
              challenge: {
                ...mockDb.challenge,
                findMany: vi.fn().mockImplementation((...args: [unknown]) => mockDb.challenge.findMany(...args)),
              },
            };
             
            return await callback(tx);
          }
          return Promise.all(callback);
        }
      ),
    } as unknown as PrismaClient;
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId ?? "auth-123", email: user.email ?? "test@example.com" },
    dbUser: user,
  });

  describe("getByTrip (protectedProcedure)", () => {
    it("should return rewards for trip participant", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
        group: mockGroup,
      });
      mockDb.reward.findMany.mockResolvedValue([mockReward]);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge({ basePoints: 100 })]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTrip({ tripId: "trip-123" });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("reward-123");
    });

    it("should calculate dynamic pricing based on total points", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
        group: mockGroup,
      });
      mockDb.reward.findMany.mockResolvedValue([
        createMockReward({ coinCost: 10 }), // 10% of total points
      ]);
      // Total available points = 100
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge({ basePoints: 100 })]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTrip({ tripId: "trip-123" });

      // 10% of 100 = 10 coins
      expect(result[0].coinCost).toBe(10);
      expect(result[0].originalCoinCost).toBe(10);
    });

    it("should return all trips rewards when tripId is 'all'", async () => {
      mockDb.reward.findMany.mockResolvedValue([mockReward]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await caller.getByTrip({ tripId: "all" });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isHidden: false },
        })
      );
    });

    it("should indicate if user can afford reward", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
        group: createMockGroup({ coins: 200 }),
      });
      mockDb.reward.findMany.mockResolvedValue([createMockReward({ coinCost: 50 })]);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTrip({ tripId: "trip-123" });

      expect(result[0].canAfford).toBe(true);
    });

    it("should indicate if user is group leader", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
        group: createMockGroup({ organizerId: "user-123" }),
      });
      mockDb.reward.findMany.mockResolvedValue([mockReward]);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTrip({ tripId: "trip-123" });

      expect(result[0].isEligibleToBuy).toBe(true);
    });

    it("should indicate out of stock", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
        group: mockGroup,
      });
      mockDb.reward.findMany.mockResolvedValue([createMockReward({ availableQuantity: 0 })]);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTrip({ tripId: "trip-123" });

      expect(result[0].isOutOfStock).toBe(true);
    });
  });

  describe("getByTripAdmin (moderatorProcedure)", () => {
    it("should return paginated rewards for admin", async () => {
      const rewardWithCount = createMockReward({ _count: { purchases: 5 } });
      mockDb.reward.findMany.mockResolvedValue([rewardWithCount]);
      mockDb.reward.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTripAdmin({ tripId: "trip-123" });

      expect(result.rewards).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("should respect pagination parameters", async () => {
      const rewardWithCount = createMockReward({ _count: { purchases: 5 } });
      mockDb.reward.findMany.mockResolvedValue([rewardWithCount]);
      mockDb.reward.count.mockResolvedValue(5);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTripAdmin({
        tripId: "trip-123",
        pagination: { limit: 1, offset: 0 },
      });

      expect(result.pagination.hasMore).toBe(true);
    });

    it("should not check affordability for admin view", async () => {
      const rewardWithCount = createMockReward({ _count: { purchases: 5 } });
      mockDb.reward.findMany.mockResolvedValue([rewardWithCount]);
      mockDb.reward.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByTripAdmin({ tripId: "trip-123" });

      expect(result.rewards[0].canAfford).toBe(false);
      expect(result.rewards[0].isEligibleToBuy).toBe(false);
    });
  });

  describe("getById (protectedProcedure)", () => {
    it("should return reward by id", async () => {
      const rewardWithCount = createMockReward({ _count: { purchases: 3 } });
      mockDb.reward.findUnique.mockResolvedValue(rewardWithCount);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "reward-123" });

      expect(result.id).toBe("reward-123");
      expect(result.purchasedCount).toBe(3);
    });

    it("should throw NOT_FOUND when reward does not exist", async () => {
      mockDb.reward.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "non-existent" })).rejects.toThrow(TRPCError);
    });

    it("should throw NOT_FOUND for hidden reward when not staff", async () => {
      mockDb.reward.findUnique.mockResolvedValue(createMockReward({ isHidden: true }));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "reward-123" })).rejects.toThrow(TRPCError);
    });

    it("should return hidden reward for staff", async () => {
      const rewardWithCount = createMockReward({ isHidden: true, _count: { purchases: 2 } });
      mockDb.reward.findUnique.mockResolvedValue(rewardWithCount);
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      // Override requireAuth to return moderator user for this test
      const { requireAuth } = await import("@mirai-app/auth");
       
      vi.mocked(requireAuth).mockResolvedValue({
        user: { id: mockModeratorUser.authUserId, email: mockModeratorUser.email },
        dbUser: mockModeratorUser,
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getById({ id: "reward-123" });

      expect(result.id).toBe("reward-123");
    });
  });

  describe("create (moderatorProcedure)", () => {
    it("should create reward", async () => {
      mockDb.reward.create.mockResolvedValue(mockReward);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

       
      const result = await caller.create({
        tripId: "trip-123",
        name: "New Reward",
        description: "Test description",
        availableQuantity: 10,
        coinCost: 50,
      });

      expect(result.name).toBe("Test Reward");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Reward",
            description: "Test description",
            availableQuantity: 10,
            coinCost: 50,
            tripId: "trip-123",
            createdById: mockModeratorUser.id,
          }),
        })
      );
    });

    it("should support images array", async () => {
      mockDb.reward.create.mockResolvedValue(
        createMockReward({ image: JSON.stringify(["image1.jpg", "image2.jpg"]) })
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await caller.create({
        tripId: "trip-123",
        name: "Reward with Images",
        description: "Test",
        availableQuantity: 10,
        images: ["image1.jpg", "image2.jpg"],
        coinCost: 50,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: JSON.stringify(["image1.jpg", "image2.jpg"]),
          }),
        })
      );
    });

    it("should support legacy single image", async () => {
      mockDb.reward.create.mockResolvedValue(createMockReward({ image: "image.jpg" }));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.create({
        tripId: "trip-123",
        name: "Reward with Image",
        description: "Test",
        availableQuantity: 10,
        image: "image.jpg",
        coinCost: 50,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: "image.jpg",
          }),
        })
      );
    });
  });

  describe("update (moderatorProcedure)", () => {
    it("should update reward", async () => {
      mockDb.reward.update.mockResolvedValue(
        createMockReward({ name: "Updated Reward" })
      );

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.update({
        id: "reward-123",
        name: "Updated Reward",
      });

      expect(result.name).toBe("Updated Reward");
    });

    it("should update images", async () => {
      mockDb.reward.update.mockResolvedValue(mockReward);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.update({
        id: "reward-123",
        images: ["new-image.jpg"],
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: "new-image.jpg",
          }),
        })
      );
    });

    it("should support setting image to null", async () => {
      mockDb.reward.update.mockResolvedValue(createMockReward({ image: null }));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.update({
        id: "reward-123",
        image: null,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            image: null,
          }),
        })
      );
    });
  });

  describe("setHidden (moderatorProcedure)", () => {
    it("should hide reward", async () => {
      mockDb.reward.update.mockResolvedValue(createMockReward({ isHidden: true }));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.setHidden({
        id: "reward-123",
        isHidden: true,
      });

      expect(result.isHidden).toBe(true);
    });

    it("should unhide reward", async () => {
      mockDb.reward.update.mockResolvedValue(createMockReward({ isHidden: false }));

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.setHidden({
        id: "reward-123",
        isHidden: false,
      });

      expect(result.isHidden).toBe(false);
    });
  });

  describe("delete (moderatorProcedure)", () => {
    it("should delete reward without purchases", async () => {
      mockDb.rewardPurchase.count.mockResolvedValue(0);
      mockDb.reward.delete.mockResolvedValue(mockReward);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.delete({ id: "reward-123" });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.delete).toHaveBeenCalledWith({
        where: { id: "reward-123" },
      });
    });

    it("should throw BAD_REQUEST when reward has purchases", async () => {
      mockDb.rewardPurchase.count.mockResolvedValue(5);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(caller.delete({ id: "reward-123" })).rejects.toThrow(TRPCError);
    });
  });

  describe("purchase (protectedProcedure)", () => {
    it("should purchase reward as group leader", async () => {
      const { ensureTripNotEnded } = await import("../../../utils/tripGuards");
       
      vi.mocked(ensureTripNotEnded).mockResolvedValue(undefined);

      mockDb.reward.findUnique.mockResolvedValue(mockReward);
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        group: createMockGroup({ coins: 200, organizerId: "user-123" }),
      });
      mockDb.reward.update.mockResolvedValue(createMockReward({ availableQuantity: 9 }));
      mockDb.group.update.mockResolvedValue(createMockGroup({ coins: 150 }));
      mockDb.rewardPurchase.create.mockResolvedValue(createMockRewardPurchase());
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.purchase({
        rewardId: "reward-123",
        quantity: 1,
      });

      expect(result.quantity).toBe(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.reward.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableQuantity: { decrement: 1 },
          }),
        })
      );
    });

    it("should throw NOT_FOUND when reward does not exist", async () => {
      mockDb.reward.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "non-existent",
          quantity: 1,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw BAD_REQUEST when reward is hidden", async () => {
      mockDb.reward.findUnique.mockResolvedValue(createMockReward({ isHidden: true }));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "reward-123",
          quantity: 1,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw BAD_REQUEST when not enough quantity", async () => {
      mockDb.reward.findUnique.mockResolvedValue(createMockReward({ availableQuantity: 0 }));

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "reward-123",
          quantity: 1,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw FORBIDDEN when not group leader", async () => {
      mockDb.reward.findUnique.mockResolvedValue(mockReward);
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        group: createMockGroup({ organizerId: "other-user" }),
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "reward-123",
          quantity: 1,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw BAD_REQUEST when not enough coins", async () => {
      mockDb.reward.findUnique.mockResolvedValue(mockReward);
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        group: createMockGroup({ coins: 10, organizerId: "user-123" }),
      });
      mockDb.challenge.findMany.mockResolvedValue([createMockChallenge()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "reward-123",
          quantity: 1,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getPurchaseHistory (protectedProcedure)", () => {
    it("should return purchase history for staff", async () => {
      mockDb.rewardPurchase.findMany.mockResolvedValue([createMockRewardPurchase()]);
      mockDb.rewardPurchase.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getPurchaseHistory({ tripId: "trip-123" });

      expect(result.purchases).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("should return only group purchases for regular user", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      mockDb.rewardPurchase.findMany.mockResolvedValue([createMockRewardPurchase()]);
      mockDb.rewardPurchase.count.mockResolvedValue(1);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await caller.getPurchaseHistory({ tripId: "trip-123" });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.rewardPurchase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: "group-123",
          }),
        })
      );
    });

    it("should throw FORBIDDEN when user has no group", async () => {
      mockDb.tripParticipant.findFirst.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(caller.getPurchaseHistory({ tripId: "trip-123" })).rejects.toThrow(TRPCError);
    });
  });

  describe("getTotalAvailablePoints (moderatorProcedure)", () => {
    it("should return total available points", async () => {
      mockDb.challenge.findMany.mockResolvedValue([
        createMockChallenge({ basePoints: 100, firstPlacePoints: 50, secondPlacePoints: 30, thirdPlacePoints: 20 }),
      ]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getTotalAvailablePoints({ tripId: "trip-123" });

      expect(result.totalPoints).toBe(200); // 100 + 50 + 30 + 20
    });

    it("should handle unlimited scoring category", async () => {
      mockDb.challenge.findMany.mockResolvedValue([
        createMockChallenge({ basePoints: 100, scoringCategory: "UNLIMITED", firstPlacePoints: 50 }),
      ]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getTotalAvailablePoints({ tripId: "trip-123" });

      expect(result.totalPoints).toBe(100); // Only base points for unlimited
    });
  });

  describe("Input validation", () => {
    it("should validate name is non-empty for create", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-123",
          name: "",
          description: "Test",
          availableQuantity: 10,
          coinCost: 50,
        })
      ).rejects.toThrow();
    });

    it("should validate description is non-empty for create", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-123",
          name: "Test",
          description: "",
          availableQuantity: 10,
          coinCost: 50,
        })
      ).rejects.toThrow();
    });

    it("should validate availableQuantity is non-negative", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-123",
          name: "Test",
          description: "Test",
          availableQuantity: -1,
          coinCost: 50,
        })
      ).rejects.toThrow();
    });

    it("should validate coinCost is at least 1", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-123",
          name: "Test",
          description: "Test",
          availableQuantity: 10,
          coinCost: 0,
        })
      ).rejects.toThrow();
    });

    it("should validate quantity is at least 1 for purchase", async () => {
      mockDb.reward.findUnique.mockResolvedValue(mockReward);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.purchase({
          rewardId: "reward-123",
          quantity: 0,
        })
      ).rejects.toThrow();
    });
  });
});
