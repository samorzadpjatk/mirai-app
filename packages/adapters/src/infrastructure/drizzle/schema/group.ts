import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { trips } from "./trip";

/**
 * Groups table - matches Prisma Group model
 */
export const groups = pgTable(
  "Group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    image: text("image"),
    isDeleted: boolean("isDeleted").notNull().default(false),
    organizerId: uuid("organizerId").notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    coins: integer("coins").notNull().default(0),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("groups_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type GroupInsert = typeof groups.$inferInsert;
export type GroupSelect = typeof groups.$inferSelect;

/**
 * Group Join Requests table
 */
export const groupJoinRequests = pgTable(
  "GroupJoinRequest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    groupId: uuid("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("userId").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("group_join_requests_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
  ],
);

export type GroupJoinRequestInsert = typeof groupJoinRequests.$inferInsert;
export type GroupJoinRequestSelect = typeof groupJoinRequests.$inferSelect;
