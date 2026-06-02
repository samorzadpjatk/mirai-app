import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const sqliteLocations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  isSharingLocation: integer("is_sharing_location", { mode: "boolean" }).default(false).notNull(),
  accuracy: real("accuracy"),
  altitude: real("altitude"),
  altitudeAccuracy: real("altitude_accuracy"),
  heading: real("heading"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  speed: real("speed"),
  lastInactivityNotification: integer("last_inactivity_notification", { mode: "timestamp" }),
});

export const sqliteLocationSharingRequests = sqliteTable("location_sharing_requests", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  status: text("status").default("PENDING").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteLocationShares = sqliteTable(
  "location_shares",
  {
    locationId: text("location_id").notNull(),
    userId: text("user_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.locationId, t.userId] }),
  }),
);

export const sqliteUsers = sqliteTable("users", {
  id: text("id").primaryKey(),
  authUserId: text("auth_user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  hasAvatar: integer("has_avatar", { mode: "boolean" }).default(false).notNull(),
  role: text("role").default("USER").notNull(),
  lastSeenOn: integer("last_seen_on", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
