/**
 * Sponsor Controller
 *
 * tRPC-ready controller wrapping SponsorController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, adminProcedure } from "../trpc";
import { SponsorController } from "../../controllers/sponsor-controller";
import { PrismaSponsorRepository } from "../../gateways/PrismaSponsorRepository";

export const sponsorController = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    const repository = new PrismaSponsorRepository(ctx.db);
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
      const repository = new PrismaSponsorRepository(ctx.db);
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
      const repository = new PrismaSponsorRepository(ctx.db);
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

  create: adminProcedure
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
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.create(input);

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  update: adminProcedure
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
      const repository = new PrismaSponsorRepository(ctx.db);
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

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
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

  addToTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
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

  removeFromTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
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
