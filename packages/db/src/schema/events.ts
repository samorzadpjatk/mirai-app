import { pgTable, varchar, timestamp, text, boolean, primaryKey } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { users } from "./users";
import { groups } from "./groups";

export const events = pgTable("events", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  creatorId: varchar("creator_id", { length: 36 })
    .notNull()
    .references(() => users.id),
  organizerGroupId: varchar("organizer_group_id", { length: 36 }).references(() => groups.id),
  title: text("title").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  files: text("files").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userEvents = pgTable(
  "user_events",
  {
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    interestedIn: boolean("interested_in").default(false).notNull(),
    enlistedIn: boolean("enlisted_in").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.eventId] })],
);
