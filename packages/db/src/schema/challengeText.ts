import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { challenges } from "./challenges";

export const challengeText = pgTable("challenge_text", {
  challengeId: varchar("challenge_id", { length: 36 })
    .primaryKey()
    .references(() => challenges.id, { onDelete: "cascade" }),
  expectedPhrase: text("expected_phrase").notNull(),
});
