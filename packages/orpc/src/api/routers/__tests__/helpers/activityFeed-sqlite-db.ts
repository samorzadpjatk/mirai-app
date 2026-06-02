import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  sqliteActivityFeeds,
  sqliteActivityReactions,
  sqliteUserPosts,
  sqliteSubmissionActivities,
  sqliteChallengeActivities,
  sqliteRankChangeActivities,
  sqliteGroups,
  sqliteChallenges,
  sqliteChallengeSubmissions,
  sqliteTrips,
  sqliteTripParticipants,
  sqliteUsers,
} from "./activityFeed-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_feeds (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      is_pinned INTEGER DEFAULT 0 NOT NULL,
      is_hidden INTEGER DEFAULT 0 NOT NULL,
      hidden_by_admin TEXT,
      hidden_at INTEGER,
      hidden_reason TEXT,
      created_by_admin TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_reactions (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_posts (
      activity_id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      additional_images TEXT DEFAULT '[]' NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS submission_activities (
      activity_id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      has_video INTEGER NOT NULL,
      is_winner INTEGER DEFAULT 0 NOT NULL,
      ranking INTEGER,
      points_awarded INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_activities (
      activity_id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      end_time INTEGER,
      submission_type TEXT,
      base_points INTEGER,
      submission_count INTEGER
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rank_change_activities (
      activity_id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      new_rank INTEGER NOT NULL,
      total_coins INTEGER NOT NULL,
      coins_gained INTEGER NOT NULL
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
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      submission_type TEXT NOT NULL,
      scoring_category TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0 NOT NULL,
      daily_start_time TEXT,
      daily_end_time TEXT,
      base_points INTEGER DEFAULT 0 NOT NULL,
      first_place_points INTEGER,
      second_place_points INTEGER,
      third_place_points INTEGER,
      status TEXT DEFAULT 'HIDDEN' NOT NULL,
      start_time INTEGER,
      end_time INTEGER,
      voting_start_time INTEGER,
      voting_end_time INTEGER,
      target_latitude REAL,
      target_longitude REAL,
      expected_value TEXT,
      auto_approve INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      image_ids TEXT DEFAULT '[]' NOT NULL,
      video_id TEXT,
      text_content TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      reviewed_by_id TEXT,
      reviewed_at INTEGER,
      rejection_reason TEXT,
      awarded_points INTEGER DEFAULT 0 NOT NULL,
      bonus_points INTEGER DEFAULT 0 NOT NULL,
      ranking INTEGER,
      vote_count INTEGER DEFAULT 0 NOT NULL,
      vote_score REAL DEFAULT 0 NOT NULL,
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
      sqliteActivityFeeds,
      sqliteActivityReactions,
      sqliteUserPosts,
      sqliteSubmissionActivities,
      sqliteChallengeActivities,
      sqliteRankChangeActivities,
      sqliteGroups,
      sqliteChallenges,
      sqliteChallengeSubmissions,
      sqliteTrips,
      sqliteTripParticipants,
      sqliteUsers,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteActivityFeeds,
    sqliteActivityReactions,
    sqliteUserPosts,
    sqliteSubmissionActivities,
    sqliteChallengeActivities,
    sqliteRankChangeActivities,
    sqliteGroups,
    sqliteChallenges,
    sqliteChallengeSubmissions,
    sqliteTrips,
    sqliteTripParticipants,
    sqliteUsers,
  };
}

export async function seedUser(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; authUserId: string; firstName: string; lastName: string; role?: string },
) {
  return db.insert(sqliteUsers).values({
    role: "USER",
    ...data,
  }).returning();
}

export async function seedTrip(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; name: string; description?: string; startDate: Date; endDate: Date },
) {
  return db.insert(sqliteTrips).values(data).returning();
}

export async function seedGroup(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; tripId: string; name: string; description?: string; image?: string; organizerId: string; code: string; coins?: number },
) {
  return db.insert(sqliteGroups).values({
    coins: 0,
    ...data,
  }).returning();
}

export async function seedTripParticipant(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; userId: string; tripId: string; groupId?: string; wristNumber?: string; houseNumber?: string; role?: string },
) {
  return db.insert(sqliteTripParticipants).values({
    role: "MEMBER",
    ...data,
  }).returning();
}

export async function seedChallenge(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; tripId: string; name: string; description?: string; image?: string; submissionType: string; scoringCategory: string; basePoints?: number; status?: string },
) {
  return db.insert(sqliteChallenges).values({
    isRecurring: false,
    basePoints: 0,
    status: "HIDDEN",
    autoApprove: false,
    ...data,
  }).returning();
}

export async function seedChallengeSubmission(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; challengeId: string; groupId: string; imageIds?: string; videoId?: string; textContent?: string; status?: string; awardedPoints?: number; bonusPoints?: number; voteCount?: number; voteScore?: number },
) {
  return db.insert(sqliteChallengeSubmissions).values({
    imageIds: "[]",
    status: "PENDING",
    awardedPoints: 0,
    bonusPoints: 0,
    voteCount: 0,
    voteScore: 0,
    ...data,
  }).returning();
}

export async function seedActivityFeed(
  db: ReturnType<typeof createTestDb>["drizzleDb"],
  data: { id: string; tripId: string; activityType: string; title: string; description?: string; imageUrl?: string; isPinned?: boolean; isHidden?: boolean; hiddenByAdmin?: string; hiddenAt?: Date; hiddenReason?: string; createdByAdmin?: string },
) {
  return db.insert(sqliteActivityFeeds).values({
    isPinned: false,
    isHidden: false,
    ...data,
  }).returning();
}


