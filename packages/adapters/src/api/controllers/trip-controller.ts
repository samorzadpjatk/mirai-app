/**
 * Trip Controller
 *
 * tRPC-ready controller wrapping TripController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { TripController } from "../../controllers/trip-controller";
import { requireAuth, requireAdmin } from "../controller-helpers";

export const tripController = {
  getAll: publicProcedure
    .input(
      z
        .object({
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(30),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
      const result = await controller.list({
        limit: input?.pagination?.limit ?? 30,
        offset: input?.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      // Filter trips where user is a participant - use authContext.userId
      const userTrips = [];
      for (const trip of result.data) {
        const participant = await ctx.db.tripParticipant.findUnique({
          where: {
            userId_tripId: { userId: authContext.userId, tripId: trip.id },
          },
        });
        if (participant) {
          userTrips.push(trip);
        }
      }

      return {
        trips: userTrips,
        pagination: {
          total: userTrips.length,
          limit: input?.pagination?.limit ?? 30,
          offset: input?.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
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

  getByIdAdmin: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
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

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
      const result = await controller.create({
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath ?? null,
        status: "PLANNING",
      });

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
        description: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
      const result = await controller.update({
        tripId: input.id,
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      // Using DI container to resolve TripController - no manual instantiation needed
      const controller = ctx.di.resolve<TripController>("tripController");
      const result = await controller.delete({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return { success: true };
    }),
};
