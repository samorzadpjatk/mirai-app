import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";
import { users } from "./users";

export const notificationSchedules = pgTable("notification_schedules", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).references(() => trips.id),
  name: text("name").notNull(),
  notificationType: text("notification_type").notNull(),
  notificationTitle: text("notification_title"),
  notificationBody: text("notification_body"),
  notificationUrl: text("notification_url"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  hour: integer("hour").notNull(),
  minute: integer("minute").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastRun: timestamp("last_run", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  createdById: varchar("created_by_id", { length: 36 })
    .notNull()
    .references(() => users.id),
});

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 }).references(() => trips.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  createdById: varchar("created_by_id", { length: 36 })
    .notNull()
    .references(() => users.id),
});

export const notificationScheduleExecutions = pgTable(
  "notification_schedule_executions",
  {
    notificationId: varchar("notification_id", { length: 36 })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    scheduleId: varchar("schedule_id", { length: 36 })
      .notNull()
      .references(() => notificationSchedules.id, { onDelete: "cascade" }),
    executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.notificationId, t.scheduleId, t.executedAt] })],
);

export const notificationPushes = pgTable(
  "notification_pushes",
  {
    targetUserId: varchar("target_user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationId: varchar("notification_id", { length: 36 })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
  },
  (t) => [primaryKey({ columns: [t.targetUserId, t.notificationId] })],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 }).references(() => trips.id),
    notificationId: varchar("notification_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => notifications.id, { onDelete: "cascade" }),
    scheduleId: varchar("schedule_id", { length: 36 }),
    deliveryStartedAt: timestamp("delivery_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveryCompletedAt: timestamp("delivery_completed_at", { withTimezone: true }),
    totalRecipients: integer("total_recipients").default(0).notNull(),
    successCount: integer("success_count").default(0).notNull(),
    failureCount: integer("failure_count").default(0).notNull(),
    errors: text("errors"),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("notification_deliveries_delivery_started_at_idx").on(t.deliveryStartedAt),
    index("notification_deliveries_status_idx").on(t.status),
    index("notification_deliveries_schedule_id_idx").on(t.scheduleId),
  ],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("push_subscriptions_user_id_token_unique").on(t.userId, t.token)],
);
