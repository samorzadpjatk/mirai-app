import { builder } from "../builder";

/**
 * Challenge Type (Pothos)
 *
 * GraphQL type definition for Challenge entity.
 * Demonstrates how to add more domain types.
 *
 * Phase 3: API Layer
 * - Example of extending the schema with new domains
 */
export const ChallengeType = builder.objectType<"Challenge">("Challenge", {
  description: "A challenge in a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    status: t.exposeString("status"),
    submissionType: t.exposeString("submissionType"),
    scoringCategory: t.exposeString("scoringCategory"),
    startDate: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (c) => c.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (c) => c.endDate,
    }),
    isRecurring: t.exposeBoolean("isRecurring"),
    points: t.exposeInt("points", { nullable: true }),
    createdAt: t.field({ type: "DateTime", resolve: (c) => c.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (c) => c.updatedAt }),
  }),
});

/**
 * Challenge Input Types
 */
export const CreateChallengeInput = builder.inputType("CreateChallengeInput", {
  description: "Input for creating a challenge",
  fields: (t) => ({
    tripId: t.string({ required: true }),
    name: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    submissionType: t.string({ required: true }),
    scoringCategory: t.string({ required: true }),
    points: t.int({ required: false }),
    startDate: t.field({ type: "DateTime", required: false }),
    endDate: t.field({ type: "DateTime", required: false }),
    isRecurring: t.boolean({ required: false, defaultValue: false }),
  }),
});
