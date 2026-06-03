import { coinTransactions, groups, rewardPurchases, rewards, trips, users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { canTransitionPurchaseStatus } from "@mirai-app/shared/rewards";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

    expect(canTransitionPurchaseStatus(dbPurchase.status as any, "ACCEPTED")).toBe(true);
    expect(canTransitionPurchaseStatus(dbPurchase.status as any, "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus(dbPurchase.status as any, "DELIVERED")).toBe(false);
    expect(canTransitionPurchaseStatus(dbPurchase.status as any, "BOUGHT")).toBe(true);

    expect(canTransitionPurchaseStatus("ACCEPTED", "IN_DELIVERY")).toBe(true);
    expect(canTransitionPurchaseStatus("ACCEPTED", "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "DELIVERED")).toBe(true);
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "CANCELLED")).toBe(true);
    expect(canTransitionPurchaseStatus("CANCELLED", "BOUGHT")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "BOUGHT")).toBe(false);
  });
});
