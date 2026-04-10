/**
 * Sponsor Controller
 *
 * tRPC-ready controller wrapping SponsorController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { SponsorController } from "../../controllers/sponsor-controller";
import { requireAdmin } from "../controller-helpers";

export const sponsorController = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    const controller = new SponsorController(repository);

    const result = await controller.list({ activeOnly: true });

    if (!result.success) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
    }

    return result.data.sponsors;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = new SponsorController(repository);

      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  getByTripId: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = new SponsorController(repository);

      const result = await controller.getByTripId({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        logoPath: z.string(),
        height: z.number().int().min(0).nullable().optional(),
        offsetX: z.number().int().min(0).nullable().optional(),
        offsetY: z.number().int().min(0).nullable().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = new SponsorController(repository);

      const result = await controller.create(input);

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        logoPath: z.string().optional(),
        height: z.number().int().min(0).nullable().optional(),
        offsetX: z.number().int().min(0).nullable().optional(),
        offsetY: z.number().int().min(0).nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = new SponsorController(repository);

      const result = await controller.update({
        sponsorId: input.id,
        ...input,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = new SponsorController(repository);

      const result = await controller.delete({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  addToTrip: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = new SponsorController(repository);

      const result = await controller.linkToTrip({
        sponsorId: input.sponsorId,
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  removeFromTrip: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = new SponsorController(repository);

      const result = await controller.unlinkFromTrip({
        sponsorId: input.sponsorId,
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),
};
