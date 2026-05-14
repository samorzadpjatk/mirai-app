import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, adminProcedure, publicProcedure } from "../../api/trpc";
import { sponsors, tripSponsors } from "@mirai-app/db";
import { eq, and } from "drizzle-orm";

export const sponsorRouter = createORPCRouter({
  getAll: publicProcedure.handler(async ({ context }) => {
    return context.db.query.sponsors.findMany({
      where: (s, { eq }) => eq(s.isActive, true),
      orderBy: (s, { asc }) => asc(s.createdAt),
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const sponsor = await context.db.query.sponsors.findFirst({
        where: (s, { eq }) => eq(s.id, input.id),
      });

      if (!sponsor) {
        throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
      }

      return sponsor;
    }),

  getByTripId: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const tripSponsorsList = await context.db.query.tripSponsors.findMany({
        where: (ts, { eq }) => eq(ts.tripId, input.tripId),
        with: {
          sponsor: true,
        },
        orderBy: (ts, { asc }) => asc(ts.createdAt),
      });

      return tripSponsorsList
        .filter((ts) => ts.sponsor?.isActive)
        .map((tripSponsor) => tripSponsor.sponsor);
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
      const [sponsor] = await context.db.insert(sponsors).values(input).returning();
      return sponsor;
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
      const sponsor = await context.db.query.sponsors.findFirst({
        where: (s, { eq }) => eq(s.id, id),
      });
      if (!sponsor) {
        throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
      }
      const [updated] = await context.db
        .update(sponsors)
        .set(data)
        .where(eq(sponsors.id, id))
        .returning();
      return updated;
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ context, input }) => {
    const [sponsor] = await context.db
      .delete(sponsors)
      .where(eq(sponsors.id, input.id))
      .returning();
    return sponsor;
  }),

  addToTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const trip = await context.db.query.trips.findFirst({
        where: (t, { eq }) => eq(t.id, input.tripId),
      });
      if (!trip) {
        throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
      }

      const sponsor = await context.db.query.sponsors.findFirst({
        where: (s, { eq }) => eq(s.id, input.sponsorId),
      });
      if (!sponsor) {
        throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
      }

      const existing = await context.db.query.tripSponsors.findFirst({
        where: (ts, { eq, and }) =>
          and(eq(ts.tripId, input.tripId), eq(ts.sponsorId, input.sponsorId)),
      });

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "Sponsor is already associated with this trip",
        });
      }

      const [tripSponsor] = await context.db
        .insert(tripSponsors)
        .values({
          tripId: input.tripId,
          sponsorId: input.sponsorId,
        })
        .returning();
      return tripSponsor;
    }),

  removeFromTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [tripSponsor] = await context.db
        .delete(tripSponsors)
        .where(
          and(eq(tripSponsors.tripId, input.tripId), eq(tripSponsors.sponsorId, input.sponsorId)),
        )
        .returning();
      return tripSponsor;
    }),
});
