import { pgTable, real, varchar } from "drizzle-orm/pg-core";
import { challenges } from "./challenges";

export const challengeLocation = pgTable("challenge_location", {
  challengeId: varchar("challenge_id", { length: 36 })
    .primaryKey()
    .references(() => challenges.id, { onDelete: "cascade" }),
  targetLatitude: real("target_latitude").notNull(),
  targetLongitude: real("target_longitude").notNull(),
});
