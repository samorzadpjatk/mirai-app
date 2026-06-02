import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sqliteUsers, sqliteTripParticipants, sqliteGroups } from "./trip-sqlite-schema";

export const sqliteNotifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  tripId: text("trip_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull(),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteNotificationPushes = sqliteTable("notification_pushes", {
  id: text("id").primaryKey(),
  notificationId: text("notification_id").notNull(),
  targetUserId: text("target_user_id").notNull(),
  status: text("status").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  failureReason: text("failure_reason"),
});

export const sqlitePushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteNotificationsRelations = relations(sqliteNotifications, ({ one, many }) => ({
  createdBy: one(sqliteUsers, {
    fields: [sqliteNotifications.createdById],
    references: [sqliteUsers.id],
  }),
  pushes: many(sqliteNotificationPushes),
}));

export const sqliteNotificationPushesRelations = relations(sqliteNotificationPushes, ({ one }) => ({
  notification: one(sqliteNotifications, {
    fields: [sqliteNotificationPushes.notificationId],
    references: [sqliteNotifications.id],
  }),
  targetUser: one(sqliteUsers, {
    fields: [sqliteNotificationPushes.targetUserId],
    references: [sqliteUsers.id],
  }),
}));

export const sqlitePushSubscriptionsRelations = relations(sqlitePushSubscriptions, ({ one }) => ({
  user: one(sqliteUsers, {
    fields: [sqlitePushSubscriptions.userId],
    references: [sqliteUsers.id],
  }),
}));
