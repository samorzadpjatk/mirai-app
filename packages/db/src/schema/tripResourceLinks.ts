import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";

export const tripResourceLinks = pgTable(
  "trip_resource_links",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    type: text("type").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("trip_resource_links_trip_id_idx").on(t.tripId)],
);
