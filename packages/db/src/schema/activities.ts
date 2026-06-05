import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { challengeSubmissions, challenges } from "./challenges";
import { submissionTypeEnum } from "./enums";
import { groups } from "./groups";
import { trips } from "./trips";
import { tripParticipants } from "./trips";
import { users } from "./users";

export const activityFeeds = pgTable(
  "activity_feeds",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    hiddenByAdmin: varchar("hidden_by_admin", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    hiddenReason: text("hidden_reason"),
    createdByAdmin: varchar("created_by_admin", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("activity_feeds_trip_id_created_at_idx").on(t.tripId, t.createdAt),
    index("activity_feeds_trip_id_is_pinned_idx").on(t.tripId, t.isPinned),
    index("activity_feeds_trip_id_is_hidden_idx").on(t.tripId, t.isHidden),
    index("activity_feeds_trip_id_activity_type_idx").on(t.tripId, t.activityType),
  ],
);

export const activityReactions = pgTable(
  "activity_reactions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    activityId: varchar("activity_id", { length: 36 })
      .notNull()
      .references(() => activityFeeds.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("activity_reactions_activity_id_user_id_reaction_type_unique").on(
      t.activityId,
      t.userId,
      t.reactionType,
    ),
    index("activity_reactions_activity_id_idx").on(t.activityId),
    index("activity_reactions_user_id_idx").on(t.userId),
  ],
);

export const submissionActivities = pgTable(
  "submission_activities",
  {
    activityId: varchar("activity_id", { length: 36 })
      .primaryKey()
      .references(() => activityFeeds.id, { onDelete: "cascade" }),
    submissionId: varchar("submission_id", { length: 36 })
      .notNull()
      .references(() => challengeSubmissions.id, { onDelete: "cascade" }),
    challengeId: varchar("challenge_id", { length: 36 })
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    hasVideo: boolean("has_video").notNull(),
    isWinner: boolean("is_winner").default(false).notNull(),
    ranking: integer("ranking"),
    pointsAwarded: integer("points_awarded"),
  },
  (t) => [
    index("submission_activities_submission_id_idx").on(t.submissionId),
    index("submission_activities_challenge_id_idx").on(t.challengeId),
    index("submission_activities_group_id_idx").on(t.groupId),
    index("submission_activities_is_winner_idx").on(t.isWinner),
  ],
);

export const challengeActivities = pgTable(
  "challenge_activities",
  {
    activityId: varchar("activity_id", { length: 36 })
      .primaryKey()
      .references(() => activityFeeds.id, { onDelete: "cascade" }),
    challengeId: varchar("challenge_id", { length: 36 })
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    submissionType: submissionTypeEnum("submission_type"),
    basePoints: integer("base_points"),
    submissionCount: integer("submission_count"),
  },
  (t) => [
    index("challenge_activities_challenge_id_idx").on(t.challengeId),
    index("challenge_activities_event_type_idx").on(t.eventType),
  ],
);

export const rankChangeActivities = pgTable(
  "rank_change_activities",
  {
    activityId: varchar("activity_id", { length: 36 })
      .primaryKey()
      .references(() => activityFeeds.id, { onDelete: "cascade" }),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    newRank: integer("new_rank").notNull(),
    totalCoins: integer("total_coins").notNull(),
    coinsGained: integer("coins_gained").notNull(),
  },
  (t) => [
    index("rank_change_activities_group_id_idx").on(t.groupId),
    index("rank_change_activities_new_rank_idx").on(t.newRank),
  ],
);

export const userPosts = pgTable(
  "user_posts",
  {
    activityId: varchar("activity_id", { length: 36 })
      .primaryKey()
      .references(() => activityFeeds.id, { onDelete: "cascade" }),
    authorId: varchar("author_id", { length: 36 })
      .notNull()
      .references(() => tripParticipants.id, { onDelete: "cascade" }),
    additionalImages: text("additional_images").array().default([]).notNull(),
  },
  (t) => [index("user_posts_author_id_idx").on(t.authorId)],
);
