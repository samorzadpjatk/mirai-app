import { sql } from "drizzle-orm";
import { check, pgTable, real, varchar } from "drizzle-orm/pg-core";
import { challenges } from "./challenges";

export const challengeLocationMatch = pgTable(
  "challenge_location_match",
  {
    challengeId: varchar("challenge_id", { length: 36 })
      .primaryKey()
      .references(() => challenges.id, { onDelete: "cascade" }),
    targetLatitude: real("target_latitude").notNull(),
    targetLongitude: real("target_longitude").notNull(),
  },
  (t) => [
    check("challenge_location_match_latitude_valid", sql`${t.targetLatitude} between -90 and 90`),
    check(
      "challenge_location_match_longitude_valid",
      sql`${t.targetLongitude} between -180 and 180`,
    ),
  ],
);
