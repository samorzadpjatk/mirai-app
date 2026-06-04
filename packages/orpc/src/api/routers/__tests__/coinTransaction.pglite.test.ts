import { coinTransactions, groups, tripParticipants, trips, users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { and, count, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  getAdditionalInsights,
  getAll,
  getCoinTransactions,
  getMostActiveAdminStats,
  getQuickStats,
  getStatistics,
} from "../coinTransaction/queries";

describe("coinTransaction router — PGLite integration", () => {
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

  async function seedUser(
    id: string,
    authUserId: string,
    firstName: string,
    lastName: string,
    role = "USER",
  ) {
    await testDb.db
      .insert(users)
      .values({ id, authUserId, firstName, lastName, role, createdAt: now(), updatedAt: now() });
  }

  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    name: string,
    organizerId: string,
    code: string,
  ) {
    await testDb.db
      .insert(groups)
      .values({ id, tripId, name, organizerId, code, createdAt: now(), updatedAt: now() });
  }

  async function seedCoinTransaction(
    id: string,
    groupId: string,
    amount: number,
    adminId: string,
    reason?: string,
  ) {
    await testDb.db
      .insert(coinTransactions)
      .values({ id, groupId, amount, adminId, reason, createdAt: now(), updatedAt: now() });
  }

  async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
    await testDb.db
      .insert(tripParticipants)
      .values({ id, userId, tripId, groupId, createdAt: now(), updatedAt: now() });
  }

  async function seedBaseData() {
    await seedUser("admin-1", "auth-1", "Alice", "Smith", "MODERATOR");
    await seedUser("admin-2", "auth-2", "Bob", "Jones", "MODERATOR");
    await seedUser("user-1", "auth-3", "Charlie", "Brown", "USER");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-a", "trip-1", "Group A", "admin-1", "CODEA");
    await seedGroup("group-b", "trip-1", "Group B", "admin-2", "CODEB");
    await seedCoinTransaction("tx-1", "group-a", 10, "admin-1", "Bonus");
    await seedCoinTransaction("tx-2", "group-a", 20, "admin-1", "Reward");
    await seedCoinTransaction("tx-3", "group-a", -5, "admin-2", "Penalty");
    await seedCoinTransaction("tx-4", "group-b", 15, "admin-1", "Bonus");
    await seedCoinTransaction("tx-5", "group-b", -3, "admin-2", "Fee");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-a");
  }

  it("getStatistics counts transactions and calculates balances", async () => {
    await seedBaseData();

    const result = await getStatistics(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result.transactionCount).toBe(5);
    expect(result.addedCoins).toBe(45);
    expect(result.removedCoins).toBe(-8);
    expect(result.netBalance).toBe(37);
  });

  it("getAll returns paginated transactions with group and admin info", async () => {
    await seedBaseData();

    const result = await getAll(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1", pagination: { limit: 2, offset: 0 } },
    );

    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("getCoinTransactions filters by groupId", async () => {
    await seedBaseData();

    const result = await getCoinTransactions(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1", groupId: "group-a", limit: 10 },
    );

    expect(result).toHaveLength(3);
    expect(result.every((tx) => tx.groupId === "group-a")).toBe(true);
  });

  it("getCoinTransactions throws FORBIDDEN for non-participants", async () => {
    await seedBaseData();

    await expect(
      getCoinTransactions(
        { db: testDb.db, dbUser: { id: "non-participant" } },
        { tripId: "trip-1", limit: 10 },
      ),
    ).rejects.toThrow("You are not a participant of this trip");
  });

  it("getMostActiveAdminStats ranks admins by total amount", async () => {
    await seedBaseData();

    const result = await getMostActiveAdminStats(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).toHaveLength(1);
    expect(result[0].adminId).toBe("admin-1");
    expect(result[0]._sum.amount).toBe(45);
    expect(result[0]._count.id).toBe(3);
  });

  it("getQuickStats returns total coins, average, and richest group", async () => {
    await seedBaseData();

    const result = await getQuickStats(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).not.toBeNull();
    expect(result?.totalCoins).toBe(37);
    expect(result?.totalGroups).toBe(5);
    expect(result?.averageCoinsPerGroup).toBe(7);
    expect(result?.richestGroupName).toBe("Group A");
  });

  it("getAdditionalInsights returns recent transactions and most active admin", async () => {
    await seedBaseData();

    const result = await getAdditionalInsights(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).not.toBeNull();
    expect(result?.recentTransactions).toHaveLength(5);
    expect(result?.mostActiveAdmin.name).toBe("Alice Smith");
    expect(result?.mostActiveAdmin.transactionCount).toBe(3);
  });

  it("getAll returns empty result when no groups exist for trip", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Empty Trip");

    const result = await getAll(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1", pagination: { limit: 10, offset: 0 } },
    );

    expect(result.transactions).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("getStatistics returns zero values when no groups exist for trip", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Empty Trip");

    const result = await getStatistics(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result.transactionCount).toBe(0);
    expect(result.addedCoins).toBe(0);
    expect(result.removedCoins).toBe(0);
    expect(result.netBalance).toBe(0);
  });

  it("getMostActiveAdminStats returns empty array when no transactions exist", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Empty Trip");
    await seedGroup("group-a", "trip-1", "Group A", "user-1", "CODEA");

    const result = await getMostActiveAdminStats(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).toEqual([]);
  });

  it("getQuickStats returns null when no transactions exist", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Empty Trip");
    await seedGroup("group-a", "trip-1", "Group A", "user-1", "CODEA");

    const result = await getQuickStats(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).toBeNull();
  });

  it("getAdditionalInsights returns null when no transactions exist", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Empty Trip");
    await seedGroup("group-a", "trip-1", "Group A", "user-1", "CODEA");

    const result = await getAdditionalInsights(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result).toBeNull();
  });

  it("Drizzle ORM direct query: counts transactions and calculates balances", async () => {
    await seedBaseData();

    const groupIds = await testDb.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.tripId, "trip-1"), eq(groups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const [txCount, added, removed] = await Promise.all([
      testDb.db
        .select({ count: count() })
        .from(coinTransactions)
        .where(inArray(coinTransactions.groupId, idList)),
      testDb.db
        .select({ totalAmount: sql<number>`sum(${coinTransactions.amount})` })
        .from(coinTransactions)
        .where(and(inArray(coinTransactions.groupId, idList), gt(coinTransactions.amount, 0))),
      testDb.db
        .select({ totalAmount: sql<number>`sum(${coinTransactions.amount})` })
        .from(coinTransactions)
        .where(and(inArray(coinTransactions.groupId, idList), lt(coinTransactions.amount, 0))),
    ]);

    expect(txCount[0].count).toBe(5);
    expect(added[0].totalAmount).toBe(45);
    expect(removed[0].totalAmount).toBe(-8);
    expect((added[0].totalAmount ?? 0) + (removed[0].totalAmount ?? 0)).toBe(37);
  });

  it("Drizzle ORM direct query: pagination with real data", async () => {
    await seedBaseData();

    const limit = 2;
    const offset = 0;

    const groupIds = await testDb.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.tripId, "trip-1"), eq(groups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const txs = await testDb.db.query.coinTransactions.findMany({
      where: inArray(coinTransactions.groupId, idList),
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit,
      offset,
    });

    const totalResult = await testDb.db
      .select({ count: count() })
      .from(coinTransactions)
      .where(inArray(coinTransactions.groupId, idList));
    const total = totalResult[0]?.count ?? 0;

    expect(txs).toHaveLength(2);
    expect(total).toBe(5);
    expect(offset + limit < total).toBe(true);
  });

  it("Drizzle ORM direct query: filters by groupId", async () => {
    await seedBaseData();

    const groupTxs = await testDb.db.query.coinTransactions.findMany({
      where: eq(coinTransactions.groupId, "group-a"),
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit: 10,
    });

    expect(groupTxs).toHaveLength(3);
    expect(groupTxs.every((tx) => tx.groupId === "group-a")).toBe(true);
  });

  it("Drizzle ORM direct query: ranks admins by total amount", async () => {
    await seedBaseData();

    const groupIds = await testDb.db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.tripId, "trip-1"), eq(groups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const result = await testDb.db
      .select({
        adminId: coinTransactions.adminId,
        totalAmount: sql<number>`sum(${coinTransactions.amount})`,
        count: count(coinTransactions.id),
      })
      .from(coinTransactions)
      .where(inArray(coinTransactions.groupId, idList))
      .groupBy(coinTransactions.adminId)
      .orderBy(sql`sum(${coinTransactions.amount}) desc`)
      .limit(1);

    expect(result[0]?.adminId).toBe("admin-1");
    expect(result[0]?.totalAmount).toBe(45);
    expect(result[0]?.count).toBe(3);
  });
});
