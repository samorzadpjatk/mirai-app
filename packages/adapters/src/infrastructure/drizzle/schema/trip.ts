import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

/**
 * TripStatus enum
 */
export const tripStatusEnum = pgEnum("TripStatus", [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Trips table - matches Prisma Trip model
 */
export const trips = pgTable(
  "Trip",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("startDate", { mode: "date" }).notNull(),
    endDate: timestamp("endDate", { mode: "date" }).notNull(),
    backgroundImagePath: text("backgroundImagePath"),
    status: tripStatusEnum("status").notNull().default("PLANNING"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("trips_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type TripInsert = typeof trips.$inferInsert;
export type TripSelect = typeof trips.$inferSelect;

/**
 * Trip Resources table
 */
export const tripResources = pgTable(
  "TripResource",
  {
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
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("trip_resources_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type TripResourceInsert = typeof tripResources.$inferInsert;
export type TripResourceSelect = typeof tripResources.$inferSelect;

/**
 * Trip Participants table
 */
export const tripParticipants = pgTable(
  "TripParticipant",
  {
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
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("trip_participants_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type TripParticipantInsert = typeof tripParticipants.$inferInsert;
export type TripParticipantSelect = typeof tripParticipants.$inferSelect;

/**
 * Trip Insurance table
 */
export const tripInsurance = pgTable(
  "TripInsurance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("tripId")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    provider: varchar("provider", { length: 255 }),
    policyNumber: varchar("policyNumber", { length: 255 }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("trip_insurance_trip_id_idx").on(table.tripId),
    index("trip_insurance_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

export type TripInsuranceInsert = typeof tripInsurance.$inferInsert;
export type TripInsuranceSelect = typeof tripInsurance.$inferSelect;

/**
 * Trip Insurance Steps table
 */
export const tripInsuranceSteps = pgTable(
  "TripInsuranceStep",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    insuranceId: uuid("insuranceId")
      .notNull()
      .references(() => tripInsurance.id, { onDelete: "cascade" }),
    stepNumber: integer("stepNumber").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("trip_insurance_steps_insurance_id_idx").on(table.insuranceId),
    index("trip_insurance_steps_step_number_idx").on(
      table.insuranceId,
      table.stepNumber,
    ),
    index("trip_insurance_steps_created_at_id_idx").on(
      table.createdAt,
      table.id,
    ),
  ],
);

export type TripInsuranceStepInsert = typeof tripInsuranceSteps.$inferInsert;
export type TripInsuranceStepSelect = typeof tripInsuranceSteps.$inferSelect;
