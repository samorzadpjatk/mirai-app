import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteGroups, sqliteCoinTransactions, sqliteUsers } from "./coinTransaction-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT,
      admin_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
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

  const drizzleDb = drizzle(db, { schema: { sqliteGroups, sqliteCoinTransactions, sqliteUsers } });

  return { db, drizzleDb, sqliteGroups, sqliteCoinTransactions, sqliteUsers };
}

export async function seedUser(
  drizzleDb: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; authUserId: string; firstName: string; lastName: string; role?: string }
) {
  return drizzleDb.insert(sqliteUsers).values({
    ...data,
    role: data.role ?? "USER",
  }).returning().get();
}

export async function seedGroup(
  drizzleDb: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; tripId: string; name: string; organizerId: string; code: string; coins?: number }
) {
  return drizzleDb.insert(sqliteGroups).values({
    ...data,
    coins: data.coins ?? 0,
  }).returning().get();
}

export async function seedCoinTransaction(
  drizzleDb: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; groupId: string; amount: number; reason?: string; adminId: string }
) {
  return drizzleDb.insert(sqliteCoinTransactions).values(data).returning().get();
}
