import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteNotifications,
  sqliteNotificationPushes,
  sqlitePushSubscriptions,
  sqliteNotificationsRelations,
  sqliteNotificationPushesRelations,
  sqlitePushSubscriptionsRelations,
} from "./notifications-router-sqlite-schema";
import { sqliteUsers, sqliteTripParticipants, sqliteGroups } from "./trip-sqlite-schema";

export function createNotificationsTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      trip_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      url TEXT NOT NULL,
      created_by_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_pushes (
      id TEXT PRIMARY KEY,
      notification_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      sent_at INTEGER,
      failure_reason TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, token)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
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
    CREATE TABLE IF NOT EXISTS trip_participants (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      trip_id TEXT NOT NULL,
      group_id TEXT,
      wrist_number TEXT,
      house_number TEXT,
      role TEXT DEFAULT 'MEMBER' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
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

  const drizzleDb = drizzle(db, {
    schema: {
      notifications: sqliteNotifications,
      notificationPushes: sqliteNotificationPushes,
      pushSubscriptions: sqlitePushSubscriptions,
      users: sqliteUsers,
      tripParticipants: sqliteTripParticipants,
      groups: sqliteGroups,
      sqliteNotificationsRelations,
      sqliteNotificationPushesRelations,
      sqlitePushSubscriptionsRelations,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteNotifications,
    sqliteNotificationPushes,
    sqlitePushSubscriptions,
    sqliteUsers,
    sqliteTripParticipants,
    sqliteGroups,
  };
}

export async function seedNotification(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqliteNotifications.$inferInsert> & { id: string },
) {
  const [result] = await db.insert(sqliteNotifications).values({
    title: "Test Notification",
    body: "Test body",
    url: "/test",
    createdById: "user-123",
    ...data,
  }).returning();
  return result;
}

export async function seedNotificationPush(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqliteNotificationPushes.$inferInsert> & { id: string; notificationId: string; targetUserId: string },
) {
  const [result] = await db.insert(sqliteNotificationPushes).values({
    status: "pending",
    ...data,
  }).returning();
  return result;
}

export async function seedPushSubscription(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqlitePushSubscriptions.$inferInsert> & { id: string; userId: string; token: string },
) {
  const [result] = await db.insert(sqlitePushSubscriptions).values({
    ...data,
  }).returning();
  return result;
}

export async function seedUser(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqliteUsers.$inferInsert> & { id: string },
) {
  const [result] = await db.insert(sqliteUsers).values({
    authUserId: `auth-${data.id}`,
    firstName: "Test",
    lastName: "User",
    ...data,
  }).returning();
  return result;
}

export async function seedTripParticipant(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqliteTripParticipants.$inferInsert> & { id: string; userId: string; tripId: string },
) {
  const [result] = await db.insert(sqliteTripParticipants).values({
    ...data,
  }).returning();
  return result;
}

export async function seedGroup(
  db: ReturnType<typeof createNotificationsTestDb>["drizzleDb"],
  data: Partial<typeof sqliteGroups.$inferInsert> & { id: string; tripId: string; name: string; organizerId: string; code: string },
) {
  const [result] = await db.insert(sqliteGroups).values({
    ...data,
  }).returning();
  return result;
}
