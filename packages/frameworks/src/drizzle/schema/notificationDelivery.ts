import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";

/**
 * Notification Delivery Status enum
 */
export const deliveryStatusEnum = pgEnum("DeliveryStatus", [
  "pending",
  "success",
  "partial_failure",
  "failure",
]);

/**
 * Notification Deliveries table - matches Prisma NotificationDelivery model
 */
export const notificationDeliveries = pgTable(
  "NotificationDelivery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId").references(() => trips.id, { onDelete: "cascade" }),
    notificationId: uuid("notificationId").notNull().unique(),
    scheduleId: uuid("scheduleId"),
    deliveryStartedAt: timestamp("deliveryStartedAt", { mode: "date" }),
    deliveryCompletedAt: timestamp("deliveryCompletedAt", { mode: "date" }),
    totalRecipients: integer("totalRecipients"),
    successCount: integer("successCount"),
    failureCount: integer("failureCount"),
    errors: text("errors"),
    status: deliveryStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("notification_deliveries_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
  ],
);

export type NotificationDeliveryInsert =
  typeof notificationDeliveries.$inferInsert;
export type NotificationDeliverySelect =
  typeof notificationDeliveries.$inferSelect;

/**
 * Notification Schedule Executions table
 */
export const notificationScheduleExecutions = pgTable(
  "NotificationScheduleExecution",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("scheduleId").notNull(),
    notificationId: uuid("notificationId").notNull().unique(),
    executedAt: timestamp("executedAt", { mode: "date" })
      .notNull()
      .defaultNow(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
  },
  (table) => [
    // Composite index for cursor pagination on executedAt
    index("notification_schedule_executions_executed_at_id_idx").on(
      table.executedAt,
      table.id,
    ),
  ],
);

export type NotificationScheduleExecutionInsert =
  typeof notificationScheduleExecutions.$inferInsert;
export type NotificationScheduleExecutionSelect =
  typeof notificationScheduleExecutions.$inferSelect;

/**
 * Notification Schedules table
 */
export const notificationSchedules = pgTable(
  "NotificationSchedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    notificationType: varchar("notificationType", { length: 50 }).notNull(),
    content: text("content").notNull(),
    scheduledFor: timestamp("scheduledFor", { mode: "date" }).notNull(),
    sendToAll: boolean("sendToAll").notNull().default(false),
    targetGroupIds: text("targetGroupIds").array(),
    isSent: boolean("isSent").notNull().default(false),
    isDraft: boolean("isDraft").notNull().default(false),
    createdBy: uuid("createdBy").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("notification_schedules_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
  ],
);

export type NotificationScheduleInsert =
  typeof notificationSchedules.$inferInsert;
export type NotificationScheduleSelect =
  typeof notificationSchedules.$inferSelect;
