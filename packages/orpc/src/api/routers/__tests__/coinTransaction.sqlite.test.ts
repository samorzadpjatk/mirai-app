import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb, seedUser, seedGroup, seedCoinTransaction } from "./helpers/coinTransaction-sqlite-db";
import { eq, and, inArray, count, sql, gt, lt, desc } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqliteTripParticipants = sqliteTable("trip_participants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tripId: text("trip_id").notNull(),
  groupId: text("group_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

describe("coinTransaction router queries — raw SQLite", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`CREATE TABLE groups (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, image TEXT, is_deleted INTEGER DEFAULT 0 NOT NULL, organizer_id TEXT NOT NULL, code TEXT NOT NULL UNIQUE, coins INTEGER DEFAULT 0 NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
    db.exec(`CREATE TABLE coin_transactions (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, amount INTEGER NOT NULL, reason TEXT, admin_id TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
    db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, auth_user_id TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL, has_avatar INTEGER DEFAULT 0 NOT NULL, role TEXT DEFAULT 'USER' NOT NULL, last_seen_on INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
    db.exec(`CREATE TABLE trip_participants (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, trip_id TEXT NOT NULL, group_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(user_id, trip_id))`);

    const now = Date.now();
    db.run(`INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["group-a", "trip-1", "Group A", "admin-1", "CODEA", 0, 0, now, now]);
    db.run(`INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, ["group-b", "trip-1", "Group B", "admin-2", "CODEB", 0, 0, now, now]);
    db.run(`INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["admin-1", "auth-1", "Alice", "Smith", "MODERATOR", now, now]);
    db.run(`INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["admin-2", "auth-2", "Bob", "Jones", "MODERATOR", now, now]);
    db.run(`INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["user-1", "auth-3", "Charlie", "Brown", "USER", now, now]);
    db.run(`INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["tx-1", "group-a", 10, "Bonus", "admin-1", now, now]);
    db.run(`INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["tx-2", "group-a", 20, "Reward", "admin-1", now + 1, now + 1]);
    db.run(`INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["tx-3", "group-a", -5, "Penalty", "admin-2", now + 2, now + 2]);
    db.run(`INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["tx-4", "group-b", 15, "Bonus", "admin-1", now + 3, now + 3]);
    db.run(`INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, ["tx-5", "group-b", -3, "Fee", "admin-2", now + 4, now + 4]);
    db.run(`INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, ["tp-1", "user-1", "trip-1", "group-a", now, now]);
  });

  afterEach(() => {
    db.close();
  });

  it("getStatistics: counts transactions and calculates balances", () => {
    const groupIds = db.query("SELECT id FROM groups WHERE trip_id = ? AND is_deleted = 0").all("trip-1") as Array<{ id: string }>;
    const ids = groupIds.map((g) => g.id);
    expect(ids).toEqual(["group-a", "group-b"]);

    const txCount = db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id IN (?, ?)").get("group-a", "group-b") as { count: number };
    const added = db.query("SELECT SUM(amount) as total FROM coin_transactions WHERE group_id IN (?, ?) AND amount > 0").get("group-a", "group-b") as { total: number };
    const removed = db.query("SELECT SUM(amount) as total FROM coin_transactions WHERE group_id IN (?, ?) AND amount < 0").get("group-a", "group-b") as { total: number };

    expect(txCount.count).toBe(5);
    expect(added.total).toBe(45);
    expect(removed.total).toBe(-8);
    expect(added.total + removed.total).toBe(37);
  });

  it("getAll: pagination with real data", () => {
    const limit = 2;
    const offset = 0;
    const txs = db.query("SELECT * FROM coin_transactions WHERE group_id IN (?, ?) ORDER BY created_at DESC LIMIT ? OFFSET ?").all("group-a", "group-b", limit, offset) as Array<Record<string, unknown>>;
    const total = (db.query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id IN (?, ?)").get("group-a", "group-b") as { count: number }).count;

    expect(txs).toHaveLength(2);
    expect(total).toBe(5);
    expect(offset + limit < total).toBe(true);
  });

  it("getCoinTransactions: filters by groupId", () => {
    const txs = db.query("SELECT * FROM coin_transactions WHERE group_id = ? ORDER BY created_at DESC").all("group-a") as Array<Record<string, unknown>>;
    expect(txs).toHaveLength(3);
    expect(txs.every((tx) => tx.group_id === "group-a")).toBe(true);
  });

  it("getMostActiveAdminStats: ranks admins by total amount", () => {
    const result = db.query("SELECT admin_id, SUM(amount) as total_amount, COUNT(*) as tx_count FROM coin_transactions WHERE group_id IN (?, ?) GROUP BY admin_id ORDER BY total_amount DESC LIMIT 1").get("group-a", "group-b") as { admin_id: string; total_amount: number; tx_count: number };
    expect(result.admin_id).toBe("admin-1");
    expect(result.total_amount).toBe(45);
    expect(result.tx_count).toBe(3);
  });
});

describe("coinTransaction router queries — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;
  let relationalDb: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    testDb = createTestDb();

    testDb.db.exec(`CREATE TABLE trip_participants (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, trip_id TEXT NOT NULL, group_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(user_id, trip_id))`);

    const coinTransactionsRelations = relations(testDb.sqliteCoinTransactions, ({ one }) => ({
      group: one(testDb.sqliteGroups, { fields: [testDb.sqliteCoinTransactions.groupId], references: [testDb.sqliteGroups.id] }),
      admin: one(testDb.sqliteUsers, { fields: [testDb.sqliteCoinTransactions.adminId], references: [testDb.sqliteUsers.id] }),
    }));

    const groupsRelations = relations(testDb.sqliteGroups, ({ many }) => ({
      coinTransactions: many(testDb.sqliteCoinTransactions),
    }));

    const usersRelations = relations(testDb.sqliteUsers, ({ many }) => ({
      coinTransactionsAdmin: many(testDb.sqliteCoinTransactions, { relationName: "UserCoinTransactionsAdmin" }),
    }));

    relationalDb = drizzle(testDb.db, {
      schema: {
        groups: testDb.sqliteGroups,
        coinTransactions: testDb.sqliteCoinTransactions,
        users: testDb.sqliteUsers,
        tripParticipants: sqliteTripParticipants,
        coinTransactionsRelations,
        groupsRelations,
        usersRelations,
      },
    });

    await seedUser(testDb.drizzleDb, { id: "admin-1", authUserId: "auth-1", firstName: "Alice", lastName: "Smith", role: "MODERATOR" });
    await seedUser(testDb.drizzleDb, { id: "admin-2", authUserId: "auth-2", firstName: "Bob", lastName: "Jones", role: "MODERATOR" });
    await seedUser(testDb.drizzleDb, { id: "user-1", authUserId: "auth-3", firstName: "Charlie", lastName: "Brown" });
    await seedGroup(testDb.drizzleDb, { id: "group-a", tripId: "trip-1", name: "Group A", organizerId: "admin-1", code: "CODEA" });
    await seedGroup(testDb.drizzleDb, { id: "group-b", tripId: "trip-1", name: "Group B", organizerId: "admin-2", code: "CODEB" });
    await seedCoinTransaction(testDb.drizzleDb, { id: "tx-1", groupId: "group-a", amount: 10, reason: "Bonus", adminId: "admin-1" });
    await seedCoinTransaction(testDb.drizzleDb, { id: "tx-2", groupId: "group-a", amount: 20, reason: "Reward", adminId: "admin-1" });
    await seedCoinTransaction(testDb.drizzleDb, { id: "tx-3", groupId: "group-a", amount: -5, reason: "Penalty", adminId: "admin-2" });
    await seedCoinTransaction(testDb.drizzleDb, { id: "tx-4", groupId: "group-b", amount: 15, reason: "Bonus", adminId: "admin-1" });
    await seedCoinTransaction(testDb.drizzleDb, { id: "tx-5", groupId: "group-b", amount: -3, reason: "Fee", adminId: "admin-2" });

    testDb.db.run(`INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, ["tp-1", "user-1", "trip-1", "group-a", Date.now(), Date.now()]);
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("getStatistics via Drizzle ORM", async () => {
    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const [txCount, added, removed] = await Promise.all([
      testDb.drizzleDb.select({ count: count() }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList)),
      testDb.drizzleDb.select({ totalAmount: sql<number>`sum(${testDb.sqliteCoinTransactions.amount})` }).from(testDb.sqliteCoinTransactions).where(and(inArray(testDb.sqliteCoinTransactions.groupId, idList), gt(testDb.sqliteCoinTransactions.amount, 0))),
      testDb.drizzleDb.select({ totalAmount: sql<number>`sum(${testDb.sqliteCoinTransactions.amount})` }).from(testDb.sqliteCoinTransactions).where(and(inArray(testDb.sqliteCoinTransactions.groupId, idList), lt(testDb.sqliteCoinTransactions.amount, 0))),
    ]);

    expect(txCount[0].count).toBe(5);
    expect(added[0].totalAmount).toBe(45);
    expect(removed[0].totalAmount).toBe(-8);
    expect((added[0].totalAmount ?? 0) + (removed[0].totalAmount ?? 0)).toBe(37);
  });

  it("getAll pagination via Drizzle ORM", async () => {
    const limit = 2;
    const offset = 0;

    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const txs = await relationalDb.query.coinTransactions.findMany({
      where: inArray(testDb.sqliteCoinTransactions.groupId, idList),
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit,
      offset,
    });

    const totalResult = await testDb.drizzleDb.select({ count: count() }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList));
    const total = totalResult[0]?.count ?? 0;

    expect(txs).toHaveLength(2);
    expect(total).toBe(5);
    expect(offset + limit < total).toBe(true);
  });

  it("getQuickStats via Drizzle ORM", async () => {
    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const totalCoinsResult = await testDb.drizzleDb.select({ totalAmount: sql<number>`sum(${testDb.sqliteCoinTransactions.amount})`, count: count(testDb.sqliteCoinTransactions.id) }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList));
    const totalCoins = totalCoinsResult[0];

    expect(totalCoins?.totalAmount).toBe(37);
    expect(totalCoins?.count).toBe(5);

    const averageCoinsPerGroup = totalCoins?.count ? Math.round(totalCoins.totalAmount / totalCoins.count) : 0;
    expect(averageCoinsPerGroup).toBe(7);

    const richestGroupResult = await testDb.drizzleDb.select({ groupId: testDb.sqliteCoinTransactions.groupId, totalAmount: sql<number>`sum(${testDb.sqliteCoinTransactions.amount})` }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList)).groupBy(testDb.sqliteCoinTransactions.groupId).orderBy(sql`sum(${testDb.sqliteCoinTransactions.amount}) desc`).limit(1);

    expect(richestGroupResult[0]?.groupId).toBe("group-a");
    expect(richestGroupResult[0]?.totalAmount).toBe(25);
  });

  it("getCoinTransactions via Drizzle ORM", async () => {
    const participant = await relationalDb.query.tripParticipants.findFirst({
      where: (tp, { and, eq }) => and(eq(tp.userId, "user-1"), eq(tp.tripId, "trip-1")),
      columns: { userId: true },
    });
    expect(participant?.userId).toBe("user-1");

    const groupTxs = await relationalDb.query.coinTransactions.findMany({
      where: eq(testDb.sqliteCoinTransactions.groupId, "group-a"),
      with: { group: { columns: { id: true, name: true } }, admin: { columns: { id: true, firstName: true, lastName: true } } },
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit: 10,
    });
    expect(groupTxs).toHaveLength(3);
    expect(groupTxs.every((tx) => tx.groupId === "group-a")).toBe(true);

    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const allTxs = await relationalDb.query.coinTransactions.findMany({
      where: inArray(testDb.sqliteCoinTransactions.groupId, idList),
      with: { group: { columns: { id: true, name: true, coins: true } }, admin: { columns: { id: true, firstName: true, lastName: true } } },
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit: 10,
    });
    expect(allTxs).toHaveLength(5);
  });

  it("getMostActiveAdminStats via Drizzle ORM", async () => {
    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const result = await testDb.drizzleDb.select({ adminId: testDb.sqliteCoinTransactions.adminId, totalAmount: sql<number>`sum(${testDb.sqliteCoinTransactions.amount})`, count: count(testDb.sqliteCoinTransactions.id) }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList)).groupBy(testDb.sqliteCoinTransactions.adminId).orderBy(sql`sum(${testDb.sqliteCoinTransactions.amount}) desc`).limit(1);

    expect(result[0]?.adminId).toBe("admin-1");
    expect(result[0]?.totalAmount).toBe(45);
    expect(result[0]?.count).toBe(3);
  });

  it("getAdditionalInsights via Drizzle ORM", async () => {
    const groupIds = await testDb.drizzleDb.select({ id: testDb.sqliteGroups.id }).from(testDb.sqliteGroups).where(and(eq(testDb.sqliteGroups.tripId, "trip-1"), eq(testDb.sqliteGroups.isDeleted, false)));
    const idList = groupIds.map((g) => g.id);

    const recentTransactions = await relationalDb.query.coinTransactions.findMany({
      where: inArray(testDb.sqliteCoinTransactions.groupId, idList),
      orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      limit: 5,
    });
    expect(recentTransactions).toHaveLength(5);

    const mostActiveAdminStatsResult = await testDb.drizzleDb.select({ adminId: testDb.sqliteCoinTransactions.adminId, count: count(testDb.sqliteCoinTransactions.id) }).from(testDb.sqliteCoinTransactions).where(inArray(testDb.sqliteCoinTransactions.groupId, idList)).groupBy(testDb.sqliteCoinTransactions.adminId).orderBy(sql`count(${testDb.sqliteCoinTransactions.id}) desc`).limit(1);

    expect(mostActiveAdminStatsResult[0]?.adminId).toBe("admin-1");
    expect(mostActiveAdminStatsResult[0]?.count).toBe(3);
  });
});
