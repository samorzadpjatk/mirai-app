import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteNotifications,
  sqliteNotificationSchedules,
  sqliteNotificationScheduleExecutions,
  sqliteNotificationDeliveries,
} from "./notification-sqlite-schema";

export function createNotificationTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by_id TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_schedules (
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_schedule_executions (
      notification_id TEXT NOT NULL,
      schedule_id TEXT NOT NULL,
      executed_at INTEGER NOT NULL,
      PRIMARY KEY (notification_id, schedule_id, executed_at)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_deliveries (
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

  const drizzleDb = drizzle(db, {
    schema: {
      sqliteNotifications,
      sqliteNotificationSchedules,
      sqliteNotificationScheduleExecutions,
      sqliteNotificationDeliveries,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteNotifications,
    sqliteNotificationSchedules,
    sqliteNotificationScheduleExecutions,
    sqliteNotificationDeliveries,
  };
}
