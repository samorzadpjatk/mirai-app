import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createNotificationTestDb } from "./helpers/notification-sqlite-db";
import { eq, and } from "drizzle-orm";
import { normalizeScheduleWindow } from "@mirai-app/shared/notifications";

describe("notificationSchedule — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE notification_schedules (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        name TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        notification_title TEXT,
        notification_body TEXT,
        notification_url TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER DEFAULT 0 NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        last_run INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        created_by_id TEXT NOT NULL
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back schedule insert on failure", () => {
    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO notification_schedules (id, name, notification_type, start_date, end_date, hour, minute, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["sched-1", "Test", "custom", Date.now(), Date.now() + 86400000, 9, 0, Date.now(), Date.now(), "user-1"],
      );
      throw new Error("Simulated failure after insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const count = db.query("SELECT COUNT(*) as count FROM notification_schedules").get() as {
      count: number;
    };
    expect(count.count).toBe(0);
  });

  it("commits schedule insert when no failure", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO notification_schedules (id, name, notification_type, start_date, end_date, hour, minute, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["sched-1", "Test", "custom", Date.now(), Date.now() + 86400000, 9, 0, Date.now(), Date.now(), "user-1"],
    );
    db.exec("COMMIT");

    const count = db.query("SELECT COUNT(*) as count FROM notification_schedules").get() as {
      count: number;
    };
    expect(count.count).toBe(1);
  });
});

describe("notificationSchedule — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createNotificationTestDb>;

  beforeEach(() => {
    testDb = createNotificationTestDb();
    // Seed schedules
    testDb.db.run(
      `INSERT INTO notification_schedules (id, trip_id, name, notification_type, start_date, end_date, hour, minute, is_active, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["sched-1", "trip-1", "Morning", "custom", Date.now(), Date.now() + 86400000, 7, 30, 1, Date.now(), Date.now(), "user-1"],
    );
    testDb.db.run(
      `INSERT INTO notification_schedules (id, trip_id, name, notification_type, start_date, end_date, hour, minute, is_active, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["sched-2", "trip-1", "Evening", "custom", Date.now(), Date.now() + 86400000, 18, 0, 1, Date.now(), Date.now(), "user-1"],
    );
    testDb.db.run(
      `INSERT INTO notification_schedules (id, trip_id, name, notification_type, start_date, end_date, hour, minute, is_active, created_at, updated_at, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["sched-3", "trip-1", "Inactive", "custom", Date.now(), Date.now() + 86400000, 12, 0, 0, Date.now(), Date.now(), "user-1"],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("queries all schedules via Drizzle ORM", async () => {
    const schedules = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationSchedules);
    expect(schedules).toHaveLength(3);
  });

  it("filters schedules by active status", async () => {
    const schedules = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationSchedules)
      .where(eq(testDb.sqliteNotificationSchedules.isActive, true));
    expect(schedules).toHaveLength(2);
  });

  it("filters schedules by tripId", async () => {
    const schedules = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationSchedules)
      .where(eq(testDb.sqliteNotificationSchedules.tripId, "trip-1"));
    expect(schedules).toHaveLength(3);
  });

  it("normalizes schedule window with real dates", () => {
    const startDate = new Date("2024-01-15T00:00:00Z");
    const endDate = new Date("2024-01-20T00:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 9,
      minute: 30,
    });
    expect(result.startDate.getUTCHours()).toBe(9);
    expect(result.startDate.getUTCMinutes()).toBe(30);
    expect(result.endDate.getTime() - result.startDate.getTime()).toBe(5 * 24 * 60 * 60 * 1000);
  });

  it("updates schedule status via Drizzle ORM", async () => {
    await testDb.drizzleDb
      .update(testDb.sqliteNotificationSchedules)
      .set({ isActive: false })
      .where(eq(testDb.sqliteNotificationSchedules.id, "sched-1"));

    const schedules = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationSchedules)
      .where(eq(testDb.sqliteNotificationSchedules.isActive, false));
    expect(schedules).toHaveLength(2);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteNotificationSchedules).values({
          id: "sched-4",
          name: "New",
          notificationType: "custom",
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          hour: 10,
          minute: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: "user-1",
        });
        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const schedules = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteNotificationSchedules);
    expect(schedules).toHaveLength(3);
  });
});
