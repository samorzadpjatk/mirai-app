import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { tripRoleEnum } from "./enums";
import { groups } from "./groups";
import { users } from "./users";

export const trips = pgTable(
  "trips",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    backgroundImagePath: text("background_image_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [check("trips_dates_valid", sql`${t.endDate} > ${t.startDate}`)],
);

export const tripInsurances = pgTable("trip_insurances", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tripId: varchar("trip_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => trips.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  phoneNumber: text("phone_number").notNull(),
  phoneDisplay: text("phone_display").notNull(),
  policyNumber: text("policy_number").notNull(),
  contractNumber: text("contract_number").notNull(),
  providerName: text("provider_name").notNull(),
  hospitalName: text("hospital_name"),
  hospitalAddress: text("hospital_address"),
  hospitalDistance: text("hospital_distance"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const tripInsuranceSteps = pgTable(
  "trip_insurance_steps",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    insuranceId: varchar("insurance_id", { length: 36 })
      .notNull()
      .references(() => tripInsurances.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    title: text("title").notNull(),
    text: text("text").notNull(),
    requiredInfo: text("required_info").array().default([]).notNull(),
    exampleCall: text("example_call"),
    additionalText: text("additional_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("trip_insurance_steps_insurance_id_step_number_idx").on(t.insuranceId, t.stepNumber),
  ],
);

export const tripParticipants = pgTable(
  "trip_participants",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    tripId: varchar("trip_id", { length: 36 })
      .notNull()
      .references(() => trips.id),
    groupId: varchar("group_id", { length: 36 }).references(() => groups.id),
    wristNumber: text("wrist_number"),
    houseNumber: text("house_number"),
    role: tripRoleEnum("role").default("MEMBER").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("trip_participants_user_id_trip_id_unique").on(t.userId, t.tripId),
    uniqueIndex("trip_participants_trip_id_wrist_number_unique").on(t.tripId, t.wristNumber),
    index("trip_participants_trip_id_group_id_idx").on(t.tripId, t.groupId),
  ],
);
