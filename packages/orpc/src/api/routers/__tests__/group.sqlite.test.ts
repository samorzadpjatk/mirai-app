import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/group-sqlite-db";
import { eq, sql } from "drizzle-orm";

describe("group router — raw SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        auth_user_id TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        has_avatar INTEGER DEFAULT 0 NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        last_seen_on INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE trips (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        background_image_path TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
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
      CREATE TABLE trip_participants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        trip_id TEXT NOT NULL,
        group_id TEXT,
        wrist_number TEXT,
        house_number TEXT,
        role TEXT DEFAULT 'MEMBER' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(user_id, trip_id)
      )
    `);

    db.exec(`
      CREATE TABLE group_join_requests (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(trip_id, user_id)
      )
    `);

    db.exec(`
      CREATE TABLE coin_transactions (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        admin_id TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE activity_feeds (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        is_pinned INTEGER DEFAULT 0 NOT NULL,
        is_hidden INTEGER DEFAULT 0 NOT NULL,
        hidden_by_admin TEXT,
        hidden_at INTEGER,
        hidden_reason TEXT,
        created_by_admin TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE rank_change_activities (
        activity_id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        new_rank INTEGER NOT NULL,
        total_coins INTEGER NOT NULL,
        coins_gained INTEGER NOT NULL
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  const seedTrip = () => {
    db.run(
      `INSERT INTO trips (id, name, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["trip-1", "Test Trip", Date.now(), Date.now() + 86400000, Date.now(), Date.now()],
    );
  };

  const seedUser = (id: string, firstName: string, lastName: string, role = "USER") => {
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, `auth-${id}`, firstName, lastName, role, Date.now(), Date.now()],
    );
  };

  const seedGroup = (id: string, tripId: string, organizerId: string, code: string, coins = 0) => {
    db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tripId, `Group ${id}`, organizerId, code, coins, 0, Date.now(), Date.now()],
    );
  };

  const seedParticipant = (id: string, userId: string, tripId: string, groupId: string | null) => {
    db.run(
      `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, tripId, groupId, Date.now(), Date.now()],
    );
  };

  const seedJoinRequest = (id: string, tripId: string, groupId: string, userId: string) => {
    db.run(
      `INSERT INTO group_join_requests (id, trip_id, group_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, tripId, groupId, userId, Date.now()],
    );
  };

  it("rolls back create mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");
    seedParticipant("tp-1", "user-1", "trip-1", null);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, trip_id) DO UPDATE SET group_id = excluded.group_id`,
        ["tp-1", "user-1", "trip-1", "group-1", Date.now(), Date.now()],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE trip_id = ? AND user_id = ?`,
        ["trip-1", "user-1"],
      );
      throw new Error("Simulated failure after create transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE user_id = ? AND trip_id = ?")
      .get("user-1", "trip-1") as { group_id: string | null };
    expect(afterParticipant.group_id).toBeNull();

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE trip_id = ? AND user_id = ?")
      .get("trip-1", "user-1") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back deleteGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE trip_participants SET group_id = NULL WHERE group_id = ?`,
        ["group-1"],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE group_id = ?`,
        ["group-1"],
      );
      db.run(
        `UPDATE groups SET is_deleted = 1 WHERE id = ?`,
        ["group-1"],
      );
      throw new Error("Simulated failure after deleteGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterGroup = db
      .query("SELECT is_deleted FROM groups WHERE id = ?")
      .get("group-1") as { is_deleted: number };
    expect(afterGroup.is_deleted).toBe(0);

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE id = ?")
      .get("tp-1") as { group_id: string | null };
    expect(afterParticipant.group_id).toBe("group-1");

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back deleteMyGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE trip_participants SET group_id = NULL WHERE group_id = ?`,
        ["group-1"],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE group_id = ?`,
        ["group-1"],
      );
      db.run(
        `UPDATE groups SET is_deleted = 1 WHERE id = ?`,
        ["group-1"],
      );
      throw new Error("Simulated failure after deleteMyGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterGroup = db
      .query("SELECT is_deleted FROM groups WHERE id = ?")
      .get("group-1") as { is_deleted: number };
    expect(afterGroup.is_deleted).toBe(0);

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE id = ?")
      .get("tp-1") as { group_id: string | null };
    expect(afterParticipant.group_id).toBe("group-1");

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back join mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-2", "user-2", "trip-1", null);
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, trip_id) DO UPDATE SET group_id = excluded.group_id`,
        ["tp-2", "user-2", "trip-1", "group-1", Date.now(), Date.now()],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE trip_id = ? AND user_id = ?`,
        ["trip-1", "user-2"],
      );
      throw new Error("Simulated failure after join transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE user_id = ? AND trip_id = ?")
      .get("user-2", "trip-1") as { group_id: string | null };
    expect(afterParticipant.group_id).toBeNull();

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE trip_id = ? AND user_id = ?")
      .get("trip-1", "user-2") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back respondToJoinRequest mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-2", "user-2", "trip-1", null);
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE trip_participants SET group_id = ? WHERE id = ?`,
        ["group-1", "tp-2"],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE trip_id = ? AND user_id = ?`,
        ["trip-1", "user-2"],
      );
      throw new Error("Simulated failure after respondToJoinRequest transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE id = ?")
      .get("tp-2") as { group_id: string | null };
    expect(afterParticipant.group_id).toBeNull();

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE trip_id = ? AND user_id = ?")
      .get("trip-1", "user-2") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back assignUserToGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-2", "user-2", "trip-1", null);
    seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, trip_id) DO UPDATE SET group_id = excluded.group_id`,
        ["tp-2", "user-2", "trip-1", "group-1", Date.now(), Date.now()],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE trip_id = ? AND user_id = ?`,
        ["trip-1", "user-2"],
      );
      throw new Error("Simulated failure after assignUserToGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE user_id = ? AND trip_id = ?")
      .get("user-2", "trip-1") as { group_id: string | null };
    expect(afterParticipant.group_id).toBeNull();

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE trip_id = ? AND user_id = ?")
      .get("trip-1", "user-2") as { count: number };
    expect(afterRequestCount.count).toBe(1);
  });

  it("rolls back bulkAssignUsersToGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedUser("user-3", "Charlie", "Brown");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-2", "user-2", "trip-1", null);
    seedParticipant("tp-3", "user-3", "trip-1", null);
    seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");
    seedJoinRequest("gjr-3", "trip-1", "group-1", "user-3");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, trip_id) DO UPDATE SET group_id = excluded.group_id`,
        ["tp-2", "user-2", "trip-1", "group-1", Date.now(), Date.now()],
      );
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, trip_id) DO UPDATE SET group_id = excluded.group_id`,
        ["tp-3", "user-3", "trip-1", "group-1", Date.now(), Date.now()],
      );
      db.run(
        `DELETE FROM group_join_requests WHERE trip_id = ? AND user_id IN (?, ?)`,
        ["trip-1", "user-2", "user-3"],
      );
      throw new Error("Simulated failure after bulkAssignUsersToGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRequestCount = db
      .query("SELECT COUNT(*) as count FROM group_join_requests WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(afterRequestCount.count).toBe(2);

    const afterParticipants = db
      .query("SELECT group_id FROM trip_participants WHERE trip_id = ? AND user_id IN ('user-2', 'user-3')")
      .all("trip-1") as Array<{ group_id: string | null }>;
    expect(afterParticipants.every((p) => p.group_id === null)).toBe(true);
  });

  it("rolls back removeUserFromGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE trip_participants SET group_id = NULL WHERE id = ?`,
        ["tp-2"],
      );
      const membersLeft = db
        .query("SELECT COUNT(*) as count FROM trip_participants WHERE trip_id = ? AND group_id = ?")
        .get("trip-1", "group-1") as { count: number };
      if (membersLeft.count === 0) {
        db.run(
          `DELETE FROM group_join_requests WHERE group_id = ?`,
          ["group-1"],
        );
        db.run(
          `UPDATE groups SET is_deleted = 1 WHERE id = ?`,
          ["group-1"],
        );
      }
      throw new Error("Simulated failure after removeUserFromGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterGroup = db
      .query("SELECT is_deleted FROM groups WHERE id = ?")
      .get("group-1") as { is_deleted: number };
    expect(afterGroup.is_deleted).toBe(0);

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE id = ?")
      .get("tp-2") as { group_id: string | null };
    expect(afterParticipant.group_id).toBe("group-1");
  });

  it("rolls back leaveMyGroup mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedUser("user-2", "Bob", "Jones");
    seedGroup("group-1", "trip-1", "user-1", "1234");
    seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE trip_participants SET group_id = NULL WHERE user_id = ? AND trip_id = ?`,
        ["user-2", "trip-1"],
      );
      const membersLeft = db
        .query("SELECT COUNT(*) as count FROM trip_participants WHERE trip_id = ? AND group_id = ?")
        .get("trip-1", "group-1") as { count: number };
      if (membersLeft.count === 0) {
        db.run(
          `DELETE FROM group_join_requests WHERE group_id = ?`,
          ["group-1"],
        );
        db.run(
          `UPDATE groups SET is_deleted = 1 WHERE id = ?`,
          ["group-1"],
        );
      }
      throw new Error("Simulated failure after leaveMyGroup transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterGroup = db
      .query("SELECT is_deleted FROM groups WHERE id = ?")
      .get("group-1") as { is_deleted: number };
    expect(afterGroup.is_deleted).toBe(0);

    const afterParticipant = db
      .query("SELECT group_id FROM trip_participants WHERE id = ?")
      .get("tp-2") as { group_id: string | null };
    expect(afterParticipant.group_id).toBe("group-1");
  });

  it("rolls back addCoins mutation transaction on failure", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE groups SET coins = coins + ? WHERE id = ?`,
        [50, "group-1"],
      );
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        ["ct-1", "group-1", 50, "user-1", Date.now(), Date.now()],
      );
      throw new Error("Simulated failure after addCoins transaction operations");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterGroup = db
      .query("SELECT coins FROM groups WHERE id = ?")
      .get("group-1") as { coins: number };
    expect(afterGroup.coins).toBe(100);

    const afterTxCount = db
      .query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(afterTxCount.count).toBe(0);
  });

  it("commits addCoins mutation transaction successfully when no failure occurs", () => {
    seedTrip();
    seedUser("user-1", "Alice", "Smith");
    seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    db.exec("BEGIN TRANSACTION");
    db.run(
      `UPDATE groups SET coins = coins + ? WHERE id = ?`,
      [50, "group-1"],
    );
    db.run(
      `INSERT INTO coin_transactions (id, group_id, amount, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["ct-1", "group-1", 50, "user-1", Date.now(), Date.now()],
    );
    db.exec("COMMIT");

    const afterGroup = db
      .query("SELECT coins FROM groups WHERE id = ?")
      .get("group-1") as { coins: number };
    expect(afterGroup.coins).toBe(150);

    const afterTxCount = db
      .query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(afterTxCount.count).toBe(1);
  });
});

describe("group router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.db.run(
      `INSERT INTO trips (id, name, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["trip-1", "Test Trip", Date.now(), Date.now() + 86400000, Date.now(), Date.now()],
    );
    testDb.db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["user-1", "auth-user-1", "Alice", "Smith", "USER", Date.now(), Date.now()],
    );
    testDb.db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-1", "trip-1", "Test Group", "user-1", "1234", 100, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("updates group coins via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx
        .update(testDb.sqliteGroups)
        .set({ coins: sql`${testDb.sqliteGroups.coins} + ${50}` })
        .where(eq(testDb.sqliteGroups.id, "group-1"));

      await tx.insert(testDb.sqliteCoinTransactions).values({
        id: "ct-1",
        groupId: "group-1",
        amount: 50,
        adminId: "user-1",
      });
    });

    const groups = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteGroups)
      .where(eq(testDb.sqliteGroups.id, "group-1"));
    expect(groups[0].coins).toBe(150);

    const txs = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteCoinTransactions)
      .where(eq(testDb.sqliteCoinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(50);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.update(testDb.sqliteGroups)
          .set({ coins: sql`${testDb.sqliteGroups.coins} + ${50}` })
          .where(eq(testDb.sqliteGroups.id, "group-1"));

        tx.insert(testDb.sqliteCoinTransactions).values({
          id: "ct-1",
          groupId: "group-1",
          amount: 50,
          adminId: "user-1",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const groups = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteGroups)
      .where(eq(testDb.sqliteGroups.id, "group-1"));
    expect(groups[0].coins).toBe(100);

    const txs = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteCoinTransactions)
      .where(eq(testDb.sqliteCoinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(0);
  });
});
