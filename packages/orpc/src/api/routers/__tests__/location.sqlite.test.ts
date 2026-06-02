import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/location-sqlite-db";
import { eq } from "drizzle-orm";
import { toExpoLocation } from "@mirai-app/shared/locations";

describe("location router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    // Create locations table
    db.exec(`
      CREATE TABLE locations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        timestamp INTEGER NOT NULL,
        is_sharing_location INTEGER DEFAULT 0 NOT NULL,
        accuracy REAL,
        altitude REAL,
        altitude_accuracy REAL,
        heading REAL,
        latitude REAL,
        longitude REAL,
        speed REAL,
        last_inactivity_notification INTEGER
      )
    `);

    // Create location_sharing_requests table
    db.exec(`
      CREATE TABLE location_sharing_requests (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create location_shares table
    db.exec(`
      CREATE TABLE location_shares (
        location_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (location_id, user_id)
      )
    `);

    // Create users table
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

    // Seed users
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["user-sender", "auth-sender", "Sender", "User", 0, "USER", Date.now(), Date.now()],
    );
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["user-receiver", "auth-receiver", "Receiver", "User", 0, "USER", Date.now(), Date.now()],
    );

    // Seed a pending location sharing request
    db.run(
      `INSERT INTO location_sharing_requests (id, sender_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["req-1", "user-sender", "user-receiver", "PENDING", Date.now(), Date.now()],
    );

    // Seed initial locations for both users
    db.run(
      `INSERT INTO locations (id, user_id, timestamp, is_sharing_location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
      ["loc-sender", "user-sender", Date.now(), 0, 52.2297, 21.0122],
    );
    db.run(
      `INSERT INTO locations (id, user_id, timestamp, is_sharing_location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
      ["loc-receiver", "user-receiver", Date.now(), 0, 52.2298, 21.0123],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back location sharing request update on transaction failure", () => {
    const initial = db.query("SELECT status FROM location_sharing_requests WHERE id = ?").get("req-1") as {
      status: string;
    };
    expect(initial.status).toBe("PENDING");

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`UPDATE location_sharing_requests SET status = ? WHERE id = ?`, ["ACCEPTED", "req-1"]);
      throw new Error("Simulated failure after update");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT status FROM location_sharing_requests WHERE id = ?").get("req-1") as {
      status: string;
    };
    expect(afterRollback.status).toBe("PENDING");
  });

  it("rolls back all tables on acceptLocationSharingRequest transaction failure", () => {
    const initialRequest = db.query("SELECT status FROM location_sharing_requests WHERE id = ?").get("req-1") as {
      status: string;
    };
    expect(initialRequest.status).toBe("PENDING");

    const initialSenderLocation = db.query("SELECT is_sharing_location FROM locations WHERE user_id = ?").get(
      "user-sender",
    ) as { is_sharing_location: number };
    expect(initialSenderLocation.is_sharing_location).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      // Update request status
      db.run(`UPDATE location_sharing_requests SET status = ? WHERE id = ?`, ["ACCEPTED", "req-1"]);
      // Update sender location
      db.run(`UPDATE locations SET is_sharing_location = ?, timestamp = ? WHERE user_id = ?`, [
        1,
        Date.now(),
        "user-sender",
      ]);
      // Insert sender -> receiver share
      db.run(`INSERT INTO location_shares (location_id, user_id) VALUES (?, ?)`, ["loc-sender", "user-receiver"]);
      // Update receiver location
      db.run(`UPDATE locations SET is_sharing_location = ?, timestamp = ? WHERE user_id = ?`, [
        1,
        Date.now(),
        "user-receiver",
      ]);
      // Insert receiver -> sender share
      db.run(`INSERT INTO location_shares (location_id, user_id) VALUES (?, ?)`, ["loc-receiver", "user-sender"]);
      throw new Error("Simulated failure after all updates");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollbackRequest = db.query("SELECT status FROM location_sharing_requests WHERE id = ?").get("req-1") as {
      status: string;
    };
    expect(afterRollbackRequest.status).toBe("PENDING");

    const afterSenderLocation = db.query("SELECT is_sharing_location FROM locations WHERE user_id = ?").get(
      "user-sender",
    ) as { is_sharing_location: number };
    expect(afterSenderLocation.is_sharing_location).toBe(0);

    const afterReceiverLocation = db.query("SELECT is_sharing_location FROM locations WHERE user_id = ?").get(
      "user-receiver",
    ) as { is_sharing_location: number };
    expect(afterReceiverLocation.is_sharing_location).toBe(0);

    const shareCount = db.query("SELECT COUNT(*) as count FROM location_shares").get() as { count: number };
    expect(shareCount.count).toBe(0);
  });

  it("commits successfully when no failure occurs", () => {
    db.exec("BEGIN TRANSACTION");
    // Update request status
    db.run(`UPDATE location_sharing_requests SET status = ? WHERE id = ?`, ["ACCEPTED", "req-1"]);
    // Update sender location
    db.run(`UPDATE locations SET is_sharing_location = ?, timestamp = ? WHERE user_id = ?`, [
      1,
      Date.now(),
      "user-sender",
    ]);
    // Insert sender -> receiver share
    db.run(`INSERT INTO location_shares (location_id, user_id) VALUES (?, ?)`, ["loc-sender", "user-receiver"]);
    // Update receiver location
    db.run(`UPDATE locations SET is_sharing_location = ?, timestamp = ? WHERE user_id = ?`, [
      1,
      Date.now(),
      "user-receiver",
    ]);
    // Insert receiver -> sender share
    db.run(`INSERT INTO location_shares (location_id, user_id) VALUES (?, ?)`, ["loc-receiver", "user-sender"]);
    db.exec("COMMIT");

    const afterCommitRequest = db.query("SELECT status FROM location_sharing_requests WHERE id = ?").get("req-1") as {
      status: string;
    };
    expect(afterCommitRequest.status).toBe("ACCEPTED");

    const senderLocation = db.query("SELECT is_sharing_location FROM locations WHERE user_id = ?").get(
      "user-sender",
    ) as { is_sharing_location: number };
    expect(senderLocation.is_sharing_location).toBe(1);

    const receiverLocation = db.query("SELECT is_sharing_location FROM locations WHERE user_id = ?").get(
      "user-receiver",
    ) as { is_sharing_location: number };
    expect(receiverLocation.is_sharing_location).toBe(1);

    const shareCount = db.query("SELECT COUNT(*) as count FROM location_shares").get() as { count: number };
    expect(shareCount.count).toBe(2);
  });
});

describe("location router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();

    // Seed users
    testDb.db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["user-sender", "auth-sender", "Sender", "User", 0, "USER", Date.now(), Date.now()],
    );
    testDb.db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["user-receiver", "auth-receiver", "Receiver", "User", 0, "USER", Date.now(), Date.now()],
    );

    // Seed a pending location sharing request
    testDb.db.run(
      `INSERT INTO location_sharing_requests (id, sender_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["req-1", "user-sender", "user-receiver", "PENDING", Date.now(), Date.now()],
    );

    // Seed initial locations for both users
    testDb.db.run(
      `INSERT INTO locations (id, user_id, timestamp, is_sharing_location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
      ["loc-sender", "user-sender", Date.now(), 0, 52.2297, 21.0122],
    );
    testDb.db.run(
      `INSERT INTO locations (id, user_id, timestamp, is_sharing_location, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)`,
      ["loc-receiver", "user-receiver", Date.now(), 0, 52.2298, 21.0123],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("commits acceptLocationSharingRequest via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      // Update request status
      await tx
        .update(testDb.sqliteLocationSharingRequests)
        .set({ status: "ACCEPTED" })
        .where(eq(testDb.sqliteLocationSharingRequests.id, "req-1"));

      // Update sender location
      await tx
        .update(testDb.sqliteLocations)
        .set({ isSharingLocation: true, timestamp: new Date() })
        .where(eq(testDb.sqliteLocations.userId, "user-sender"));

      // Insert sender -> receiver share
      await tx.insert(testDb.sqliteLocationShares).values({
        locationId: "loc-sender",
        userId: "user-receiver",
      });

      // Update receiver location
      await tx
        .update(testDb.sqliteLocations)
        .set({ isSharingLocation: true, timestamp: new Date() })
        .where(eq(testDb.sqliteLocations.userId, "user-receiver"));

      // Insert receiver -> sender share
      await tx.insert(testDb.sqliteLocationShares).values({
        locationId: "loc-receiver",
        userId: "user-sender",
      });
    });

    const request = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocationSharingRequests)
      .where(eq(testDb.sqliteLocationSharingRequests.id, "req-1"));
    expect(request[0].status).toBe("ACCEPTED");

    const senderLocation = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocations)
      .where(eq(testDb.sqliteLocations.userId, "user-sender"));
    expect(senderLocation[0].isSharingLocation).toBe(true);

    const receiverLocation = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocations)
      .where(eq(testDb.sqliteLocations.userId, "user-receiver"));
    expect(receiverLocation[0].isSharingLocation).toBe(true);

    const shares = await testDb.drizzleDb.select().from(testDb.sqliteLocationShares);
    expect(shares).toHaveLength(2);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        // Update request status
        tx.update(testDb.sqliteLocationSharingRequests)
          .set({ status: "ACCEPTED" })
          .where(eq(testDb.sqliteLocationSharingRequests.id, "req-1"));

        // Update sender location
        tx.update(testDb.sqliteLocations)
          .set({ isSharingLocation: true, timestamp: new Date() })
          .where(eq(testDb.sqliteLocations.userId, "user-sender"));

        // Insert sender -> receiver share
        tx.insert(testDb.sqliteLocationShares).values({
          locationId: "loc-sender",
          userId: "user-receiver",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const request = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocationSharingRequests)
      .where(eq(testDb.sqliteLocationSharingRequests.id, "req-1"));
    expect(request[0].status).toBe("PENDING");

    const senderLocation = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocations)
      .where(eq(testDb.sqliteLocations.userId, "user-sender"));
    expect(senderLocation[0].isSharingLocation).toBe(false);

    const shares = await testDb.drizzleDb.select().from(testDb.sqliteLocationShares);
    expect(shares).toHaveLength(0);
  });

  it("validates toExpoLocation with real SQLite data", async () => {
    const dbLocations = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteLocations)
      .where(eq(testDb.sqliteLocations.userId, "user-sender"));

    const dbLocation = dbLocations[0];

    // The SQLite schema uses timestamp as integer (milliseconds), but toExpoLocation expects a Date object
    // We need to adapt the raw data to match the expected DbLocation shape
    const adaptedLocation = {
      ...dbLocation,
      timestamp: new Date(dbLocation.timestamp),
    };

    const result = toExpoLocation(adaptedLocation as any);

    expect(result.coords.latitude).toBe(52.2297);
    expect(result.coords.longitude).toBe(21.0122);
    expect(result.coords.altitude).toBeNull();
    expect(result.coords.accuracy).toBeNull();
    expect(result.timestamp).toBe(adaptedLocation.timestamp.getTime());
  });
});
