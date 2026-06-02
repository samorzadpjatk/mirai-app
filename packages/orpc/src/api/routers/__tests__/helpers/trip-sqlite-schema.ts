import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const sqliteTrips = sqliteTable("trips", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  backgroundImagePath: text("background_image_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripParticipants = sqliteTable("trip_participants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tripId: text("trip_id").notNull(),
  groupId: text("group_id"),
  wristNumber: text("wrist_number"),
  houseNumber: text("house_number"),
  role: text("role").default("MEMBER").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripResources = sqliteTable("trip_resources", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  url: text("url"),
  storagePath: text("storage_path"),
  fileName: text("file_name"),
  publicUrl: text("public_url"),
  iconName: text("icon_name"),
  value: text("value"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripInsurances = sqliteTable("trip_insurances", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull().unique(),
  label: text("label").notNull(),
  phoneNumber: text("phone_number").notNull(),
  phoneDisplay: text("phone_display").notNull(),
  policyNumber: text("policy_number").notNull(),
  contractNumber: text("contract_number").notNull(),
  providerName: text("provider_name").notNull(),
  hospitalName: text("hospital_name"),
  hospitalAddress: text("hospital_address"),
  hospitalDistance: text("hospital_distance"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripInsuranceSteps = sqliteTable("trip_insurance_steps", {
  id: text("id").primaryKey(),
  insuranceId: text("insurance_id").notNull(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  requiredInfo: text("required_info"),
  exampleCall: text("example_call"),
  additionalText: text("additional_text"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteGroups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false).notNull(),
  organizerId: text("organizer_id").notNull(),
  code: text("code").notNull().unique(),
  coins: integer("coins").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteTripSponsors = sqliteTable("trip_sponsors", {
  id: text("id").primaryKey(),
  tripId: text("trip_id").notNull(),
  sponsorId: text("sponsor_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

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

export const sqliteTripsRelations = relations(sqliteTrips, ({ one, many }) => ({
  groups: many(sqliteGroups),
  tripSponsors: many(sqliteTripSponsors),
  participants: many(sqliteTripParticipants),
  tripResources: many(sqliteTripResources),
  tripInsurance: one(sqliteTripInsurances),
}));

export const sqliteGroupsRelations = relations(sqliteGroups, ({ one, many }) => ({
  trip: one(sqliteTrips, {
    fields: [sqliteGroups.tripId],
    references: [sqliteTrips.id],
  }),
  participants: many(sqliteTripParticipants),
}));

export const sqliteTripParticipantsRelations = relations(sqliteTripParticipants, ({ one }) => ({
  user: one(sqliteUsers, {
    fields: [sqliteTripParticipants.userId],
    references: [sqliteUsers.id],
  }),
  trip: one(sqliteTrips, {
    fields: [sqliteTripParticipants.tripId],
    references: [sqliteTrips.id],
  }),
  group: one(sqliteGroups, {
    fields: [sqliteTripParticipants.groupId],
    references: [sqliteGroups.id],
  }),
}));

export const sqliteTripResourcesRelations = relations(sqliteTripResources, ({ one }) => ({
  trip: one(sqliteTrips, {
    fields: [sqliteTripResources.tripId],
    references: [sqliteTrips.id],
  }),
}));

export const sqliteTripInsurancesRelations = relations(sqliteTripInsurances, ({ one, many }) => ({
  trip: one(sqliteTrips, {
    fields: [sqliteTripInsurances.tripId],
    references: [sqliteTrips.id],
  }),
  steps: many(sqliteTripInsuranceSteps),
}));

export const sqliteTripInsuranceStepsRelations = relations(sqliteTripInsuranceSteps, ({ one }) => ({
  insurance: one(sqliteTripInsurances, {
    fields: [sqliteTripInsuranceSteps.insuranceId],
    references: [sqliteTripInsurances.id],
  }),
}));

export const sqliteTripSponsorsRelations = relations(sqliteTripSponsors, ({ one }) => ({
  trip: one(sqliteTrips, {
    fields: [sqliteTripSponsors.tripId],
    references: [sqliteTrips.id],
  }),
  sponsor: one(sqliteSponsors, {
    fields: [sqliteTripSponsors.sponsorId],
    references: [sqliteSponsors.id],
  }),
}));

export const sqliteSponsorsRelations = relations(sqliteSponsors, ({ many }) => ({
  tripSponsors: many(sqliteTripSponsors),
}));

export const sqliteUsersRelations = relations(sqliteUsers, ({ many }) => ({
  participants: many(sqliteTripParticipants),
}));
