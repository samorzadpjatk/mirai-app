import { builder } from "../builder";

/**
 * Group Type (Pothos)
 *
 * GraphQL type definition for Group entity.
 */
export const GroupType = builder.objectType<"Group">("Group", {
  description: "A group of participants in a trip",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique group identifier" }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this group belongs to",
    }),

    name: t.exposeString("name", { description: "Group name" }),

    description: t.exposeString("description", {
      description: "Group description",
      nullable: true,
    }),

    image: t.exposeString("image", {
      description: "Group image URL",
      nullable: true,
    }),

    isDeleted: t.exposeBoolean("isDeleted", {
      description: "Whether the group has been soft-deleted",
    }),

    organizerId: t.exposeID("organizerId", {
      description: "ID of the group organizer",
    }),

    code: t.exposeString("code", {
      description: "Unique join code for the group",
    }),

    coins: t.exposeInt("coins", {
      description: "Current coin balance of the group",
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the group was created",
      resolve: (group) => group.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the group was last updated",
      resolve: (group) => group.updatedAt,
    }),
  }),
});

/**
 * Group Input Types
 */
export const CreateGroupInput = builder.inputType("CreateGroupInput", {
  description: "Input for creating a new group",
  fields: (t) => ({
    tripId: t.string({ required: true }),
    name: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    image: t.string({ required: false }),
    organizerId: t.string({ required: true }),
  }),
});

export const UpdateGroupInput = builder.inputType("UpdateGroupInput", {
  description: "Input for updating a group",
  fields: (t) => ({
    name: t.string({
      required: false,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    image: t.string({ required: false }),
  }),
});
