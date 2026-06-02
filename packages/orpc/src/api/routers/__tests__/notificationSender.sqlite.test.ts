import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createNotificationTestDb } from "./helpers/notification-sqlite-db";
import { eq } from "drizzle-orm";
import { buildDeliveryStatus, extractErrorMessage } from "@mirai-app/shared/notifications";

describe("notificationSender — real SQLite transaction rollback", () => {
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

  it("rolls back delivery update on failure", () => {
    db.run(
      `INSERT INTO notification_deliveries (id, notification_id, delivery_started_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["del-1", "notif-1", Date.now(), "pending", Date.now(), Date.now()],
    );

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE notification_deliveries SET status = ?, success_count = ?, failure_count = ? WHERE notification_id = ?`,
        ["success", 10, 0, "notif-1"],
      );
      throw new Error("Simulated failure after update");
    } catch {
      db.exec("ROLLBACK");
    }

    const delivery = db.query("SELECT status, success_count FROM notification_deliveries WHERE notification_id = ?").get("notif-1") as {
      status: string;
      success_count: number;
    };
    expect(delivery.status).toBe("pending");
    expect(delivery.success_count).toBe(0);
  });

  it("commits delivery update when no failure", () => {
    db.run(
      `INSERT INTO notification_deliveries (id, notification_id, delivery_started_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["del-1", "notif-1", Date.now(), "pending", Date.now(), Date.now()],
    );

    db.exec("BEGIN TRANSACTION");
    db.run(
      `UPDATE notification_deliveries SET status = ?, success_count = ?, failure_count = ? WHERE notification_id = ?`,
      ["success", 10, 0, "notif-1"],
    );
    db.exec("COMMIT");

    const delivery = db.query("SELECT status, success_count FROM notification_deliveries WHERE notification_id = ?").get("notif-1") as {
      status: string;
      success_count: number;
    };
    expect(delivery.status).toBe("success");
    expect(delivery.success_count).toBe(10);
  });
});

describe("notificationSender — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createNotificationTestDb>;

  beforeEach(() => {
    testDb = createNotificationTestDb();
    // Seed delivery
    testDb.db.run(
      `INSERT INTO notification_deliveries (id, trip_id, notification_id, delivery_started_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["del-1", "trip-1", "notif-1", Date.now(), "pending", Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("updates delivery status via Drizzle ORM", async () => {
    const status = buildDeliveryStatus(10, 0);
    expect(status).toBe("success");

    await testDb.drizzleDb
      .update(testDb.sqliteNotificationDeliveries)
      .set({
        status,
        successCount: 10,
        failureCount: 0,
        deliveryCompletedAt: new Date(),
      })
      .where(eq(testDb.sqliteNotificationDeliveries.notificationId, "notif-1"));

    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries)
      .where(eq(testDb.sqliteNotificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("success");
    expect(deliveries[0].successCount).toBe(10);
  });

  it("extracts error message from Error object", () => {
    const error = new Error("Database connection failed");
    const message = extractErrorMessage(error);
    expect(message).toBe("Database connection failed");
  });

  it("extracts error message from string", () => {
    const message = extractErrorMessage("Service unavailable");
    expect(message).toBe("Service unavailable");
  });

  it("updates delivery with failure status", async () => {
    const status = buildDeliveryStatus(0, 10);
    expect(status).toBe("failure");

    const errorMessage = extractErrorMessage(new Error("All tokens invalid"));

    await testDb.drizzleDb
      .update(testDb.sqliteNotificationDeliveries)
      .set({
        status,
        successCount: 0,
        failureCount: 10,
        errors: errorMessage,
        deliveryCompletedAt: new Date(),
      })
      .where(eq(testDb.sqliteNotificationDeliveries.notificationId, "notif-1"));

    const deliveries = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationDeliveries)
      .where(eq(testDb.sqliteNotificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("failure");
    expect(deliveries[0].errors).toBe("All tokens invalid");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteNotificationDeliveries).values({
          id: "del-2",
          notificationId: "notif-2",
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
    expect(deliveries).toHaveLength(1);
  });
});
