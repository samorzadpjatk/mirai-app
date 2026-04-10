import { builder } from "../builder";

/**
 * Event Type (Pothos)
 *
 * GraphQL type definition for Event entity.
 */
export const EventType = builder.objectType<"Event">("Event", {
  description: "An event within a trip",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique event identifier" }),

    creatorId: t.exposeID("creatorId", {
      description: "ID of the event creator",
    }),

    organizerGroupId: t.exposeID("organizerGroupId", {
      description: "ID of the organizing group",
      nullable: true,
    }),

    title: t.exposeString("title", { description: "Event title" }),

    startTime: t.field({
      type: "DateTime",
      description: "When the event starts",
      resolve: (event) => event.startTime,
    }),

    endTime: t.field({
      type: "DateTime",
      description: "When the event ends",
      resolve: (event) => event.endTime,
    }),

    location: t.exposeString("location", { description: "Event location" }),

    description: t.exposeString("description", {
      description: "Event description",
    }),

    files: t.stringList({
      description: "Attached files for the event",
      resolve: (event) => event.files || [],
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the event was created",
      resolve: (event) => event.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the event was last updated",
      resolve: (event) => event.updatedAt,
    }),

    // Computed field
    isUpcoming: t.boolean({
      description: "Whether the event is in the future",
      resolve: (event) => {
        return new Date(event.startTime) > new Date();
      },
    }),

    isOngoing: t.boolean({
      description: "Whether the event is currently happening",
      resolve: (event) => {
        const now = new Date();
        return (
          new Date(event.startTime) <= now && new Date(event.endTime) >= now
        );
      },
    }),

    isPast: t.boolean({
      description: "Whether the event has ended",
      resolve: (event) => {
        return new Date(event.endTime) < new Date();
      },
    }),
  }),
});

/**
 * Event Input Types
 */
export const CreateEventInput = builder.inputType("CreateEventInput", {
  description: "Input for creating a new event",
  fields: (t) => ({
    title: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    startTime: t.field({ type: "DateTime", required: true }),
    endTime: t.field({ type: "DateTime", required: true }),
    location: t.string({ required: true }),
    description: t.string({ required: true }),
    organizerGroupId: t.string({ required: false }),
    files: t.stringList({ required: false }),
  }),
});

export const UpdateEventInput = builder.inputType("UpdateEventInput", {
  description: "Input for updating an event",
  fields: (t) => ({
    title: t.string({
      required: false,
      validate: { minLength: 1, maxLength: 255 },
    }),
    startTime: t.field({ type: "DateTime", required: false }),
    endTime: t.field({ type: "DateTime", required: false }),
    location: t.string({ required: false }),
    description: t.string({ required: false }),
    files: t.stringList({ required: false }),
  }),
});
