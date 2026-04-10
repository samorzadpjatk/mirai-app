import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * TripStatus enum
 */
export const tripStatusEnum = pgEnum("TripStatus", [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Trips table - matches Prisma Trip model
 */
export const trips = pgTable("Trip", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate", { mode: "date" }).notNull(),
  endDate: timestamp("endDate", { mode: "date" }).notNull(),
  backgroundImagePath: text("backgroundImagePath"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type TripInsert = typeof trips.$inferInsert;
export type TripSelect = typeof trips.$inferSelect;

/**
 * Trip Resources table
 */
export const tripResources = pgTable("TripResource", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url"),
  storagePath: text("storagePath"),
  fileName: varchar("fileName", { length: 255 }),
  publicUrl: text("publicUrl"),
  iconName: varchar("iconName", { length: 100 }),
  value: text("value"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type TripResourceInsert = typeof tripResources.$inferInsert;
export type TripResourceSelect = typeof tripResources.$inferSelect;

/**
 * Trip Participants table
 */
export const tripParticipants = pgTable("TripParticipant", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull(),
  tripId: uuid("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  groupId: uuid("groupId"),
  wristNumber: varchar("wristNumber", { length: 50 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  role: varchar("role", { length: 20 }).notNull().default("MEMBER"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type TripParticipantInsert = typeof tripParticipants.$inferInsert;
export type TripParticipantSelect = typeof tripParticipants.$inferSelect;
