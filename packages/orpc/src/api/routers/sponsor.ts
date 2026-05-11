import { z } from "zod";
import { TRPCError } from "../../api/trpc";
import {
  createORPCRouter,
  adminProcedure,
  publicProcedure,
} from "../../api/trpc";

export const sponsorRouter = createORPCRouter({
  getAll: publicProcedure.handler(async ({ context }) => {
    return context.db.sponsor.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const sponsor = await context.db.sponsor.findUnique({
        where: { id: input.id },
      });

      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }

      return sponsor;
    }),

  getByTripId: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const tripSponsors = await context.db.tripSponsor.findMany({
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
    .handler(async ({ context, input }) => {
      return context.db.sponsor.create({
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
    .handler(async ({ context, input }) => {
      const { id, ...data } = input;
      const sponsor = await context.db.sponsor.findUnique({ where: { id } });
      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }
      return context.db.sponsor.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      return context.db.sponsor.delete({ where: { id: input.id } });
    }),

  addToTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      // Check if trip exists
      const trip = await context.db.trip.findUnique({
        where: { id: input.tripId },
      });
      if (!trip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
      }

      // Check if sponsor exists
      const sponsor = await context.db.sponsor.findUnique({
        where: { id: input.sponsorId },
      });
      if (!sponsor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sponsor not found" });
      }

      // Check if already associated
      const existing = await context.db.tripSponsor.findUnique({
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

      return context.db.tripSponsor.create({
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
    .handler(async ({ context, input }) => {
      return context.db.tripSponsor.delete({
        where: {
          tripId_sponsorId: {
            tripId: input.tripId,
            sponsorId: input.sponsorId,
          },
        },
      });
  }),
});
