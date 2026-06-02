import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteLocations,
  sqliteLocationSharingRequests,
  sqliteLocationShares,
  sqliteUsers,
} from "./location-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS location_sharing_requests (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS location_shares (
      location_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (location_id, user_id)
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

  const drizzleDb = drizzle(db, {
    schema: {
      sqliteLocations,
      sqliteLocationSharingRequests,
      sqliteLocationShares,
      sqliteUsers,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteLocations,
    sqliteLocationSharingRequests,
    sqliteLocationShares,
    sqliteUsers,
  };
}
