import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteSponsors, sqliteTripSponsors } from "./sponsor-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS sponsors (
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
    CREATE TABLE IF NOT EXISTS trip_sponsors (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      sponsor_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  
  const drizzleDb = drizzle(db, { schema: { sqliteSponsors, sqliteTripSponsors } });
  
  return { db, drizzleDb, sqliteSponsors, sqliteTripSponsors };
}
