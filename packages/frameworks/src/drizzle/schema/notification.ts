import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";

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
export const notifications = pgTable("Notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId").references(() => trips.id),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  url: text("url"),
  priority: notificationPriorityEnum("priority").notNull().default("NORMAL"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  createdById: uuid("createdById").notNull(),
});

export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;

/**
 * Notification Schedules table
 */
export const notificationSchedules = pgTable("NotificationSchedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId").references(() => trips.id),
  name: varchar("name", { length: 255 }).notNull(),
  notificationType: varchar("notificationType", { length: 50 }).notNull(),
  notificationTitle: varchar("notificationTitle", { length: 255 }),
  notificationBody: text("notificationBody"),
  notificationUrl: text("notificationUrl"),
  startDate: timestamp("startDate", { mode: "date" }).notNull(),
  endDate: timestamp("endDate", { mode: "date" }).notNull(),
  hour: integer("hour").notNull(),
  minute: integer("minute").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  lastRun: timestamp("lastRun", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  createdById: uuid("createdById").notNull(),
});

export type NotificationScheduleInsert =
  typeof notificationSchedules.$inferInsert;
export type NotificationScheduleSelect =
  typeof notificationSchedules.$inferSelect;

/**
 * Push Subscriptions table
 */
export const pushSubscriptions = pgTable("PushSubscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull(),
  expoPushToken: varchar("expoPushToken", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type PushSubscriptionInsert = typeof pushSubscriptions.$inferInsert;
export type PushSubscriptionSelect = typeof pushSubscriptions.$inferSelect;
