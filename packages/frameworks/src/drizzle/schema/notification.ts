import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";

/**
 * Notification Status enum
 */
export const notificationStatusEnum = pgEnum("NotificationStatus", [
  "DRAFT",
  "READY",
  "SENT",
  "FAILED",
  "CANCELLED",
]);

/**
 * Notification Priority enum
 */
export const notificationPriorityEnum = pgEnum("NotificationPriority", [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

/**
 * Notifications table - matches Prisma Notification model
 */
export const notifications = pgTable(
  "Notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId").references(() => trips.id),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    url: text("url"),
    status: notificationStatusEnum("status").notNull().default("DRAFT"),
    priority: notificationPriorityEnum("priority").notNull().default("NORMAL"),
    scheduledFor: timestamp("scheduledFor", { mode: "date" }),
    sentAt: timestamp("sentAt", { mode: "date" }),
    failureReason: text("failureReason"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
    createdById: uuid("createdById").notNull(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("notifications_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;

/**
 * Push Subscriptions table
 */
export const pushSubscriptions = pgTable(
  "PushSubscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").notNull(),
    expoPushToken: varchar("expoPushToken", { length: 255 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("push_subscriptions_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type PushSubscriptionInsert = typeof pushSubscriptions.$inferInsert;
export type PushSubscriptionSelect = typeof pushSubscriptions.$inferSelect;
