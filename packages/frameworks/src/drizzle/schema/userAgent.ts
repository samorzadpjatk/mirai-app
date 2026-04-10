import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

/**
 * UserAgent table - matches Prisma UserAgent model
 * Used for telemetry and mobile app tracking
 */
export const userAgents = pgTable("UserAgent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userAgent: text("userAgent").notNull(),
  platform: varchar("platform", { length: 50 }),
  userId: uuid("userId"),
  endpoint: varchar("endpoint", { length: 255 }),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type UserAgentInsert = typeof userAgents.$inferInsert;
export type UserAgentSelect = typeof userAgents.$inferSelect;
