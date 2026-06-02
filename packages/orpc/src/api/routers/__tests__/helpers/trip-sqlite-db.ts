import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteTrips,
  sqliteTripParticipants,
  sqliteTripResources,
  sqliteTripInsurances,
  sqliteTripInsuranceSteps,
  sqliteGroups,
  sqliteTripSponsors,
  sqliteSponsors,
  sqliteUsers,
  sqliteTripsRelations,
  sqliteGroupsRelations,
  sqliteTripParticipantsRelations,
  sqliteTripResourcesRelations,
  sqliteTripInsurancesRelations,
  sqliteTripInsuranceStepsRelations,
  sqliteTripSponsorsRelations,
  sqliteSponsorsRelations,
  sqliteUsersRelations,
} from "./trip-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      background_image_path TEXT,
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
    CREATE TABLE IF NOT EXISTS trip_resources (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      url TEXT,
      storage_path TEXT,
      file_name TEXT,
      public_url TEXT,
      icon_name TEXT,
      value TEXT,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_insurances (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      phone_display TEXT NOT NULL,
      policy_number TEXT NOT NULL,
      contract_number TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      hospital_name TEXT,
      hospital_address TEXT,
      hospital_distance TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_insurance_steps (
      id TEXT PRIMARY KEY,
      insurance_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      required_info TEXT,
      example_call TEXT,
      additional_text TEXT,
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_sponsors (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      sponsor_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

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
      trips: sqliteTrips,
      tripParticipants: sqliteTripParticipants,
      tripResources: sqliteTripResources,
      tripInsurances: sqliteTripInsurances,
      tripInsuranceSteps: sqliteTripInsuranceSteps,
      groups: sqliteGroups,
      tripSponsors: sqliteTripSponsors,
      sponsors: sqliteSponsors,
      users: sqliteUsers,
      sqliteTripsRelations,
      sqliteGroupsRelations,
      sqliteTripParticipantsRelations,
      sqliteTripResourcesRelations,
      sqliteTripInsurancesRelations,
      sqliteTripInsuranceStepsRelations,
      sqliteTripSponsorsRelations,
      sqliteSponsorsRelations,
      sqliteUsersRelations,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteTrips,
    sqliteTripParticipants,
    sqliteTripResources,
    sqliteTripInsurances,
    sqliteTripInsuranceSteps,
    sqliteGroups,
    sqliteTripSponsors,
    sqliteSponsors,
    sqliteUsers,
  };
}
