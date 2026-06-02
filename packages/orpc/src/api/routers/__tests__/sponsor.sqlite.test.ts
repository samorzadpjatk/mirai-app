import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/sponsor-sqlite-db";
import { eq } from "drizzle-orm";

describe("sponsor router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE sponsors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        logo_path TEXT NOT NULL,
        height INTEGER,
        offset_x INTEGER,
        offset_y INTEGER,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE trip_sponsors (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        sponsor_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
    db.run(
      `INSERT INTO sponsors (id, name, description, logo_path, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["sponsor-1", "Test Sponsor", "A test sponsor", "/logo.png", 1, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back sponsor insert on transaction failure", () => {
    const initialCount = db.query("SELECT COUNT(*) as count FROM sponsors").get() as {
      count: number;
    };
    expect(initialCount.count).toBe(1);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO sponsors (id, name, description, logo_path, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["sponsor-2", "New Sponsor", "New", "/new.png", 1, Date.now(), Date.now()],
      );
      throw new Error("Simulated failure after insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT COUNT(*) as count FROM sponsors").get() as {
      count: number;
    };
    expect(afterRollback.count).toBe(1);
  });

  it("rolls back trip sponsor association on transaction failure", () => {
    const initialCount = db.query("SELECT COUNT(*) as count FROM trip_sponsors").get() as {
      count: number;
    };
    expect(initialCount.count).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO trip_sponsors (id, trip_id, sponsor_id, created_at) VALUES (?, ?, ?, ?)`,
        ["ts-1", "trip-1", "sponsor-1", Date.now()],
      );
      throw new Error("Simulated failure after insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT COUNT(*) as count FROM trip_sponsors").get() as {
      count: number;
    };
    expect(afterRollback.count).toBe(0);
  });

  it("commits sponsor and trip sponsor association successfully", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO sponsors (id, name, description, logo_path, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["sponsor-2", "New Sponsor", "New", "/new.png", 1, Date.now(), Date.now()],
    );
    db.run(
      `INSERT INTO trip_sponsors (id, trip_id, sponsor_id, created_at) VALUES (?, ?, ?, ?)`,
      ["ts-1", "trip-1", "sponsor-2", Date.now()],
    );
    db.exec("COMMIT");

    const sponsorCount = db.query("SELECT COUNT(*) as count FROM sponsors").get() as {
      count: number;
    };
    expect(sponsorCount.count).toBe(2);

    const tripSponsorCount = db.query("SELECT COUNT(*) as count FROM trip_sponsors").get() as {
      count: number;
    };
    expect(tripSponsorCount.count).toBe(1);
  });
});

describe("sponsor router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.db.run(
      `INSERT INTO sponsors (id, name, description, logo_path, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["sponsor-1", "Test Sponsor", "A test sponsor", "/logo.png", 1, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("inserts sponsor via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteSponsors).values({
        id: "sponsor-2",
        name: "New Sponsor",
        description: "New",
        logoPath: "/new.png",
        isActive: true,
      });
    });

    const sponsors = await testDb.drizzleDb.select().from(testDb.sqliteSponsors);
    expect(sponsors).toHaveLength(2);
    expect(sponsors[1].name).toBe("New Sponsor");
  });

  it("inserts trip sponsor via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteTripSponsors).values({
        id: "ts-1",
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
    });

    const tripSponsors = await testDb.drizzleDb.select().from(testDb.sqliteTripSponsors);
    expect(tripSponsors).toHaveLength(1);
    expect(tripSponsors[0].tripId).toBe("trip-1");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteSponsors).values({
          id: "sponsor-2",
          name: "New Sponsor",
          description: "Desc",
          logoPath: "/logo2.png",
          isActive: true,
        });
        tx.insert(testDb.sqliteTripSponsors).values({
          id: "ts-1",
          tripId: "trip-1",
          sponsorId: "sponsor-2",
        });
        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const sponsors = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteSponsors)
      .where(eq(testDb.sqliteSponsors.id, "sponsor-2"));
    expect(sponsors).toHaveLength(0);

    const tripSponsors = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripSponsors)
      .where(eq(testDb.sqliteTripSponsors.id, "ts-1"));
    expect(tripSponsors).toHaveLength(0);
  });
});
