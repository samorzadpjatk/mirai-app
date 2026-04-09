import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  reward: {
    findMany: mock(() => Promise.resolve([])),
    findUnique: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  challenge: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
  },
  tripParticipant: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
  },
  group: {
    findFirst: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
  },
  rewardPurchase: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    count: mock(() => Promise.resolve(0)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
  },
  coinTransaction: {
    create: mock(() => Promise.resolve({})),
  },
  activityFeed: {
    findMany: mock(() => Promise.resolve([])),
  },
  groupRankingSnapshot: {
    findMany: mock(() => Promise.resolve([])),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-user-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
    storage: {
      from: mock().mockReturnValue({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/reward.jpg" },
          error: null,
        }),
      }),
    },
  };
};

describe("[INTEGRATION] reward router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}`, banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
  };

  const setupModeratorMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("getByTrip", () => {
    test("returns rewards for a trip", async () => {
      setupUserMocks();
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "LIMITED",
        },
      ]);
      mockCtx.db.reward.findMany.mockResolvedValueOnce([
        {
          id: "reward-1",
          name: "Reward A",
          coinCost: 10,
          availableQuantity: 5,
          isHidden: false,
          image: null,
          createdBy: { id: "user-1", firstName: "Admin" },
          _count: { purchases: 2 },
        },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        group: { id: "group-1", coins: 500, organizerId: "user-1" },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getByTrip({ tripId: "trip-1" });
      expect(result).toHaveLength(1);
      expect(result[0].canAfford).toBe(true);
      expect(result[0].isEligibleToBuy).toBe(true);
    });

    test("returns rewards for all trips", async () => {
      setupUserMocks();
      mockCtx.db.reward.findMany.mockResolvedValueOnce([
        {
          id: "reward-1",
          name: "Reward A",
          coinCost: 10,
          availableQuantity: 5,
          isHidden: false,
          image: null,
          _count: { purchases: 0 },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getByTrip({ tripId: "all" });
      expect(result).toHaveLength(1);
    });

    test("excludes hidden rewards for non-admin users", async () => {
      setupUserMocks();
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.reward.findMany.mockResolvedValueOnce([
        {
          id: "reward-1",
          name: "Visible Reward",
          coinCost: 10,
          availableQuantity: 5,
          isHidden: false,
          image: null,
          createdBy: { id: "user-1", firstName: "Admin" },
          _count: { purchases: 0 },
        },
      ]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getByTrip({ tripId: "trip-1" });
      expect(result).toHaveLength(1);
    });
  });

  describe("getByTripAdmin", () => {
    test("returns paginated rewards for admin", async () => {
      setupModeratorMocks();
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.reward.findMany.mockResolvedValueOnce([
        {
          id: "reward-1",
          name: "Reward A",
          coinCost: 10,
          availableQuantity: 5,
          image: null,
          _count: { purchases: 0 },
        },
      ]);
      mockCtx.db.reward.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getByTripAdmin({ tripId: "trip-1" });
      expect(result.rewards).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    test("returns all trips when tripId is all", async () => {
      setupModeratorMocks();
      mockCtx.db.reward.findMany.mockResolvedValueOnce([]);
      mockCtx.db.reward.count.mockResolvedValueOnce(0);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getByTripAdmin({ tripId: "all" });
      expect(result.rewards).toHaveLength(0);
    });
  });

  describe("getById", () => {
    test("returns reward by id", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        name: "Reward A",
        coinCost: 10,
        availableQuantity: 5,
        isHidden: false,
        tripId: "trip-1",
        image: null,
        createdBy: { id: "user-1", firstName: "Admin" },
        purchases: [],
        _count: { purchases: 0 },
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getById({ id: "reward-1" });
      expect(result.id).toBe("reward-1");
    });

    test("throws NOT_FOUND when reward does not exist", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.getById({ id: "nonexistent" }),
      ).rejects.toThrow(TRPCError);
    });

    test("hides reward from non-staff when hidden", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        name: "Hidden Reward",
        coinCost: 10,
        availableQuantity: 5,
        isHidden: true,
        tripId: "trip-1",
        image: null,
        createdBy: { id: "user-1", firstName: "Admin" },
        purchases: [],
        _count: { purchases: 0 },
      });
      const caller = createCaller(mockCtx);
      await expect(caller.reward.getById({ id: "reward-1" })).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("create", () => {
    test("moderator can create reward", async () => {
      setupModeratorMocks();
      mockCtx.db.reward.create.mockResolvedValueOnce({
        id: "reward-new",
        name: "New Reward",
        description: "Description",
        coinCost: 50,
        availableQuantity: 10,
        tripId: "trip-1",
        createdBy: { id: "user-1", firstName: "Moderator" },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.create({
        name: "New Reward",
        description: "Description",
        coinCost: 50,
        availableQuantity: 10,
        tripId: "trip-1",
      });
      expect(result.name).toBe("New Reward");
    });
  });

  describe("update", () => {
    test("moderator can update reward", async () => {
      setupModeratorMocks();
      mockCtx.db.reward.update.mockResolvedValueOnce({
        id: "reward-1",
        name: "Updated Reward",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.update({
        id: "reward-1",
        name: "Updated Reward",
      });
      expect(result.name).toBe("Updated Reward");
    });
  });

  describe("setHidden", () => {
    test("moderator can hide reward", async () => {
      setupModeratorMocks();
      mockCtx.db.reward.update.mockResolvedValueOnce({
        id: "reward-1",
        isHidden: true,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.setHidden({
        id: "reward-1",
        isHidden: true,
      });
      expect(result.isHidden).toBe(true);
    });
  });

  describe("delete", () => {
    test("moderator can delete reward without purchases", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.count.mockResolvedValueOnce(0);
      mockCtx.db.reward.delete.mockResolvedValueOnce({ id: "reward-1" });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.delete({ id: "reward-1" });
      expect(result.success).toBe(true);
    });

    test("throws error when deleting reward with purchases", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.count.mockResolvedValueOnce(5);
      const caller = createCaller(mockCtx);
      await expect(caller.reward.delete({ id: "reward-1" })).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("purchase", () => {
    test("organizer can purchase reward", async () => {
      setupUserMocks();
      mockCtx.db.trip = {
        findUnique: mock().mockResolvedValue({
          id: "trip-1",
          status: "ACTIVE",
        }),
      };
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        name: "Reward A",
        coinCost: 10,
        availableQuantity: 5,
        isHidden: false,
        tripId: "trip-1",
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        group: {
          id: "group-1",
          coins: 500,
          organizerId: "user-1",
          tripId: "trip-1",
        },
      });
      mockCtx.db.$transaction = mock().mockImplementation(async (cb) => {
        return cb({
          reward: {
            findUnique: mock().mockResolvedValue({
              id: "reward-1",
              name: "Reward A",
              coinCost: 10,
              availableQuantity: 5,
              isHidden: false,
              tripId: "trip-1",
            }),
            update: mock(),
          },
          group: { update: mock() },
          tripParticipant: {
            findFirst: mock().mockResolvedValue({
              group: {
                id: "group-1",
                coins: 500,
                organizerId: "user-1",
                tripId: "trip-1",
              },
            }),
          },
          challenge: { findMany: mock().mockResolvedValue([]) },
          trip: {
            findUnique: mock().mockResolvedValue({
              id: "trip-1",
              status: "ACTIVE",
            }),
          },
          rewardPurchase: {
            create: mock().mockResolvedValue({
              id: "purchase-1",
              reward: { name: "Reward A" },
              group: { name: "Group A" },
            }),
          },
          coinTransaction: { create: mock() },
        });
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.purchase({
        rewardId: "reward-1",
        quantity: 1,
      });
      expect(result).toBeDefined();
    });

    test("throws NOT_FOUND when reward does not exist", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.purchase({ rewardId: "nonexistent", quantity: 1 }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws FORBIDDEN when user is not organizer", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        coinCost: 10,
        availableQuantity: 5,
        isHidden: false,
        tripId: "trip-1",
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        group: {
          id: "group-1",
          coins: 500,
          organizerId: "user-2",
          tripId: "trip-1",
        },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.purchase({ rewardId: "reward-1", quantity: 1 }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when not enough coins", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        coinCost: 1000,
        availableQuantity: 5,
        isHidden: false,
        tripId: "trip-1",
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        group: {
          id: "group-1",
          coins: 10,
          organizerId: "user-1",
          tripId: "trip-1",
        },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.purchase({ rewardId: "reward-1", quantity: 1 }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when not enough quantity", async () => {
      setupUserMocks();
      mockCtx.db.reward.findUnique.mockResolvedValueOnce({
        id: "reward-1",
        coinCost: 10,
        availableQuantity: 0,
        isHidden: false,
        tripId: "trip-1",
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.purchase({ rewardId: "reward-1", quantity: 1 }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updateMyPurchaseStatus", () => {
    test("organizer can cancel own purchase", async () => {
      setupUserMocks();
      mockCtx.db.rewardPurchase.findUnique.mockResolvedValueOnce({
        id: "purchase-1",
        status: "BOUGHT",
        totalCost: 100,
        quantity: 1,
        group: { id: "group-1", organizerId: "user-1" },
        reward: { name: "Reward A" },
      });
      mockCtx.db.$transaction = mock().mockImplementation(async (cb) => {
        return cb({
          rewardPurchase: {
            findUnique: mock().mockResolvedValue({
              id: "purchase-1",
              status: "BOUGHT",
              totalCost: 100,
              quantity: 1,
              groupId: "group-1",
              rewardId: "reward-1",
              group: { id: "group-1", organizerId: "user-1" },
              reward: { name: "Reward A" },
            }),
            update: mock().mockResolvedValue({}),
          },
          group: { update: mock() },
          reward: { update: mock() },
          coinTransaction: { create: mock() },
        });
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.updateMyPurchaseStatus({
        purchaseId: "purchase-1",
        status: "CANCELLED",
      });
      expect(result).toBeDefined();
    });

    test("throws FORBIDDEN when not organizer", async () => {
      setupUserMocks();
      mockCtx.db.rewardPurchase.findUnique.mockResolvedValueOnce({
        id: "purchase-1",
        status: "BOUGHT",
        group: { id: "group-1", organizerId: "user-2" },
        reward: { name: "Reward A" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.updateMyPurchaseStatus({
          purchaseId: "purchase-1",
          status: "CANCELLED",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updatePurchaseStatus", () => {
    test("moderator can update purchase status", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.findUnique.mockResolvedValueOnce({
        id: "purchase-1",
        status: "BOUGHT",
        totalCost: 100,
        quantity: 1,
        group: { id: "group-1", name: "Group A", coins: 500 },
        reward: { name: "Reward A" },
      });
      mockCtx.db.$transaction = mock().mockImplementation(async (cb) => {
        return cb({
          rewardPurchase: {
            findUnique: mock().mockResolvedValue({
              id: "purchase-1",
              status: "BOUGHT",
              totalCost: 100,
              quantity: 1,
              groupId: "group-1",
              rewardId: "reward-1",
              group: { id: "group-1", name: "Group A", coins: 500 },
              reward: { name: "Reward A" },
            }),
            update: mock().mockResolvedValue({
              id: "purchase-1",
              status: "ACCEPTED",
            }),
          },
          group: { update: mock() },
          reward: { update: mock() },
          coinTransaction: { create: mock() },
        });
      });
      const caller = createCaller(mockCtx);
      const result = await caller.reward.updatePurchaseStatus({
        purchaseId: "purchase-1",
        status: "ACCEPTED",
        collectionMethod: "Pickup at office",
      });
      expect(result.status).toBe("ACCEPTED");
    });

    test("throws BAD_REQUEST for invalid status transition", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.findUnique.mockResolvedValueOnce({
        id: "purchase-1",
        status: "DELIVERED",
        totalCost: 100,
        quantity: 1,
        group: { id: "group-1", name: "Group A", coins: 500 },
        reward: { name: "Reward A" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.updatePurchaseStatus({
          purchaseId: "purchase-1",
          status: "ACCEPTED",
          collectionMethod: "Pickup",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when collection method missing for ACCEPTED", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.findUnique.mockResolvedValueOnce({
        id: "purchase-1",
        status: "BOUGHT",
        totalCost: 100,
        quantity: 1,
        group: { id: "group-1", name: "Group A", coins: 500 },
        reward: { name: "Reward A" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.reward.updatePurchaseStatus({
          purchaseId: "purchase-1",
          status: "ACCEPTED",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getPurchaseHistory", () => {
    test("returns purchase history for trip", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.rewardPurchase.findMany.mockResolvedValueOnce([
        {
          id: "purchase-1",
          reward: { name: "Reward A" },
          group: { name: "Group A" },
        },
      ]);
      mockCtx.db.rewardPurchase.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getPurchaseHistory({
        tripId: "trip-1",
      });
      expect(result.purchases).toHaveLength(1);
    });

    test("staff can see all purchases", async () => {
      setupModeratorMocks();
      mockCtx.db.rewardPurchase.findMany.mockResolvedValueOnce([
        { id: "purchase-1", group: { name: "Group A" } },
      ]);
      mockCtx.db.rewardPurchase.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getPurchaseHistory({
        tripId: "trip-1",
      });
      expect(result.purchases).toHaveLength(1);
    });
  });

  describe("getTotalAvailablePoints", () => {
    test("returns total points for trip", async () => {
      setupModeratorMocks();
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([
        {
          basePoints: 100,
          firstPlacePoints: 50,
          secondPlacePoints: 30,
          thirdPlacePoints: 20,
          scoringCategory: "LIMITED",
        },
        {
          basePoints: 200,
          firstPlacePoints: 0,
          secondPlacePoints: 0,
          thirdPlacePoints: 0,
          scoringCategory: "UNLIMITED",
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.reward.getTotalAvailablePoints({
        tripId: "trip-1",
      });
      expect(result.totalPoints).toBe(400);
    });
  });
});
