import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Location Sharing Request Status enum
 */
export const locationSharingRequestStatusEnum = pgEnum(
  "LocationSharingRequestStatus",
  ["PENDING", "ACCEPTED", "REJECTED"],
);

/**
 * Locations table - matches Prisma Location model
 */
export const locations = pgTable("Location", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId").notNull().unique(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
  isSharingLocation: boolean("isSharingLocation").notNull().default(false),
  accuracy: real("accuracy"),
  altitude: real("altitude"),
  altitudeAccuracy: real("altitudeAccuracy"),
  heading: real("heading"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  speed: real("speed"),
  lastInactivityNotification: timestamp("lastInactivityNotification", {
    mode: "date",
  }),
});

export type LocationInsert = typeof locations.$inferInsert;
export type LocationSelect = typeof locations.$inferSelect;

/**
 * Location Sharing Requests table
 */
export const locationSharingRequests = pgTable("LocationSharingRequest", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requesterId").notNull(),
  targetId: uuid("targetId").notNull(),
  status: locationSharingRequestStatusEnum("status")
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type LocationSharingRequestInsert =
  typeof locationSharingRequests.$inferInsert;
export type LocationSharingRequestSelect =
  typeof locationSharingRequests.$inferSelect;
