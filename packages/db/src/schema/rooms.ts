import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";

/**
 * Accommodation rooms for a trip. Independent from `groups` (teams): a
 * participant can be in a group and a room separately. Assignment is
 * admin-only, done via `tripParticipants.roomId`. `capacity` bounds how many
 * participants may be assigned (enforced in the oRPC layer, like group logic).
 */
export const rooms = pgTable(
  "rooms",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [check("rooms_capacity_positive", sql`${t.capacity} > 0`)],
);
