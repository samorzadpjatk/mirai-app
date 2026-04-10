import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";

/**
 * Activity Feed table - matches Prisma ActivityFeed model
 */
export const activityFeed = pgTable("ActivityFeed", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  activityType: varchar("activityType", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  isPinned: boolean("isPinned").notNull().default(false),
  isHidden: boolean("isHidden").notNull().default(false),
  hiddenByAdmin: uuid("hiddenByAdmin"),
  hiddenAt: timestamp("hiddenAt", { mode: "date" }),
  hiddenReason: text("hiddenReason"),
  createdByAdmin: uuid("createdByAdmin"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type ActivityFeedInsert = typeof activityFeed.$inferInsert;
export type ActivityFeedSelect = typeof activityFeed.$inferSelect;

/**
 * Activity Reactions table
 */
export const activityReactions = pgTable("ActivityReaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  activityId: uuid("activityId")
    .notNull()
    .references(() => activityFeed.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull(),
  reactionType: varchar("reactionType", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type ActivityReactionInsert = typeof activityReactions.$inferInsert;
export type ActivityReactionSelect = typeof activityReactions.$inferSelect;
