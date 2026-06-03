import { ORPCError } from "@orpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { trips, tripParticipants, type DB } from "@mirai-app/db";
import { buildTripListItem, buildTripDetailResponse } from "@mirai-app/shared/trips";
import { calculatePagination, buildParticipantCountMap } from "@mirai-app/shared/groups";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { resolveGroupImage } from "./utils";

export const getAll = async (
  context: {
    db: DB;
    dbUser: { id: string };
  },
  input:
    | {
        pagination?: {
          limit: number;
          offset: number;
        };
      }
    | undefined,
) => {
  const limit = input?.pagination?.limit ?? 30;
  const offset = input?.pagination?.offset ?? 0;

  const participantRows = await context.db
    .select({ tripId: tripParticipants.tripId })
    .from(tripParticipants)
    .where(eq(tripParticipants.userId, context.dbUser.id));
  const tripIds = participantRows.map((r) => r.tripId);

  if (tripIds.length === 0) {
    return {
      trips: [],
      pagination: calculatePagination(limit, offset, 0),
    };
  }

  const matchTripIds = (t: any, { inArray }: any) => inArray(t.id, tripIds);
  const excludeDeletedGroups = (g: any, { eq }: any) => eq(g.isDeleted, false);
  const sortByStartDate = (t: any, { asc }: any) => asc(t.startDate);

  const [tripsList, totalRows] = await Promise.all([
    context.db.query.trips.findMany({
      where: matchTripIds,
      with: {
        groups: {
          where: excludeDeletedGroups,
        },
        tripSponsors: {
          with: {
            sponsor: true,
          },
        },
      },
      orderBy: sortByStartDate,
      limit,
      offset,
    }),
    context.db
      .select({ count: sql<number>`count(*)` })
      .from(trips)
      .where(inArray(trips.id, tripIds)),
  ]);

  const total = totalRows[0]?.count ?? 0;

  return {
    trips: tripsList.map(buildTripListItem),
    pagination: calculatePagination(limit, offset, total),
  };
};

async function fetchTripWithRelations(db: DB, tripId: string) {
  return db.query.trips.findFirst({
    where: (t: any, { eq }: any) => eq(t.id, tripId),
    with: {
      groups: {
        where: (g: any, { eq }: any) => eq(g.isDeleted, false),
      },
      tripSponsors: {
        with: {
          sponsor: true,
        },
      },
      participants: {
        with: {
          user: true,
          group: true,
        },
      },
    },
  });
}

async function buildTripDetail(
  trip: any,
  supabase: Parameters<typeof buildAuthEmailLookup>[0],
  db: DB,
) {
  const groupIds = trip.groups.map((g: any) => g.id);
  let countMap = new Map<string | null, number>();
  if (groupIds.length > 0) {
    const participantCounts = await db
      .select({
        groupId: tripParticipants.groupId,
        count: sql<number>`count(*)`,
      })
      .from(tripParticipants)
      .where(inArray(tripParticipants.groupId, groupIds))
      .groupBy(tripParticipants.groupId);
    countMap = buildParticipantCountMap(participantCounts);
  }

  const emailByAuthUserId = await buildAuthEmailLookup(
    supabase,
    trip.participants.map((participant: any) => participant.user?.authUserId).filter(Boolean),
  );

  const resolvedGroupImages = new Map<string, string | null | undefined>(
    await Promise.all(
      trip.groups.map(
        async (group: any) =>
          [group.id as string, await resolveGroupImage(supabase, group.image)] as [
            string,
            string | null | undefined,
          ],
      ),
    ),
  );

  return {
    ...trip,
    ...buildTripDetailResponse(trip, countMap, emailByAuthUserId, resolvedGroupImages),
  };
}

export const getById = async (
  context: {
    db: DB;
    dbUser: { id: string };
    supabase: Parameters<typeof buildAuthEmailLookup>[0];
  },
  input: { id: string },
) => {
  const matchParticipant = (tp: any, { eq, and }: any) =>
    and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.id));

  const isParticipant = await context.db.query.tripParticipants.findFirst({
    where: matchParticipant,
  });

  if (!isParticipant) {
    throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
  }

  const trip = await fetchTripWithRelations(context.db, input.id);

  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  return buildTripDetail(trip, context.supabase, context.db);
};

export const getByIdAdmin = async (
  context: {
    db: DB;
    supabase: Parameters<typeof buildAuthEmailLookup>[0];
  },
  input: { id: string },
) => {
  const trip = await fetchTripWithRelations(context.db, input.id);

  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  return buildTripDetail(trip, context.supabase, context.db);
};

export const getResources = async (
  context: {
    db: DB;
    dbUser: { id: string };
  },
  input: { tripId: string },
) => {
  const isParticipant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
  });

  if (!isParticipant) {
    throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
  }

  const matchTripResourcesByTripId = (tr: any, { eq }: any) => eq(tr.tripId, input.tripId);
  const sortBySortOrder = (tr: any, { asc }: any) => asc(tr.sortOrder);
  const matchTripInsuranceByTripId = (ti: any, { eq }: any) => eq(ti.tripId, input.tripId);
  const sortByStepNumber = (s: any, { asc }: any) => asc(s.stepNumber);

  const resources = await context.db.query.tripResources.findMany({
    where: matchTripResourcesByTripId,
    orderBy: sortBySortOrder,
  });
  const insurance = await context.db.query.tripInsurances.findFirst({
    where: matchTripInsuranceByTripId,
    with: {
      steps: {
        orderBy: sortByStepNumber,
      },
    },
  });
  return { resources, insurance };
};
