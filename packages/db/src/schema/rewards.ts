import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { rewardPurchaseStatusEnum } from "./enums";
import { groups } from "./groups";
import { trips } from "./trips";
import { users } from "./users";

export const rewards = pgTable(
  "rewards",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    availableQuantity: integer("available_quantity").notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    image: text("image"),
    coinCost: integer("coin_cost").notNull(),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id),
    createdById: varchar("created_by_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("rewards_trip_id_idx").on(t.tripId)],
);

export const rewardPurchases = pgTable(
  "reward_purchases",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    rewardId: varchar("reward_id", { length: 36 })
      .notNull()
      .references(() => rewards.id),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id),
    quantity: integer("quantity").notNull(),
    totalCost: integer("total_cost").notNull(),
    status: rewardPurchaseStatusEnum("status").default("BOUGHT").notNull(),
    collectionMethod: text("collection_method"),
    purchasedById: varchar("purchased_by_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    statusUpdatedById: varchar("status_updated_by_id", { length: 36 }).references(() => users.id),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).defaultNow().notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("reward_purchases_reward_id_idx").on(t.rewardId),
    index("reward_purchases_group_id_idx").on(t.groupId),
    index("reward_purchases_status_idx").on(t.status),
    index("reward_purchases_status_updated_by_id_idx").on(t.statusUpdatedById),
  ],
);

export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  groupId: varchar("group_id", { length: 36 })
    .notNull()
    .references(() => groups.id),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  adminId: varchar("admin_id", { length: 36 })
    .notNull()
    .references(() => users.id),
});
