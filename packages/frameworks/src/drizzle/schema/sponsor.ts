import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Sponsors table - matches Prisma Sponsor model
 */
export const sponsors = pgTable("Sponsor", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  logoPath: text("logoPath").notNull(),
  height: integer("height"),
  offsetX: integer("offsetX"),
  offsetY: integer("offsetY"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type SponsorInsert = typeof sponsors.$inferInsert;
export type SponsorSelect = typeof sponsors.$inferSelect;

/**
 * Trip Sponsors junction table - matches Prisma TripSponsor model
 */
export const tripSponsors = pgTable("TripSponsor", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("tripId").notNull(),
  sponsorId: uuid("sponsorId")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type TripSponsorInsert = typeof tripSponsors.$inferInsert;
export type TripSponsorSelect = typeof tripSponsors.$inferSelect;
