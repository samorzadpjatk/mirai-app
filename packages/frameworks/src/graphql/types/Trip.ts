import { builder } from "../builder";
import type { Trip, TripStatus } from "@mirai-app/domain";

/**
 * Trip Type (Pothos)
 *
 * GraphQL type definition for Trip entity.
 */
export const TripType = builder.objectType<"Trip">("Trip", {
  description: "A trip/event in the application",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique trip identifier" }),

    name: t.exposeString("name", { description: "Trip name" }),

    description: t.exposeString("description", {
      description: "Trip description",
      nullable: true,
    }),

    startDate: t.field({
      type: "DateTime",
      description: "When the trip starts",
      resolve: (trip) => trip.startDate,
    }),

    endDate: t.field({
      type: "DateTime",
      description: "When the trip ends",
      resolve: (trip) => trip.endDate,
    }),

    backgroundImagePath: t.exposeString("backgroundImagePath", {
      description: "Path to background image",
      nullable: true,
    }),

    status: t.exposeString("status", {
      description: "Trip status (DRAFT, ACTIVE, COMPLETED, CANCELLED)",
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the trip was created",
      resolve: (trip) => trip.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the trip was last updated",
      resolve: (trip) => trip.updatedAt,
    }),

    // Computed fields
    isActive: t.boolean({
      description: "Whether the trip is currently active",
      resolve: (trip) => {
        const now = new Date();
        return trip.startDate <= now && trip.endDate >= now;
      },
    }),

    isUpcoming: t.boolean({
      description: "Whether the trip is in the future",
      resolve: (trip) => {
        const now = new Date();
        return trip.startDate > now;
      },
    }),

    isPast: t.boolean({
      description: "Whether the trip has ended",
      resolve: (trip) => {
        const now = new Date();
        return trip.endDate < now;
      },
    }),
  }),
});

/**
 * Trip Input Types
 */
export const CreateTripInput = builder.inputType("CreateTripInput", {
  description: "Input for creating a new trip",
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    startDate: t.field({ type: "DateTime", required: true }),
    endDate: t.field({ type: "DateTime", required: true }),
    backgroundImagePath: t.string({ required: false }),
    status: t.string({ required: false, defaultValue: "DRAFT" }),
  }),
});

export const UpdateTripInput = builder.inputType("UpdateTripInput", {
  description: "Input for updating a trip",
  fields: (t) => ({
    name: t.string({
      required: false,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    startDate: t.field({ type: "DateTime", required: false }),
    endDate: t.field({ type: "DateTime", required: false }),
    backgroundImagePath: t.string({ required: false }),
    status: t.string({ required: false }),
  }),
});
