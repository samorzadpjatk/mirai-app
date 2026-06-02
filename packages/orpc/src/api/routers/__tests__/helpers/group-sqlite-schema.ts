import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const groupSchemaSql = `
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
  );

  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date INTEGER NOT NULL,
    end_date INTEGER NOT NULL,
    background_image_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

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
  );

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
  );

  CREATE TABLE IF NOT EXISTS group_join_requests (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(trip_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS coin_transactions (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    admin_id TEXT NOT NULL
  );

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
  );

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
  );

  CREATE TABLE IF NOT EXISTS rank_change_activities (
    activity_id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    new_rank INTEGER NOT NULL,
    total_coins INTEGER NOT NULL,
    coins_gained INTEGER NOT NULL
  );
`;

export const sqliteUsers = sqliteTable("users", {
  id: text("id").primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  hasAvatar: integer("has_avatar", { mode: "boolean" }).default(false).notNull(),
  role: text("role").default("USER").notNull(),
  lastSeenOn: integer("last_seen_on", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTrips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  backgroundImagePath: text("background_image_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteGroups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  organizerId: text("organizer_id").notNull(),
  code: text("code").notNull().unique(),
  coins: integer("coins").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripParticipants = sqliteTable("trip_participants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tripId: text("trip_id").notNull(),
  groupId: text("group_id"),
  wristNumber: text("wrist_number"),
  houseNumber: text("house_number"),
  role: text("role").default("MEMBER").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteGroupJoinRequests = sqliteTable("group_join_requests", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  groupId: text("group_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteCoinTransactions = sqliteTable("coin_transactions", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  adminId: text("admin_id").notNull(),
});

export const sqliteChallengeSubmissions = sqliteTable("challenge_submissions", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull(),
  groupId: text("group_id").notNull(),
  imageIds: text("image_ids").default("[]").notNull(),
  videoId: text("video_id"),
  textContent: text("text_content"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status").default("PENDING").notNull(),
  reviewedById: text("reviewed_by_id"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  rejectionReason: text("rejection_reason"),
  awardedPoints: integer("awarded_points").default(0).notNull(),
  bonusPoints: integer("bonus_points").default(0).notNull(),
  ranking: integer("ranking"),
  voteCount: integer("vote_count").default(0).notNull(),
  voteScore: real("vote_score").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteActivityFeeds = sqliteTable("activity_feeds", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  activityType: text("activity_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false).notNull(),
  isHidden: integer("is_hidden", { mode: "boolean" }).default(false).notNull(),
  hiddenByAdmin: text("hidden_by_admin"),
  hiddenAt: integer("hidden_at", { mode: "timestamp" }),
  hiddenReason: text("hidden_reason"),
  createdByAdmin: text("created_by_admin"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteRankChangeActivities = sqliteTable("rank_change_activities", {
  activityId: text("activity_id").primaryKey(),
  groupId: text("group_id").notNull(),
  newRank: integer("new_rank").notNull(),
  totalCoins: integer("total_coins").notNull(),
  coinsGained: integer("coins_gained").notNull(),
});
