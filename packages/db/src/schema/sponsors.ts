import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";

export const sponsors = pgTable(
  "sponsors",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    logoPath: text("logo_path").notNull(),
    height: integer("height").default(0).notNull(),
    offsetX: integer("offset_x").default(0).notNull(),
    offsetY: integer("offset_y").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sponsors_is_active_idx").on(t.isActive),
    index("sponsors_created_at_idx").on(t.createdAt),
    check("sponsors_height_positive", sql`${t.height} >= 0`),
    check("sponsors_offset_x_positive", sql`${t.offsetX} >= 0`),
    check("sponsors_offset_y_positive", sql`${t.offsetY} >= 0`),
  ],
);

export const tripSponsors = pgTable(
  "trip_sponsors",
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("trip_sponsors_trip_id_sponsor_id_unique").on(t.tripId, t.sponsorId),
    index("trip_sponsors_trip_id_idx").on(t.tripId),
    index("trip_sponsors_sponsor_id_idx").on(t.sponsorId),
  ],
);
