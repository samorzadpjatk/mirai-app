import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createNotificationTestDb } from "./helpers/notification-sqlite-db";
import { eq } from "drizzle-orm";
import { buildDeliveryStats } from "@mirai-app/shared/notifications";

describe("notificationDelivery — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE notification_deliveries (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        notification_id TEXT NOT NULL UNIQUE,
        schedule_id TEXT,
        delivery_started_at INTEGER NOT NULL,
        delivery_completed_at INTEGER,
        total_recipients INTEGER DEFAULT 0 NOT NULL,
        success_count INTEGER DEFAULT 0 NOT NULL,
        failure_count INTEGER DEFAULT 0 NOT NULL,
        errors TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back delivery insert on failure", () => {
    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO notification_deliveries (id, notification_id, delivery_started_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        ["del-1", "notif-1", Date.now(), "pending", Date.now(), Date.now()],
      );
      throw new Error("Simulated failure after insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const count = db.query("SELECT COUNT(*) as count FROM notification_deliveries").get() as {
      count: number;
    };
    expect(count.count).toBe(0);
  });

  it("commits delivery insert when no failure", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO notification_deliveries (id, notification_id, delivery_started_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["del-1", "notif-1", Date.now(), "pending", Date.now(), Date.now()],
    );
    db.exec("COMMIT");

    const count = db.query("SELECT COUNT(*) as count FROM notification_deliveries").get() as {
      count: number;
    };
    expect(count.count).toBe(1);
  });
});

describe("notificationDelivery — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createNotificationTestDb>;

  beforeEach(() => {
    testDb = createNotificationTestDb();
    // Seed deliveries
    testDb.db.run(
      `INSERT INTO notification_deliveries (id, trip_id, notification_id, delivery_started_at, delivery_completed_at, total_recipients, success_count, failure_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["del-1", "trip-1", "notif-1", Date.now(), Date.now(), 10, 8, 2, "success", Date.now(), Date.now()],
    );
    testDb.db.run(
      `INSERT INTO notification_deliveries (id, trip_id, notification_id, delivery_started_at, delivery_completed_at, total_recipients, success_count, failure_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["del-2", "trip-1", "notif-2", Date.now(), Date.now(), 10, 0, 10, "failure", Date.now(), Date.now()],
    );
    testDb.db.run(
      `INSERT INTO notification_deliveries (id, trip_id, notification_id, delivery_started_at, delivery_completed_at, total_recipients, success_count, failure_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["del-3", "trip-1", "notif-3", Date.now(), Date.now(), 10, 5, 5, "partial_failure", Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("queries deliveries via Drizzle ORM", async () => {
    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries)
      .where(eq(testDb.sqliteNotificationDeliveries.tripId, "trip-1"));
    expect(deliveries).toHaveLength(3);
  });

  it("filters deliveries by status", async () => {
    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries)
      .where(eq(testDb.sqliteNotificationDeliveries.status, "success"));
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].notificationId).toBe("notif-1");
  });

  it("buildDeliveryStats works with real SQLite data", async () => {
    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries)
      .where(eq(testDb.sqliteNotificationDeliveries.tripId, "trip-1"));

    const stats = buildDeliveryStats(deliveries.map((d) => ({ status: d.status })));
    expect(stats.total).toBe(3);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.partial).toBe(1);
    expect(stats.successRate).toBe(33);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteNotificationDeliveries).values({
          id: "del-4",
          notificationId: "notif-4",
          deliveryStartedAt: new Date(),
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries);
    expect(deliveries).toHaveLength(3);
  });
});
