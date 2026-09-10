import { canTransitionPurchaseStatus } from "@mirai-app/common/rewards";
import {
  coinTransactions,
  groups,
  rewardPurchases,
  rewards,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { getPurchaseHistory, getPurchaseHistoryAdmin } from "../reward/queries";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

describe("reward router — PGLite transaction rollback", () => {
  beforeEach(async () => {
    // Seed required parent tables
    await testDb.db.insert(users).values([
      {
        id: "user-123",
        authUserId: "auth-123",
        firstName: "Test",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "admin-123",
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(trips).values({
      id: "trip-123",
      name: "Test Trip",
      description: "A test trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-123",
      tripId: "trip-123",
      name: "Test Group",
      description: "",
      organizerId: "user-123",
      code: "1234",
      coins: 100,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(rewards).values({
      id: "reward-123",
      name: "Test Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCost: 50,
      tripId: "trip-123",
      createdById: "admin-123",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(rewardPurchases).values({
      id: "purchase-123",
      rewardId: "reward-123",
      groupId: "group-123",
      quantity: 2,
      totalCost: 100,
      status: "BOUGHT",
      purchasedById: "user-123",
      statusUpdatedById: "user-123",
      statusUpdatedAt: now(),
      purchasedAt: now(),
    });
  });

  it("rolls back purchaseReward transaction on failure", async () => {
    const initialReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(initialReward[0].availableQuantity).toBe(10);

    const initialGroup = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(initialGroup[0].coins).toBe(100);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(rewards)
          .set({
            availableQuantity: sql`${rewards.availableQuantity} - ${2}`,
          })
          .where(eq(rewards.id, "reward-123"));

        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} - ${100}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx.insert(rewardPurchases).values({
          id: "purchase-new",
          rewardId: "reward-123",
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          status: "BOUGHT",
          purchasedById: "user-123",
          statusUpdatedById: "user-123",
          statusUpdatedAt: now(),
          purchasedAt: now(),
        });

        await tx.insert(coinTransactions).values({
          id: "tx-1",
          groupId: "group-123",
          amount: -100,
          reason: "Claimed 2x Test Reward",
          adminId: "user-123",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure after inserts");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRollbackReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(afterRollbackReward[0].availableQuantity).toBe(10);

    const afterRollbackGroup = await testDb.db
      .select()
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterRollbackGroup[0].coins).toBe(100);

    const purchaseCount = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-new"));
    expect(purchaseCount).toHaveLength(0);

    const txCount = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, "tx-1"));
    expect(txCount).toHaveLength(0);
  });

  it("rolls back updateMyPurchaseStatus cancellation transaction on failure", async () => {
    const initialReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(initialReward[0].availableQuantity).toBe(10);

    const initialGroup = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(initialGroup[0].coins).toBe(100);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${100}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx
          .update(rewards)
          .set({
            availableQuantity: sql`${rewards.availableQuantity} + ${2}`,
          })
          .where(eq(rewards.id, "reward-123"));

        await tx.insert(coinTransactions).values({
          id: "tx-2",
          groupId: "group-123",
          amount: 100,
          reason: "Cancelled reward claim by user: 2x Test Reward",
          adminId: "user-123",
          createdAt: now(),
          updatedAt: now(),
        });

        await tx
          .update(rewardPurchases)
          .set({
            status: "CANCELLED",
            statusUpdatedById: "user-123",
            statusUpdatedAt: now(),
          })
          .where(eq(rewardPurchases.id, "purchase-123"));

        throw new Error("Simulated failure after updates");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRollbackReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(afterRollbackReward[0].availableQuantity).toBe(10);

    const afterRollbackGroup = await testDb.db
      .select()
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterRollbackGroup[0].coins).toBe(100);

    const afterRollbackPurchase = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-123"));
    expect(afterRollbackPurchase[0].status).toBe("BOUGHT");

    const txCount = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, "tx-2"));
    expect(txCount).toHaveLength(0);
  });

  it("rolls back updatePurchaseStatus cancellation transaction on failure", async () => {
    const initialReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(initialReward[0].availableQuantity).toBe(10);

    const initialGroup = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(initialGroup[0].coins).toBe(100);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${100}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx
          .update(rewards)
          .set({
            availableQuantity: sql`${rewards.availableQuantity} + ${2}`,
          })
          .where(eq(rewards.id, "reward-123"));

        await tx.insert(coinTransactions).values({
          id: "tx-3",
          groupId: "group-123",
          amount: 100,
          reason: "Refunded reward claim: 2x Test Reward",
          adminId: "admin-123",
          createdAt: now(),
          updatedAt: now(),
        });

        await tx
          .update(rewardPurchases)
          .set({
            status: "CANCELLED",
            statusUpdatedById: "admin-123",
            statusUpdatedAt: now(),
          })
          .where(eq(rewardPurchases.id, "purchase-123"));

        throw new Error("Simulated failure after updates");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRollbackReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(afterRollbackReward[0].availableQuantity).toBe(10);

    const afterRollbackGroup = await testDb.db
      .select()
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterRollbackGroup[0].coins).toBe(100);

    const afterRollbackPurchase = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-123"));
    expect(afterRollbackPurchase[0].status).toBe("BOUGHT");

    const txCount = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, "tx-3"));
    expect(txCount).toHaveLength(0);
  });

  it("commits purchaseReward transaction successfully", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(rewards)
        .set({
          availableQuantity: sql`${rewards.availableQuantity} - ${2}`,
        })
        .where(eq(rewards.id, "reward-123"));

      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} - ${100}`,
        })
        .where(eq(groups.id, "group-123"));

      await tx.insert(rewardPurchases).values({
        id: "purchase-new",
        rewardId: "reward-123",
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        status: "BOUGHT",
        purchasedById: "user-123",
        statusUpdatedById: "user-123",
        statusUpdatedAt: now(),
        purchasedAt: now(),
      });

      await tx.insert(coinTransactions).values({
        id: "tx-1",
        groupId: "group-123",
        amount: -100,
        reason: "Claimed 2x Test Reward",
        adminId: "user-123",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const afterCommitReward = await testDb.db
      .select()
      .from(rewards)
      .where(eq(rewards.id, "reward-123"));
    expect(afterCommitReward[0].availableQuantity).toBe(8);

    const afterCommitGroup = await testDb.db
      .select()
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterCommitGroup[0].coins).toBe(0);

    const purchase = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-new"));
    expect(purchase[0].quantity).toBe(2);
    expect(purchase[0].totalCost).toBe(100);

    const tx = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, "tx-1"));
    expect(tx[0].amount).toBe(-100);
  });
});

describe("reward router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    // Seed required parent tables
    await testDb.db.insert(users).values([
      {
        id: "user-123",
        authUserId: "auth-123",
        firstName: "Test",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "admin-123",
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(trips).values({
      id: "trip-123",
      name: "Test Trip",
      description: "A test trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-123",
      tripId: "trip-123",
      name: "Test Group",
      description: "",
      organizerId: "user-123",
      code: "1234",
      coins: 100,
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(rewards).values({
      id: "reward-123",
      name: "Test Reward",
      description: "A test reward",
      availableQuantity: 10,
      coinCost: 50,
      tripId: "trip-123",
      createdById: "admin-123",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(rewardPurchases).values({
      id: "purchase-123",
      rewardId: "reward-123",
      groupId: "group-123",
      quantity: 2,
      totalCost: 100,
      status: "BOUGHT",
      purchasedById: "user-123",
      statusUpdatedById: "user-123",
      statusUpdatedAt: now(),
      purchasedAt: now(),
    });
  });

  it("commits purchaseReward-like Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(rewards)
        .set({
          availableQuantity: sql`${rewards.availableQuantity} - ${2}`,
        })
        .where(eq(rewards.id, "reward-123"));

      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} - ${100}`,
        })
        .where(eq(groups.id, "group-123"));

      await tx.insert(rewardPurchases).values({
        id: "purchase-new",
        rewardId: "reward-123",
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        status: "BOUGHT",
        purchasedById: "user-123",
        statusUpdatedById: "user-123",
        statusUpdatedAt: now(),
        purchasedAt: now(),
      });

      await tx.insert(coinTransactions).values({
        id: "tx-1",
        groupId: "group-123",
        amount: -100,
        reason: "Claimed 2x Test Reward",
        adminId: "user-123",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const reward = await testDb.db.select().from(rewards).where(eq(rewards.id, "reward-123"));
    expect(reward[0].availableQuantity).toBe(8);

    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(group[0].coins).toBe(0);

    const purchases = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-new"));
    expect(purchases).toHaveLength(1);
    expect(purchases[0].quantity).toBe(2);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.id, "tx-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(-100);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(rewards)
          .set({
            availableQuantity: sql`${rewards.availableQuantity} - ${2}`,
          })
          .where(eq(rewards.id, "reward-123"));

        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} - ${100}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx.insert(rewardPurchases).values({
          id: "purchase-new",
          rewardId: "reward-123",
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          status: "BOUGHT",
          purchasedById: "user-123",
          statusUpdatedById: "user-123",
          statusUpdatedAt: now(),
          purchasedAt: now(),
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const reward = await testDb.db.select().from(rewards).where(eq(rewards.id, "reward-123"));
    expect(reward[0].availableQuantity).toBe(10);

    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(group[0].coins).toBe(100);

    const purchases = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-new"));
    expect(purchases).toHaveLength(0);
  });

  it("validates canTransitionPurchaseStatus with real PGLite data", async () => {
    const purchase = await testDb.db
      .select()
      .from(rewardPurchases)
      .where(eq(rewardPurchases.id, "purchase-123"));
    const dbPurchase = purchase[0];

    const status = dbPurchase.status as RewardPurchaseStatus;
    expect(canTransitionPurchaseStatus(status, "ACCEPTED")).toBe(true);
    expect(canTransitionPurchaseStatus(status, "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus(status, "DELIVERED")).toBe(false);
    expect(canTransitionPurchaseStatus(status, "BOUGHT")).toBe(true);

    expect(canTransitionPurchaseStatus("ACCEPTED", "IN_DELIVERY")).toBe(true);
    expect(canTransitionPurchaseStatus("ACCEPTED", "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "DELIVERED")).toBe(true);
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus("CANCELLED", "BOUGHT")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "BOUGHT")).toBe(false);
  });
});

describe("reward/queries — getPurchaseHistory scoping", () => {
  // In production `requireAuth` puts the whole user row on the context, so the
  // caller's role is always present. The staff cases below must pass their real
  // role: a context without one silently passes against the old role-branching
  // implementation and proves nothing (issue #16).
  const historyContext = (userId: string, role: "USER" | "ADMIN" | "MODERATOR" = "USER") => ({
    db: testDb.db,
    dbUser: { id: userId, role },
  });

  beforeEach(async () => {
    await testDb.db.insert(users).values([
      {
        id: "user-a",
        authUserId: "auth-user-a",
        firstName: "Ann",
        lastName: "Alpha",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "user-b",
        authUserId: "auth-user-b",
        firstName: "Bob",
        lastName: "Beta",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "admin-a",
        authUserId: "auth-admin-a",
        firstName: "Ada",
        lastName: "Admin",
        role: "ADMIN",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "mod-b",
        authUserId: "auth-mod-b",
        firstName: "Mia",
        lastName: "Mod",
        role: "MODERATOR",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "outsider",
        authUserId: "auth-outsider",
        firstName: "Otto",
        lastName: "Outside",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(trips).values([
      {
        id: "trip-1",
        name: "Trip One",
        description: "",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-07"),
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "trip-empty",
        name: "Trip Without Rewards",
        description: "",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-07"),
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "trip-other",
        name: "Other Trip",
        description: "",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-07"),
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(groups).values([
      {
        id: "group-a",
        tripId: "trip-1",
        name: "Group A",
        description: "",
        organizerId: "user-a",
        code: "AAAA",
        coins: 500,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "group-b",
        tripId: "trip-1",
        name: "Group B",
        description: "",
        organizerId: "user-b",
        code: "BBBB",
        coins: 500,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "group-empty",
        tripId: "trip-empty",
        name: "Group Empty",
        description: "",
        organizerId: "user-a",
        code: "EEEE",
        coins: 500,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "group-other",
        tripId: "trip-other",
        name: "Group Other",
        description: "",
        organizerId: "user-b",
        code: "OOOO",
        coins: 500,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(tripParticipants).values([
      {
        id: "tp-user-a",
        userId: "user-a",
        tripId: "trip-1",
        groupId: "group-a",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "tp-user-b",
        userId: "user-b",
        tripId: "trip-1",
        groupId: "group-b",
        createdAt: now(),
        updatedAt: now(),
      },
      // The admin participates in group A, exactly like any other traveller.
      {
        id: "tp-admin-a",
        userId: "admin-a",
        tripId: "trip-1",
        groupId: "group-a",
        createdAt: now(),
        updatedAt: now(),
      },
      // The moderator travels with group B.
      {
        id: "tp-mod-b",
        userId: "mod-b",
        tripId: "trip-1",
        groupId: "group-b",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "tp-user-a-empty",
        userId: "user-a",
        tripId: "trip-empty",
        groupId: "group-empty",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "tp-admin-a-empty",
        userId: "admin-a",
        tripId: "trip-empty",
        groupId: "group-empty",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(rewards).values([
      {
        id: "reward-1",
        name: "Trip One Reward",
        description: "",
        availableQuantity: 10,
        coinCost: 50,
        tripId: "trip-1",
        createdById: "admin-a",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "reward-other",
        name: "Other Trip Reward",
        description: "",
        availableQuantity: 10,
        coinCost: 50,
        tripId: "trip-other",
        createdById: "admin-a",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    await testDb.db.insert(rewardPurchases).values([
      {
        id: "purchase-a",
        rewardId: "reward-1",
        groupId: "group-a",
        quantity: 1,
        totalCost: 50,
        status: "BOUGHT",
        purchasedById: "user-a",
        statusUpdatedById: "user-a",
        statusUpdatedAt: now(),
        purchasedAt: new Date("2025-06-02T10:00:00Z"),
      },
      {
        id: "purchase-b",
        rewardId: "reward-1",
        groupId: "group-b",
        quantity: 2,
        totalCost: 100,
        status: "BOUGHT",
        purchasedById: "user-b",
        statusUpdatedById: "user-b",
        statusUpdatedAt: now(),
        purchasedAt: new Date("2025-06-03T10:00:00Z"),
      },
      {
        id: "purchase-other-trip",
        rewardId: "reward-other",
        groupId: "group-other",
        quantity: 1,
        totalCost: 50,
        status: "BOUGHT",
        purchasedById: "user-b",
        statusUpdatedById: "user-b",
        statusUpdatedAt: now(),
        purchasedAt: new Date("2025-08-02T10:00:00Z"),
      },
    ]);
  });

  it("scopes a USER participant to their own group", async () => {
    const result = await getPurchaseHistory(historyContext("user-a"), { tripId: "trip-1" });

    expect(result.purchases.map((p) => p.id)).toEqual(["purchase-a"]);
    expect(result.pagination.total).toBe(1);
  });

  it("scopes an ADMIN participant to their own group too", async () => {
    // Regression for issue #16: cross-group visibility is a property of the
    // admin endpoint, never of the caller's role. The context carries role
    // "ADMIN" precisely so that the old `isStaff` shortcut would leak
    // purchase-b here and fail this assertion.
    const result = await getPurchaseHistory(historyContext("admin-a", "ADMIN"), {
      tripId: "trip-1",
    });

    expect(result.purchases.map((p) => p.id)).toEqual(["purchase-a"]);
    expect(result.purchases.every((p) => p.groupId === "group-a")).toBe(true);
    expect(result.pagination.total).toBe(1);
  });

  it("scopes a MODERATOR participant to their own group too", async () => {
    // Same regression as above for the second staff role the old `isStaff`
    // shortcut covered.
    const result = await getPurchaseHistory(historyContext("mod-b", "MODERATOR"), {
      tripId: "trip-1",
    });

    expect(result.purchases.map((p) => p.id)).toEqual(["purchase-b"]);
    expect(result.purchases.every((p) => p.groupId === "group-b")).toBe(true);
    expect(result.pagination.total).toBe(1);
  });

  it("returns an empty page for a trip with no rewards instead of the whole table", async () => {
    // Regression for issue #16b: an undefined Drizzle where clause means
    // "no filter", which leaked every purchase in the database.
    const result = await getPurchaseHistory(historyContext("user-a"), { tripId: "trip-empty" });

    expect(result.purchases).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("returns an empty page for a staff caller on a trip with no rewards", async () => {
    // Issues #16 and #16b at once: the old code skipped the group lookup for
    // staff and then collapsed the where clause to undefined, handing an admin
    // every purchase in the database.
    const result = await getPurchaseHistory(historyContext("admin-a", "ADMIN"), {
      tripId: "trip-empty",
    });

    expect(result.purchases).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("rejects a caller who does not participate in the trip", async () => {
    await expect(
      getPurchaseHistory(historyContext("outsider"), { tripId: "trip-1" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an ADMIN who does not participate in the trip", async () => {
    await expect(
      getPurchaseHistory(historyContext("admin-a", "ADMIN"), { tripId: "trip-other" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects the pseudo trip id 'all' on the user-facing endpoint", async () => {
    await expect(
      getPurchaseHistory(historyContext("admin-a", "ADMIN"), { tripId: "all" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns every group's purchases through the admin endpoint", async () => {
    const result = await getPurchaseHistoryAdmin({ db: testDb.db }, { tripId: "trip-1" });

    expect(result.purchases.map((p) => p.id).sort()).toEqual(["purchase-a", "purchase-b"]);
    expect(result.pagination.total).toBe(2);
  });

  it("keeps the admin endpoint scoped to the requested trip", async () => {
    const result = await getPurchaseHistoryAdmin({ db: testDb.db }, { tripId: "trip-1" });

    expect(result.purchases.map((p) => p.id)).not.toContain("purchase-other-trip");
  });

  it("returns an empty page from the admin endpoint for a trip with no rewards", async () => {
    const result = await getPurchaseHistoryAdmin({ db: testDb.db }, { tripId: "trip-empty" });

    expect(result.purchases).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("treats tripId 'all' on the admin endpoint as every trip", async () => {
    const result = await getPurchaseHistoryAdmin({ db: testDb.db }, { tripId: "all" });

    expect(result.purchases.map((p) => p.id).sort()).toEqual([
      "purchase-a",
      "purchase-b",
      "purchase-other-trip",
    ]);
    expect(result.pagination.total).toBe(3);
  });

  it("paginates the scoped user history", async () => {
    await testDb.db.insert(rewardPurchases).values({
      id: "purchase-a2",
      rewardId: "reward-1",
      groupId: "group-a",
      quantity: 1,
      totalCost: 50,
      status: "BOUGHT",
      purchasedById: "user-a",
      statusUpdatedById: "user-a",
      statusUpdatedAt: now(),
      purchasedAt: new Date("2025-06-04T10:00:00Z"),
    });

    const firstPage = await getPurchaseHistory(historyContext("user-a"), {
      tripId: "trip-1",
      pagination: { limit: 1, offset: 0 },
    });

    expect(firstPage.purchases.map((p) => p.id)).toEqual(["purchase-a2"]);
    expect(firstPage.pagination.total).toBe(2);
    expect(firstPage.pagination.hasMore).toBe(true);

    const secondPage = await getPurchaseHistory(historyContext("user-a"), {
      tripId: "trip-1",
      pagination: { limit: 1, offset: 1 },
    });

    expect(secondPage.purchases.map((p) => p.id)).toEqual(["purchase-a"]);
    expect(secondPage.pagination.hasMore).toBe(false);
  });
});
