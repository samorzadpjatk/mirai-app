import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { groups } from "./group";
import { trips } from "./trip";

/**
 * Events table - matches Prisma Event model
 */
export const events = pgTable("Event", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creatorId").notNull(),
  organizerGroupId: uuid("organizerGroupId").references(() => groups.id),
  title: varchar("title", { length: 255 }).notNull(),
  startTime: timestamp("startTime", { mode: "date" }).notNull(),
  endTime: timestamp("endTime", { mode: "date" }).notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  files: text("files").array().default([]),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type EventInsert = typeof events.$inferInsert;
export type EventSelect = typeof events.$inferSelect;

/**
 * User Events table (join table)
 */
export const userEvents = pgTable(
  "UserEvent",
  {
    userId: uuid("userId").notNull(),
    eventId: uuid("eventId")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    interestedIn: boolean("interestedIn").notNull().default(false),
    enlistedIn: boolean("enlistedIn").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    pk: { columns: [table.userId, table.eventId] },
  }),
);

export type UserEventInsert = typeof userEvents.$inferInsert;
export type UserEventSelect = typeof userEvents.$inferSelect;
