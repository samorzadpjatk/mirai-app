import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";
import { groups } from "./group";

/**
 * Reward Purchase Status enum
 */
export const rewardPurchaseStatusEnum = pgEnum("RewardPurchaseStatus", [
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
]);

/**
 * Rewards table - matches Prisma Reward model
 */
export const rewards = pgTable(
  "Reward",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    availableQuantity: integer("availableQuantity").notNull(),
    isHidden: boolean("isHidden").notNull().default(false),
    image: text("image"),
    coinCost: integer("coinCost").notNull(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    createdById: uuid("createdById").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("rewards_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type RewardInsert = typeof rewards.$inferInsert;
export type RewardSelect = typeof rewards.$inferSelect;

/**
 * Reward Purchases table
 */
export const rewardPurchases = pgTable(
  "RewardPurchase",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rewardId: uuid("rewardId")
      .notNull()
      .references(() => rewards.id, { onDelete: "cascade" }),
    groupId: uuid("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    totalCost: integer("totalCost").notNull(),
    status: rewardPurchaseStatusEnum("status").notNull().default("BOUGHT"),
    collectionMethod: varchar("collectionMethod", { length: 100 }),
    purchasedById: uuid("purchasedById").notNull(),
    statusUpdatedById: uuid("statusUpdatedById"),
    statusUpdatedAt: timestamp("statusUpdatedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("reward_purchases_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type RewardPurchaseInsert = typeof rewardPurchases.$inferInsert;
export type RewardPurchaseSelect = typeof rewardPurchases.$inferSelect;
