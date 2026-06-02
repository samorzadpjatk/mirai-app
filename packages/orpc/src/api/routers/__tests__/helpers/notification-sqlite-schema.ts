import { sqliteTable, text, integer, timestamp } from "drizzle-orm/sqlite-core";

export const sqliteNotifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  tripId: text("trip_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdById: text("created_by_id").notNull(),
});

export const sqliteNotificationSchedules = sqliteTable("notification_schedules", {
  id: text("id").primaryKey(),
  tripId: text("trip_id"),
  name: text("name").notNull(),
  notificationType: text("notification_type").notNull(),
  notificationTitle: text("notification_title"),
  notificationBody: text("notification_body"),
  notificationUrl: text("notification_url"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  hour: integer("hour").notNull(),
  minute: integer("minute").default(0).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  lastRun: integer("last_run", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdById: text("created_by_id").notNull(),
});

export const sqliteNotificationScheduleExecutions = sqliteTable("notification_schedule_executions", {
  notificationId: text("notification_id").notNull(),
  scheduleId: text("schedule_id").notNull(),
  executedAt: integer("executed_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteNotificationDeliveries = sqliteTable("notification_deliveries", {
  id: text("id").primaryKey(),
  tripId: text("trip_id"),
  notificationId: text("notification_id").notNull().unique(),
  scheduleId: text("schedule_id"),
  deliveryStartedAt: integer("delivery_started_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  deliveryCompletedAt: integer("delivery_completed_at", { mode: "timestamp" }),
  totalRecipients: integer("total_recipients").default(0).notNull(),
  successCount: integer("success_count").default(0).notNull(),
  failureCount: integer("failure_count").default(0).notNull(),
  errors: text("errors"),
  status: text("status").default("pending").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
