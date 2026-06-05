import {
  boolean,
  index,
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
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("sponsors_is_active_idx").on(t.isActive),
    index("sponsors_created_at_idx").on(t.createdAt),
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
