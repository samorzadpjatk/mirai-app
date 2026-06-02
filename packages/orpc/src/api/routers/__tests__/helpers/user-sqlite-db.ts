import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteUsers,
  sqliteTripParticipants,
  sqliteGroups,
  sqliteTrips,
  sqliteUsersRelations,
  sqliteTripParticipantsRelations,
  sqliteGroupsRelations,
  sqliteTripsRelations,
} from "./user-sqlite-schema";

export function createUserTestDb() {
  const db = new Database(":memory:");

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
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, trip_id)
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

  const drizzleDb = drizzle(db, {
    schema: {
      users: sqliteUsers,
      tripParticipants: sqliteTripParticipants,
      groups: sqliteGroups,
      trips: sqliteTrips,
      sqliteUsersRelations,
      sqliteTripParticipantsRelations,
      sqliteGroupsRelations,
      sqliteTripsRelations,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteUsers,
    sqliteTripParticipants,
    sqliteGroups,
    sqliteTrips,
  };
}

export function seedUser(
  drizzleDb: ReturnType<typeof createUserTestDb>["drizzleDb"],
  overrides: Partial<{
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    hasAvatar: boolean;
    role: string;
    lastSeenOn: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();
  const values = {
    id,
    authUserId: overrides.authUserId ?? `auth_${id}`,
    firstName: overrides.firstName ?? "Test",
    lastName: overrides.lastName ?? "User",
    hasAvatar: overrides.hasAvatar ?? false,
    role: overrides.role ?? "USER",
    lastSeenOn: overrides.lastSeenOn ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
  return drizzleDb.insert(sqliteUsers).values(values).returning().get();
}

export function seedParticipant(
  drizzleDb: ReturnType<typeof createUserTestDb>["drizzleDb"],
  overrides: Partial<{
    id: string;
    userId: string;
    tripId: string;
    groupId: string;
    wristNumber: string;
    houseNumber: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();
  const values = {
    id,
    userId: overrides.userId ?? crypto.randomUUID(),
    tripId: overrides.tripId ?? crypto.randomUUID(),
    groupId: overrides.groupId ?? null,
    wristNumber: overrides.wristNumber ?? null,
    houseNumber: overrides.houseNumber ?? null,
    role: overrides.role ?? "MEMBER",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
  return drizzleDb.insert(sqliteTripParticipants).values(values).returning().get();
}

export function seedGroup(
  drizzleDb: ReturnType<typeof createUserTestDb>["drizzleDb"],
  overrides: Partial<{
    id: string;
    tripId: string;
    name: string;
    description: string;
    image: string;
    isDeleted: boolean;
    organizerId: string;
    code: string;
    coins: number;
    createdAt: Date;
    updatedAt: Date;
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();
  const values = {
    id,
    tripId: overrides.tripId ?? crypto.randomUUID(),
    name: overrides.name ?? "Test Group",
    description: overrides.description ?? null,
    image: overrides.image ?? null,
    isDeleted: overrides.isDeleted ?? false,
    organizerId: overrides.organizerId ?? crypto.randomUUID(),
    code: overrides.code ?? `CODE_${id.slice(0, 8)}`,
    coins: overrides.coins ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
  return drizzleDb.insert(sqliteGroups).values(values).returning().get();
}

export function seedTrip(
  drizzleDb: ReturnType<typeof createUserTestDb>["drizzleDb"],
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    backgroundImagePath: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {}
) {
  const id = overrides.id ?? crypto.randomUUID();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const values = {
    id,
    name: overrides.name ?? "Test Trip",
    description: overrides.description ?? null,
    startDate: overrides.startDate ?? now,
    endDate: overrides.endDate ?? tomorrow,
    backgroundImagePath: overrides.backgroundImagePath ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
  return drizzleDb.insert(sqliteTrips).values(values).returning().get();
}
