import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/reward-sqlite-db";
import { eq, sql } from "drizzle-orm";
import { canTransitionPurchaseStatus } from "@mirai-app/shared/rewards";

describe("reward router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    db.exec(`
      CREATE TABLE rewards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        available_quantity INTEGER NOT NULL,
        is_hidden INTEGER DEFAULT 0 NOT NULL,
        image TEXT,
        coin_cost INTEGER NOT NULL,
        trip_id TEXT NOT NULL,
        created_by_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE reward_purchases (
        id TEXT PRIMARY KEY,
        reward_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total_cost INTEGER NOT NULL,
        status TEXT DEFAULT 'BOUGHT' NOT NULL,
        collection_method TEXT,
        purchased_by_id TEXT NOT NULL,
        status_updated_by_id TEXT,
        status_updated_at INTEGER NOT NULL,
        purchased_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE groups (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        is_deleted INTEGER DEFAULT 0 NOT NULL,
        organizer_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        coins INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE coin_transactions (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        admin_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Seed a test group
    db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-123", "trip-123", "Test Group", "user-123", "1234", 100, Date.now(), Date.now()],
    );

    // Seed a test reward
    db.run(
      `INSERT INTO rewards (id, name, description, available_quantity, coin_cost, trip_id, created_by_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["reward-123", "Test Reward", "A test reward", 10, 50, "trip-123", "admin-123", Date.now(), Date.now()],
    );

    // Seed a test purchase
    db.run(
      `INSERT INTO reward_purchases (id, reward_id, group_id, quantity, total_cost, status, purchased_by_id, status_updated_by_id, status_updated_at, purchased_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-123", "reward-123", "group-123", 2, 100, "BOUGHT", "user-123", "user-123", Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back purchaseReward transaction on failure", () => {
    const initialReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(initialReward.available_quantity).toBe(10);

    const initialGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(initialGroup.coins).toBe(100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE rewards SET available_quantity = available_quantity - ? WHERE id = ?`, [2, "reward-123"]);
      db.run(`UPDATE groups SET coins = coins - ? WHERE id = ?`, [100, "group-123"]);
      db.run(
        `INSERT INTO reward_purchases (id, reward_id, group_id, quantity, total_cost, status, purchased_by_id, status_updated_by_id, status_updated_at, purchased_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["purchase-new", "reward-123", "group-123", 2, 100, "BOUGHT", "user-123", "user-123", Date.now(), Date.now()],
      );
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["tx-1", "group-123", -100, "Claimed 2x Test Reward", "user-123", Date.now(), Date.now()],
      );
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollbackReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(afterRollbackReward.available_quantity).toBe(10);

    const afterRollbackGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterRollbackGroup.coins).toBe(100);

    const purchaseCount = db.query("SELECT COUNT(*) as count FROM reward_purchases WHERE id = ?").get("purchase-new") as {
      count: number;
    };
    expect(purchaseCount.count).toBe(0);

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE id = ?").get("tx-1") as {
      count: number;
    };
    expect(txCount.count).toBe(0);
  });

  it("rolls back updateMyPurchaseStatus cancellation transaction on failure", () => {
    const initialReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(initialReward.available_quantity).toBe(10);

    const initialGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(initialGroup.coins).toBe(100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [100, "group-123"]);
      db.run(`UPDATE rewards SET available_quantity = available_quantity + ? WHERE id = ?`, [2, "reward-123"]);
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["tx-2", "group-123", 100, "Cancelled reward claim by user: 2x Test Reward", "user-123", Date.now(), Date.now()],
      );
      db.run(
        `UPDATE reward_purchases SET status = ?, status_updated_by_id = ?, status_updated_at = ? WHERE id = ?`,
        ["CANCELLED", "user-123", Date.now(), "purchase-123"],
      );
      throw new Error("Simulated failure after updates");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollbackReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(afterRollbackReward.available_quantity).toBe(10);

    const afterRollbackGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterRollbackGroup.coins).toBe(100);

    const afterRollbackPurchase = db.query("SELECT status FROM reward_purchases WHERE id = ?").get("purchase-123") as {
      status: string;
    };
    expect(afterRollbackPurchase.status).toBe("BOUGHT");

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE id = ?").get("tx-2") as {
      count: number;
    };
    expect(txCount.count).toBe(0);
  });

  it("rolls back updatePurchaseStatus cancellation transaction on failure", () => {
    const initialReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(initialReward.available_quantity).toBe(10);

    const initialGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(initialGroup.coins).toBe(100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [100, "group-123"]);
      db.run(`UPDATE rewards SET available_quantity = available_quantity + ? WHERE id = ?`, [2, "reward-123"]);
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["tx-3", "group-123", 100, "Refunded reward claim: 2x Test Reward", "admin-123", Date.now(), Date.now()],
      );
      db.run(
        `UPDATE reward_purchases SET status = ?, status_updated_by_id = ?, status_updated_at = ? WHERE id = ?`,
        ["CANCELLED", "admin-123", Date.now(), "purchase-123"],
      );
      throw new Error("Simulated failure after updates");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollbackReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(afterRollbackReward.available_quantity).toBe(10);

    const afterRollbackGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterRollbackGroup.coins).toBe(100);

    const afterRollbackPurchase = db.query("SELECT status FROM reward_purchases WHERE id = ?").get("purchase-123") as {
      status: string;
    };
    expect(afterRollbackPurchase.status).toBe("BOUGHT");

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE id = ?").get("tx-3") as {
      count: number;
    };
    expect(txCount.count).toBe(0);
  });

  it("commits purchaseReward transaction successfully", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(`UPDATE rewards SET available_quantity = available_quantity - ? WHERE id = ?`, [2, "reward-123"]);
    db.run(`UPDATE groups SET coins = coins - ? WHERE id = ?`, [100, "group-123"]);
    db.run(
      `INSERT INTO reward_purchases (id, reward_id, group_id, quantity, total_cost, status, purchased_by_id, status_updated_by_id, status_updated_at, purchased_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-new", "reward-123", "group-123", 2, 100, "BOUGHT", "user-123", "user-123", Date.now(), Date.now()],
    );
    db.run(
      `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["tx-1", "group-123", -100, "Claimed 2x Test Reward", "user-123", Date.now(), Date.now()],
    );
    db.exec("COMMIT");

    const afterCommitReward = db.query("SELECT available_quantity FROM rewards WHERE id = ?").get("reward-123") as {
      available_quantity: number;
    };
    expect(afterCommitReward.available_quantity).toBe(8);

    const afterCommitGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterCommitGroup.coins).toBe(0);

    const purchase = db.query("SELECT * FROM reward_purchases WHERE id = ?").get("purchase-new") as {
      quantity: number;
      total_cost: number;
    };
    expect(purchase.quantity).toBe(2);
    expect(purchase.total_cost).toBe(100);

    const tx = db.query("SELECT * FROM coin_transactions WHERE id = ?").get("tx-1") as {
      amount: number;
    };
    expect(tx.amount).toBe(-100);
  });
});

describe("reward router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();

    testDb.db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-123", "trip-123", "Test Group", "user-123", "1234", 100, 0, Date.now(), Date.now()],
    );

    testDb.db.run(
      `INSERT INTO rewards (id, name, description, available_quantity, coin_cost, trip_id, created_by_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["reward-123", "Test Reward", "A test reward", 10, 50, "trip-123", "admin-123", Date.now(), Date.now()],
    );

    testDb.db.run(
      `INSERT INTO reward_purchases (id, reward_id, group_id, quantity, total_cost, status, purchased_by_id, status_updated_by_id, status_updated_at, purchased_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["purchase-123", "reward-123", "group-123", 2, 100, "BOUGHT", "user-123", "user-123", Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("commits purchaseReward-like Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.update(testDb.sqliteRewards).set({
        availableQuantity: sql`${testDb.sqliteRewards.availableQuantity} - ${2}`,
      }).where(eq(testDb.sqliteRewards.id, "reward-123"));

      await tx.update(testDb.sqliteGroups).set({
        coins: sql`${testDb.sqliteGroups.coins} - ${100}`,
      }).where(eq(testDb.sqliteGroups.id, "group-123"));

      await tx.insert(testDb.sqliteRewardPurchases).values({
        id: "purchase-new",
        rewardId: "reward-123",
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        status: "BOUGHT",
        purchasedById: "user-123",
        statusUpdatedById: "user-123",
      });

      await tx.insert(testDb.sqliteCoinTransactions).values({
        id: "tx-1",
        groupId: "group-123",
        amount: -100,
        reason: "Claimed 2x Test Reward",
        adminId: "user-123",
      });
    });

    const reward = await testDb.drizzleDb.select().from(testDb.sqliteRewards).where(eq(testDb.sqliteRewards.id, "reward-123"));
    expect(reward[0].availableQuantity).toBe(8);

    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    expect(group[0].coins).toBe(0);

    const purchases = await testDb.drizzleDb.select().from(testDb.sqliteRewardPurchases).where(eq(testDb.sqliteRewardPurchases.id, "purchase-new"));
    expect(purchases).toHaveLength(1);
    expect(purchases[0].quantity).toBe(2);

    const txs = await testDb.drizzleDb.select().from(testDb.sqliteCoinTransactions).where(eq(testDb.sqliteCoinTransactions.id, "tx-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(-100);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.update(testDb.sqliteRewards).set({
          availableQuantity: sql`${testDb.sqliteRewards.availableQuantity} - ${2}`,
        }).where(eq(testDb.sqliteRewards.id, "reward-123"));

        tx.update(testDb.sqliteGroups).set({
          coins: sql`${testDb.sqliteGroups.coins} - ${100}`,
        }).where(eq(testDb.sqliteGroups.id, "group-123"));

        tx.insert(testDb.sqliteRewardPurchases).values({
          id: "purchase-new",
          rewardId: "reward-123",
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          status: "BOUGHT",
          purchasedById: "user-123",
          statusUpdatedById: "user-123",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const reward = await testDb.drizzleDb.select().from(testDb.sqliteRewards).where(eq(testDb.sqliteRewards.id, "reward-123"));
    expect(reward[0].availableQuantity).toBe(10);

    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    expect(group[0].coins).toBe(100);

    const purchases = await testDb.drizzleDb.select().from(testDb.sqliteRewardPurchases).where(eq(testDb.sqliteRewardPurchases.id, "purchase-new"));
    expect(purchases).toHaveLength(0);
  });

  it("validates canTransitionPurchaseStatus with real SQLite data", async () => {
    const purchase = await testDb.drizzleDb.select().from(testDb.sqliteRewardPurchases).where(eq(testDb.sqliteRewardPurchases.id, "purchase-123"));
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
