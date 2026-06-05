import { integer, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { sponsors } from "./sponsors";
import { trips } from "./trips";

export const tripSponsorDisplay = pgTable(
  "trip_sponsor_display",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    sponsorId: varchar("sponsor_id", { length: 36 })
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    height: integer("height").notNull().default(0),
    offsetX: integer("offset_x").notNull().default(0),
    offsetY: integer("offset_y").notNull().default(0),
  },
  (t) => [uniqueIndex("trip_sponsor_display_trip_id_sponsor_id_unique").on(t.tripId, t.sponsorId)],
);
