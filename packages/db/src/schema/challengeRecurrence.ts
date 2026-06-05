import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { challenges } from "./challenges";

export const challengeRecurrence = pgTable("challenge_recurrence", {
  challengeId: varchar("challenge_id", { length: 36 })
    .primaryKey()
    .references(() => challenges.id, { onDelete: "cascade" }),
  dailyStartTime: text("daily_start_time").notNull(),
  dailyEndTime: text("daily_end_time").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringDays: integer("recurring_days").default(0).notNull(),
  type: text("type").default("DAILY").notNull(),
});
