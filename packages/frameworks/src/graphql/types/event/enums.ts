import { builder } from "../../builder.js";
import { EventType, EventStatus } from "@mirai-app/use-cases";

/**
 * Event Type Enum
 */
export const EventTypeEnum = builder.enumType("EventType", {
  description: "Types of events",
  values: {
    ACTIVITY: { value: EventType.ACTIVITY },
    MEAL: { value: EventType.MEAL },
    TRANSPORT: { value: EventType.TRANSPORT },
    ACCOMMODATION: { value: EventType.ACCOMMODATION },
    MEETING: { value: EventType.MEETING },
    OTHER: { value: EventType.OTHER },
  },
});

/**
 * Event Status Enum
 */
export const EventStatusEnum = builder.enumType("EventStatus", {
  description: "Status of an event",
  values: {
    DRAFT: { value: EventStatus.DRAFT },
    PUBLISHED: { value: EventStatus.PUBLISHED },
    CANCELLED: { value: EventStatus.CANCELLED },
    COMPLETED: { value: EventStatus.COMPLETED },
  },
});

/**
 * Create Event Input
 */
export const CreateEventInput = builder.inputType("CreateEventInput", {
  description: "Input for creating an event",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    groupId: t.field({ type: "ID" }),
    title: t.field({ type: "String", required: true }),
    description: t.field({ type: "String" }),
    location: t.field({ type: "String" }),
    startTime: t.field({ type: "DateTime", required: true }),
    endTime: t.field({ type: "DateTime" }),
    type: t.field({ type: EventTypeEnum, required: true }),
    status: t.field({ type: EventStatusEnum }),
    maxParticipants: t.field({ type: "Int" }),
  }),
});

/**
 * Update Event Input
 */
export const UpdateEventInput = builder.inputType("UpdateEventInput", {
  description: "Input for updating an event",
  fields: (t) => ({
    title: t.field({ type: "String" }),
    description: t.field({ type: "String" }),
    location: t.field({ type: "String" }),
    startTime: t.field({ type: "DateTime" }),
    endTime: t.field({ type: "DateTime" }),
    type: t.field({ type: EventTypeEnum }),
    status: t.field({ type: EventStatusEnum }),
    maxParticipants: t.field({ type: "Int" }),
  }),
});
