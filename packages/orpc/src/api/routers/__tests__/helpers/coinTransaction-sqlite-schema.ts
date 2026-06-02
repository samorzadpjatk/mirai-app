import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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

export const sqliteCoinTransactions = sqliteTable("coin_transactions", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  adminId: text("admin_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

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
