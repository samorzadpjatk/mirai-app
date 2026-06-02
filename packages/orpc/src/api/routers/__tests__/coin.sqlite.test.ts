import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/coin-sqlite-db";
import { eq, sql } from "drizzle-orm";
import { validateCoinTransaction, checkCoinBalance } from "@mirai-app/shared";

describe("coin router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    // Create a minimal groups table matching the schema shape
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    // Create a minimal coin_transactions table
    db.exec(`
      CREATE TABLE coin_transactions (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        admin_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    // Seed a test group
    db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins) VALUES (?, ?, ?, ?, ?, ?)`,
      ["group-123", "trip-123", "Test Group", "user-123", "1234", 100],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back group coin update on transaction failure", () => {
    const initial = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(initial.coins).toBe(100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [50, "group-123"]);
      // Simulate a failure inside the transaction
      throw new Error("Simulated failure after update");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterRollback.coins).toBe(100);
  });

  it("rolls back both group and transaction record on failure", () => {
    const initialGroup = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(initialGroup.coins).toBe(100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE groups SET coins = coins - ? WHERE id = ?`, [30, "group-123"]);
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id) VALUES (?, ?, ?, ?, ?)`,
        ["tx-1", "group-123", -30, "Penalty", "admin-123"],
      );
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterRollback.coins).toBe(100);

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?").get(
      "group-123",
    ) as { count: number };
    expect(txCount.count).toBe(0);
  });

  it("commits successfully when no failure occurs", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [50, "group-123"]);
    db.run(
      `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id) VALUES (?, ?, ?, ?, ?)`,
      ["tx-2", "group-123", 50, "Bonus", "admin-123"],
    );
    db.exec("COMMIT");

    const afterCommit = db.query("SELECT coins FROM groups WHERE id = ?").get("group-123") as {
      coins: number;
    };
    expect(afterCommit.coins).toBe(150);

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?").get(
      "group-123",
    ) as { count: number };
    expect(txCount.count).toBe(1);
  });
});

describe("coin router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-123", "trip-123", "Test Group", "user-123", "1234", 100, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("adds coins via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.update(testDb.sqliteGroups).set({
        coins: sql`${testDb.sqliteGroups.coins} + ${50}`,
      }).where(eq(testDb.sqliteGroups.id, "group-123"));

      await tx.insert(testDb.sqliteCoinTransactions).values({
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Bonus",
        adminId: "admin-123",
      });
    });

    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    expect(group[0].coins).toBe(150);

    const txs = await testDb.drizzleDb.select().from(testDb.sqliteCoinTransactions).where(eq(testDb.sqliteCoinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(50);
  });

  it("removes coins via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.update(testDb.sqliteGroups).set({
        coins: sql`${testDb.sqliteGroups.coins} - ${30}`,
      }).where(eq(testDb.sqliteGroups.id, "group-123"));

      await tx.insert(testDb.sqliteCoinTransactions).values({
        id: "tx-2",
        groupId: "group-123",
        amount: -30,
        reason: "Penalty",
        adminId: "admin-123",
      });
    });

    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    expect(group[0].coins).toBe(70);

    const txs = await testDb.drizzleDb.select().from(testDb.sqliteCoinTransactions).where(eq(testDb.sqliteCoinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(-30);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.update(testDb.sqliteGroups).set({
          coins: sql`${testDb.sqliteGroups.coins} + ${50}`,
        }).where(eq(testDb.sqliteGroups.id, "group-123"));

        tx.insert(testDb.sqliteCoinTransactions).values({
          id: "tx-3",
          groupId: "group-123",
          amount: 50,
          reason: "Bonus",
          adminId: "admin-123",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    expect(group[0].coins).toBe(100);

    const txs = await testDb.drizzleDb.select().from(testDb.sqliteCoinTransactions).where(eq(testDb.sqliteCoinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(0);
  });

  it("validates pure functions with real SQLite data", async () => {
    const group = await testDb.drizzleDb.select().from(testDb.sqliteGroups).where(eq(testDb.sqliteGroups.id, "group-123"));
    const dbGroup = group[0];

    const valid = validateCoinTransaction(dbGroup as any, { tripId: "trip-123", groupId: "group-123", amount: 50 });
    expect(valid).toBeNull();

    const notFound = validateCoinTransaction(null, { tripId: "trip-123", groupId: "group-123", amount: 50 });
    expect(notFound).toEqual({ error: "NOT_FOUND", message: "Group not found" });

    const enough = checkCoinBalance(dbGroup as any, 50);
    expect(enough).toBeNull();

    const insufficient = checkCoinBalance(dbGroup as any, 150);
    expect(insufficient).toEqual({ error: "BAD_REQUEST", message: "Group does not have enough coins" });
  });
});
