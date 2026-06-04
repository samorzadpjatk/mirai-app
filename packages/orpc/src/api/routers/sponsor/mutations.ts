import { sponsors, tripSponsors } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import type { SponsorContext } from "./queries";

export const create = async (
  context: SponsorContext,
  input: {
    name: string;
    description: string;
    logoPath: string;
    height?: number;
    offsetX?: number;
    offsetY?: number;
    isActive: boolean;
  },
) => {
  const [sponsor] = await context.db.insert(sponsors).values(input).returning();
  return sponsor;
};

export const update = async (
  context: SponsorContext,
  input: {
    id: string;
    name?: string;
    description?: string;
    logoPath?: string;
    height?: number;
    offsetX?: number;
    offsetY?: number;
    isActive?: boolean;
  },
) => {
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
};

export const deleteSponsor = async (context: SponsorContext, input: { id: string }) => {
  const [sponsor] = await context.db.delete(sponsors).where(eq(sponsors.id, input.id)).returning();
  return sponsor;
};

export const addToTrip = async (
  context: SponsorContext,
  input: { tripId: string; sponsorId: string },
) => {
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
    where: (ts, { eq, and }) => and(eq(ts.tripId, input.tripId), eq(ts.sponsorId, input.sponsorId)),
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
};

export const removeFromTrip = async (
  context: SponsorContext,
  input: { tripId: string; sponsorId: string },
) => {
  const [tripSponsor] = await context.db
    .delete(tripSponsors)
    .where(and(eq(tripSponsors.tripId, input.tripId), eq(tripSponsors.sponsorId, input.sponsorId)))
    .returning();
  return tripSponsor;
};
