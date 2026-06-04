import { coinTransactions, groups, trips, users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { checkCoinBalance, validateCoinTransaction } from "@mirai-app/shared/coins";
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

describe("coin router — real PGLite transaction rollback", () => {
  beforeEach(async () => {
    // Seed required foreign key references
    await testDb.db.insert(users).values({
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(trips).values({
      id: "trip-123",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
    // Seed a test group
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
  });

  it("rolls back group coin update on transaction failure", async () => {
    const initial = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(initial[0].coins).toBe(100);

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${50}`,
          })
          .where(eq(groups.id, "group-123"));
        // Simulate a failure inside the transaction
        throw new Error("Simulated failure after update");
      }),
    ).rejects.toThrow("Simulated failure after update");

    const afterRollback = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterRollback[0].coins).toBe(100);
  });

  it("rolls back both group and transaction record on failure", async () => {
    const initialGroup = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(initialGroup[0].coins).toBe(100);

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} - ${30}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx.insert(coinTransactions).values({
          id: "tx-1",
          groupId: "group-123",
          amount: -30,
          reason: "Penalty",
          adminId: "user-123",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure after inserts");
      }),
    ).rejects.toThrow("Simulated failure after inserts");

    const afterRollback = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterRollback[0].coins).toBe(100);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(0);
  });

  it("commits successfully when no failure occurs", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${50}`,
        })
        .where(eq(groups.id, "group-123"));

      await tx.insert(coinTransactions).values({
        id: "tx-2",
        groupId: "group-123",
        amount: 50,
        reason: "Bonus",
        adminId: "user-123",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const afterCommit = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-123"));
    expect(afterCommit[0].coins).toBe(150);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(1);
  });
});

describe("coin router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    await testDb.db.insert(users).values({
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(trips).values({
      id: "trip-123",
      name: "Test Trip",
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
  });

  it("adds coins via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${50}`,
        })
        .where(eq(groups.id, "group-123"));

      await tx.insert(coinTransactions).values({
        id: "tx-1",
        groupId: "group-123",
        amount: 50,
        reason: "Bonus",
        adminId: "user-123",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(group[0].coins).toBe(150);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(50);
  });

  it("removes coins via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} - ${30}`,
        })
        .where(eq(groups.id, "group-123"));

      await tx.insert(coinTransactions).values({
        id: "tx-2",
        groupId: "group-123",
        amount: -30,
        reason: "Penalty",
        adminId: "user-123",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(group[0].coins).toBe(70);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(-30);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({
            coins: sql`${groups.coins} + ${50}`,
          })
          .where(eq(groups.id, "group-123"));

        await tx.insert(coinTransactions).values({
          id: "tx-3",
          groupId: "group-123",
          amount: 50,
          reason: "Bonus",
          adminId: "user-123",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    expect(group[0].coins).toBe(100);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-123"));
    expect(txs).toHaveLength(0);
  });

  it("validates pure functions with real PGLite data", async () => {
    const group = await testDb.db.select().from(groups).where(eq(groups.id, "group-123"));
    const dbGroup = group[0];

    const valid = validateCoinTransaction(dbGroup, {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
    });
    expect(valid).toBeNull();

    const notFound = validateCoinTransaction(null, {
      tripId: "trip-123",
      groupId: "group-123",
      amount: 50,
    });
    expect(notFound).toEqual({ error: "NOT_FOUND", message: "Group not found" });

    const enough = checkCoinBalance(dbGroup, 50);
    expect(enough).toBeNull();

    const insufficient = checkCoinBalance(dbGroup, 150);
    expect(insufficient).toEqual({
      error: "BAD_REQUEST",
      message: "Group does not have enough coins",
    });
  });
});
