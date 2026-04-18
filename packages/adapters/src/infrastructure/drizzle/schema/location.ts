import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  real,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./user";

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
export const locations = pgTable(
  "Location",
  {
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
  },
  (table) => [
    // Composite index for cursor pagination on timestamp
    index("locations_timestamp_id_idx").on(table.timestamp, table.id),
  ],
);

export type LocationInsert = typeof locations.$inferInsert;
export type LocationSelect = typeof locations.$inferSelect;

/**
 * Location Sharing Requests table
 */
export const locationSharingRequests = pgTable(
  "LocationSharingRequest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requesterId").notNull(),
    targetId: uuid("targetId").notNull(),
    status: locationSharingRequestStatusEnum("status")
      .notNull()
      .default("PENDING"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("location_sharing_requests_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
  ],
);

export type LocationSharingRequestInsert =
  typeof locationSharingRequests.$inferInsert;
export type LocationSharingRequestSelect =
  typeof locationSharingRequests.$inferSelect;

/**
 * Location Users Share With junction table
 *
 * Many-to-many relationship between location owners and users they share with.
 * This follows Prisma's implicit many-to-many naming convention:
 * - Column A = location owner userId (references users.id)
 * - Column B = userId that the owner shares with (references users.id)
 *
 * Note: The table name starts with underscore following Prisma's convention
 * for implicit many-to-many relation tables.
 */
export const locationUsersShareWith = pgTable(
  "_LocationUsersShareWith",
  {
    A: uuid("A")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    B: uuid("B")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Composite primary key on (A, B) - ensures unique sharing pairs
    primaryKey({ columns: [table.A, table.B] }),
    // Index for looking up all users that a location owner shares with
    index("location_users_share_with_A_idx").on(table.A),
    // Index for looking up all location owners that share with a user
    index("location_users_share_with_B_idx").on(table.B),
  ],
);

export type LocationUsersShareWithInsert =
  typeof locationUsersShareWith.$inferInsert;
export type LocationUsersShareWithSelect =
  typeof locationUsersShareWith.$inferSelect;
