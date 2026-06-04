import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { challenges } from "./challenges";

export const challengeQrCode = pgTable("challenge_qr_code", {
  challengeId: varchar("challenge_id", { length: 36 })
    .primaryKey()
    .references(() => challenges.id, { onDelete: "cascade" }),
  expectedValue: text("expected_value").notNull(),
});
