import { builder } from "../builder.js";
import { Sponsor } from "../../../domain/src/entities/Sponsor.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.getById(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") return null;
      return result.value;
    },
  }),

  sponsors: t.field({
    type: [Sponsor],
    args: {
      activeOnly: t.arg.boolean({ defaultValue: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.list(
        { activeOnly: args.activeOnly },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  tripSponsors: t.field({
    type: [Sponsor],
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.getByTripId(
        { tripId: args.tripId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.create(args, ctx.container);
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
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
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.update(
        {
          id: args.id.toString(),
          ...args,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  linkSponsorToTrip: t.field({
    type: "Boolean",
    args: {
      sponsorId: t.arg.id({ required: true }),
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.linkToTrip(
        {
          sponsorId: args.sponsorId.toString(),
          tripId: args.tripId.toString(),
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  unlinkSponsorFromTrip: t.field({
    type: "Boolean",
    args: {
      sponsorId: t.arg.id({ required: true }),
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.unlinkFromTrip(
        {
          sponsorId: args.sponsorId.toString(),
          tripId: args.tripId.toString(),
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  deleteSponsor: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve("sponsorController");
      const result = await controller.delete(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),
}));
