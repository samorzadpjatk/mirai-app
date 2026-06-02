import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sqliteRewards = sqliteTable("rewards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  isHidden: integer("is_hidden", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  coinCost: integer("coin_cost").notNull(),
  tripId: text("trip_id").notNull(),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteRewardPurchases = sqliteTable("reward_purchases", {
  id: text("id").primaryKey(),
  rewardId: text("reward_id").notNull(),
  groupId: text("group_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalCost: integer("total_cost").notNull(),
  status: text("status").default("BOUGHT").notNull(),
  collectionMethod: text("collection_method"),
  purchasedById: text("purchased_by_id").notNull(),
  statusUpdatedById: text("status_updated_by_id"),
  statusUpdatedAt: integer("status_updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
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
