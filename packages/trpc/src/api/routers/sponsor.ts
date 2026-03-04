import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  publicProcedure,
} from "../../api/trpc";

export const sponsorRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.sponsor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.id },
      });

      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }

      return sponsor;
    }),

  getByTripId: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tripSponsors = await ctx.db.tripSponsor.findMany({
        where: { 
          tripId: input.tripId,
          sponsor: { isActive: true }
        },
        include: {
          sponsor: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return tripSponsors.map((tripSponsor) => tripSponsor.sponsor);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        logoPath: z.string(),
        height: z.number().int().optional(),
        offsetX: z.number().int().optional(),
        offsetY: z.number().int().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sponsor.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        logoPath: z.string().optional(),
        height: z.number().int().optional(),
        offsetX: z.number().int().optional(),
        offsetY: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const sponsor = await ctx.db.sponsor.findUnique({ where: { id } });
      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }
      return ctx.db.sponsor.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sponsor.delete({ where: { id: input.id } });
    }),

  addToTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if trip exists
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      // Check if sponsor exists
      const sponsor = await ctx.db.sponsor.findUnique({
        where: { id: input.sponsorId },
      });
      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }

      // Check if already associated
      const existing = await ctx.db.tripSponsor.findUnique({
        where: {
          tripId_sponsorId: {
            tripId: input.tripId,
            sponsorId: input.sponsorId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Sponsor is already associated with this trip",
        });
      }

      return ctx.db.tripSponsor.create({
        data: {
          tripId: input.tripId,
          sponsorId: input.sponsorId,
        },
      });
    }),

  removeFromTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tripSponsor.delete({
        where: {
          tripId_sponsorId: {
            tripId: input.tripId,
            sponsorId: input.sponsorId,
          },
        },
      });
  }),
});
