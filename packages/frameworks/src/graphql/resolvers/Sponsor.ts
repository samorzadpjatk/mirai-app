import { builder } from "../builder";
import { Sponsor } from "@mirai-app/domain";
import type { GraphQLContext } from "../builder";
import { GraphQLError } from "graphql";

/**
 * Sponsor Resolvers
 *
 * GraphQL resolvers for Sponsor domain.
 */

// Sponsor type
builder.node(Sponsor, {
  id: { resolve: (s) => s.id },
  name: "Sponsor",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    logoPath: t.exposeString("logoPath"),
    height: t.exposeInt("height", { nullable: true }),
    offsetX: t.exposeInt("offsetX", { nullable: true }),
    offsetY: t.exposeInt("offsetY", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (s) => s.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (s) => s.updatedAt,
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  sponsor: t.field({
    type: Sponsor,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.getById({ id: args.id.toString() });
      if (!result.success) return null;
      return result.data;
    },
  }),

  sponsors: t.field({
    type: [Sponsor],
    args: {
      activeOnly: t.arg.boolean({ defaultValue: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.list({ activeOnly: args.activeOnly });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),

  tripSponsors: t.field({
    type: [Sponsor],
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.getByTripId({ tripId: args.tripId });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  createSponsor: t.field({
    type: Sponsor,
    args: {
      name: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
      logoPath: t.arg.string({ required: true }),
      height: t.arg.int(),
      offsetX: t.arg.int(),
      offsetY: t.arg.int(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.create(args);
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  updateSponsor: t.field({
    type: Sponsor,
    args: {
      id: t.arg.id({ required: true }),
      name: t.arg.string(),
      description: t.arg.string(),
      logoPath: t.arg.string(),
      height: t.arg.int(),
      offsetX: t.arg.int(),
      offsetY: t.arg.int(),
      isActive: t.arg.boolean(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.update({
        id: args.id.toString(),
        ...args,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return result.data;
    },
  }),

  linkSponsorToTrip: t.field({
    type: "Boolean",
    args: {
      sponsorId: t.arg.id({ required: true }),
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.linkToTrip({
        sponsorId: args.sponsorId.toString(),
        tripId: args.tripId.toString(),
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return true;
    },
  }),

  unlinkSponsorFromTrip: t.field({
    type: "Boolean",
    args: {
      sponsorId: t.arg.id({ required: true }),
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.unlinkFromTrip({
        sponsorId: args.sponsorId.toString(),
        tripId: args.tripId.toString(),
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "BAD_REQUEST" },
        });
      }
      return true;
    },
  }),

  deleteSponsor: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.controllers.sponsorController;
      const result = await controller.delete({ id: args.id.toString() });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return true;
    },
  }),
}));
