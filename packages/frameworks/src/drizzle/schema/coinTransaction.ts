import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { trips } from "./trip";
import { groups } from "./group";
import { users } from "./user";

/**
 * Coin Transactions table - matches Prisma CoinTransaction model
 */
export const coinTransactions = pgTable("CoinTransaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  groupId: uuid("groupId")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  adminId: uuid("adminId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type CoinTransactionInsert = typeof coinTransactions.$inferInsert;
export type CoinTransactionSelect = typeof coinTransactions.$inferSelect;
