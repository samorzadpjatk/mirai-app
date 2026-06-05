import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  real,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { locationSharingRequestStatusEnum } from "./enums";
import { users } from "./users";

export const locations = pgTable(
  "locations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    isSharingLocation: boolean("is_sharing_location").default(false).notNull(),
    accuracy: real("accuracy").default(0).notNull(),
    altitude: real("altitude"),
    altitudeAccuracy: real("altitude_accuracy"),
    heading: real("heading"),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    speed: real("speed"),
    lastInactivityNotification: timestamp("last_inactivity_notification", {
      withTimezone: true,
    }),
  },
  (t) => [
    check("locations_latitude_valid", sql`${t.latitude} BETWEEN -90 AND 90`),
    check("locations_longitude_valid", sql`${t.longitude} BETWEEN -180 AND 180`),
  ],
);

export const locationSharingRequests = pgTable(
  "location_sharing_requests",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    senderId: varchar("sender_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: varchar("receiver_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: locationSharingRequestStatusEnum("status").default("PENDING").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("location_sharing_requests_sender_id_receiver_id_unique").on(
      t.senderId,
      t.receiverId,
    ),
    index("location_sharing_requests_receiver_id_status_idx").on(t.receiverId, t.status),
    index("location_sharing_requests_sender_id_status_idx").on(t.senderId, t.status),
  ],
);

export const locationShares = pgTable(
  "location_shares",
  {
    locationId: varchar("location_id", { length: 36 })
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.locationId, t.userId] })],
);
