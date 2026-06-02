import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteGroups, sqliteCoinTransactions } from "./coin-sqlite-schema";

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
  
  const drizzleDb = drizzle(db, { schema: { sqliteGroups, sqliteCoinTransactions } });
  
  return { db, drizzleDb, sqliteGroups, sqliteCoinTransactions };
}
