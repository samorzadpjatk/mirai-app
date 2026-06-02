import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sqliteSponsors = sqliteTable("sponsors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logoPath: text("logo_path").notNull(),
  height: integer("height"),
  offsetX: integer("offset_x"),
  offsetY: integer("offset_y"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripSponsors = sqliteTable("trip_sponsors", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  sponsorId: text("sponsor_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
