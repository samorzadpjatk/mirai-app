import { ORPCError } from "@orpc/server";
import { extractActiveSponsors } from "@mirai-app/shared";
import type { DB } from "@mirai-app/db";

export type SponsorContext = {
  db: DB;
};

export const getAll = async (context: SponsorContext) => {
  return context.db.query.sponsors.findMany({
    where: (s, { eq }) => eq(s.isActive, true),
    orderBy: (s, { asc }) => asc(s.createdAt),
  });
};

export const getById = async (context: SponsorContext, input: { id: string }) => {
  const sponsor = await context.db.query.sponsors.findFirst({
    where: (s, { eq }) => eq(s.id, input.id),
  });

  if (!sponsor) {
    throw new ORPCError("NOT_FOUND", { message: "Sponsor not found" });
  }

  return sponsor;
};

export const getByTripId = async (context: SponsorContext, input: { tripId: string }) => {
  const tripSponsorsList = await context.db.query.tripSponsors.findMany({
    where: (ts, { eq }) => eq(ts.tripId, input.tripId),
    with: {
      sponsor: true,
    },
    orderBy: (ts, { asc }) => asc(ts.createdAt),
  });

  return extractActiveSponsors(tripSponsorsList);
};
