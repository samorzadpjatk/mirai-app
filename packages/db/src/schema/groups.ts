import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { trips } from "./trips";
import { users } from "./users";

export const groups = pgTable("groups", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 })
    .notNull()
    .references(() => trips.id),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  organizerId: varchar("organizer_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  code: text("code").notNull().unique(),
  coins: integer("coins").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const groupJoinRequests = pgTable(
  "group_join_requests",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    groupId: varchar("group_id", { length: 36 })
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("group_join_requests_trip_id_user_id_unique").on(t.tripId, t.userId),
    index("group_join_requests_group_id_created_at_idx").on(t.groupId, t.createdAt),
    index("group_join_requests_user_id_trip_id_idx").on(t.userId, t.tripId),
  ],
);
