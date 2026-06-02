import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

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
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteActivityReactions = sqliteTable("activity_reactions", {
  id: text("id").primaryKey(),
  activityId: text("activity_id").notNull(),
  userId: text("user_id").notNull(),
  reactionType: text("reaction_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteUserPosts = sqliteTable("user_posts", {
  activityId: text("activity_id").primaryKey(),
  authorId: text("author_id").notNull(),
  additionalImages: text("additional_images").default("[]").notNull(),
});

export const sqliteSubmissionActivities = sqliteTable("submission_activities", {
  activityId: text("activity_id").primaryKey(),
  submissionId: text("submission_id").notNull(),
  challengeId: text("challenge_id").notNull(),
  groupId: text("group_id").notNull(),
  hasVideo: integer("has_video", { mode: "boolean" }).notNull(),
  isWinner: integer("is_winner", { mode: "boolean" }).default(false).notNull(),
  ranking: integer("ranking"),
  pointsAwarded: integer("points_awarded"),
});

export const sqliteChallengeActivities = sqliteTable("challenge_activities", {
  activityId: text("activity_id").primaryKey(),
  challengeId: text("challenge_id").notNull(),
  eventType: text("event_type").notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  submissionType: text("submission_type"),
  basePoints: integer("base_points"),
  submissionCount: integer("submission_count"),
});

export const sqliteRankChangeActivities = sqliteTable("rank_change_activities", {
  activityId: text("activity_id").primaryKey(),
  groupId: text("group_id").notNull(),
  newRank: integer("new_rank").notNull(),
  totalCoins: integer("total_coins").notNull(),
  coinsGained: integer("coins_gained").notNull(),
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteChallenges = sqliteTable("challenges", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  submissionType: text("submission_type").notNull(),
  scoringCategory: text("scoring_category").notNull(),
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false).notNull(),
  dailyStartTime: text("daily_start_time"),
  dailyEndTime: text("daily_end_time"),
  basePoints: integer("base_points").default(0).notNull(),
  firstPlacePoints: integer("first_place_points"),
  secondPlacePoints: integer("second_place_points"),
  thirdPlacePoints: integer("third_place_points"),
  status: text("status").default("HIDDEN").notNull(),
  startTime: integer("start_time", { mode: "timestamp" }),
  endTime: integer("end_time", { mode: "timestamp" }),
  votingStartTime: integer("voting_start_time", { mode: "timestamp" }),
  votingEndTime: integer("voting_end_time", { mode: "timestamp" }),
  targetLatitude: real("target_latitude"),
  targetLongitude: real("target_longitude"),
  expectedValue: text("expected_value"),
  autoApprove: integer("auto_approve", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
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
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteTrips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  backgroundImagePath: text("background_image_path"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteTripParticipants = sqliteTable("trip_participants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tripId: text("trip_id").notNull(),
  groupId: text("group_id"),
  wristNumber: text("wrist_number"),
  houseNumber: text("house_number"),
  role: text("role").default("MEMBER").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sqliteUsers = sqliteTable("users", {
  id: text("id").primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  hasAvatar: integer("has_avatar", { mode: "boolean" }).default(false).notNull(),
  role: text("role").default("USER").notNull(),
  lastSeenOn: integer("last_seen_on", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
