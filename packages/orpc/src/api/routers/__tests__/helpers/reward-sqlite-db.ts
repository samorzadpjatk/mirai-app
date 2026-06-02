import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteRewards, sqliteRewardPurchases, sqliteGroups, sqliteCoinTransactions } from "./reward-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      available_quantity INTEGER NOT NULL,
      is_hidden INTEGER DEFAULT 0 NOT NULL,
      image TEXT,
      coin_cost INTEGER NOT NULL,
      trip_id TEXT NOT NULL,
      created_by_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reward_purchases (
      id TEXT PRIMARY KEY,
      reward_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total_cost INTEGER NOT NULL,
      status TEXT DEFAULT 'BOUGHT' NOT NULL,
      collection_method TEXT,
      purchased_by_id TEXT NOT NULL,
      status_updated_by_id TEXT,
      status_updated_at INTEGER NOT NULL,
      purchased_at INTEGER NOT NULL
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

  const drizzleDb = drizzle(db, { schema: { sqliteRewards, sqliteRewardPurchases, sqliteGroups, sqliteCoinTransactions } });

  return { db, drizzleDb, sqliteRewards, sqliteRewardPurchases, sqliteGroups, sqliteCoinTransactions };
}
