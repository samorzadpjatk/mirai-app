import { type DB, tripParticipants, trips } from "@mirai-app/db";
import { buildParticipantCountMap, calculatePagination } from "@mirai-app/shared/groups";
import { buildTripDetailResponse, buildTripListItem } from "@mirai-app/shared/trips";
import { ORPCError } from "@orpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import type { OrderByCallback, WhereCallback } from "../utils/drizzle-types";
import {
  resolveGroupImage,
  toClientTrip,
  toClientTripInsurance,
  toClientTripInsuranceStep,
  toClientTripResource,
} from "./utils";

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

  const matchTripIds: WhereCallback<"trips"> = (t, { inArray }) => inArray(t.id, tripIds);
  const excludeDeletedGroups: WhereCallback<"groups"> = (g, { eq }) => eq(g.isDeleted, false);
  const sortByStartDate: OrderByCallback<"trips"> = (t, { asc }) => asc(t.startDate);

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
    trips: tripsList.map((trip) => buildTripListItem(toClientTrip(trip))),
    pagination: calculatePagination(limit, offset, total),
  };
};

async function fetchTripWithRelations(db: DB, tripId: string) {
  return db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, tripId),
    with: {
      groups: {
        where: (g, { eq }) => eq(g.isDeleted, false),
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

type TripWithRelations = Awaited<ReturnType<typeof fetchTripWithRelations>>;

async function buildTripDetail(
  trip: NonNullable<TripWithRelations>,
  supabase: Parameters<typeof buildAuthEmailLookup>[0],
  db: DB,
) {
  const groupIds = trip.groups.map((g) => g.id);
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
    trip.participants.map((participant) => participant.user?.authUserId).filter(Boolean),
  );

  const resolvedGroupImages = new Map<string, string | null | undefined>(
    await Promise.all(
      trip.groups.map(
        async (group) =>
          [group.id as string, await resolveGroupImage(supabase, group.image)] as [
            string,
            string | null | undefined,
          ],
      ),
    ),
  );

  const normalizedTrip = toClientTrip(trip);
  return {
    ...normalizedTrip,
    ...buildTripDetailResponse(normalizedTrip, countMap, emailByAuthUserId, resolvedGroupImages),
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
  const matchParticipant: WhereCallback<"tripParticipants"> = (tp, { eq, and }) =>
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

  const matchTripInsuranceByTripId: WhereCallback<"tripInsurances"> = (ti, { eq }) =>
    eq(ti.tripId, input.tripId);
  const sortByStepNumber: OrderByCallback<"tripInsuranceSteps"> = (s, { asc }) => asc(s.stepNumber);

  const [links, files, texts, icons] = await Promise.all([
    context.db.query.tripResourceLinks.findMany({
      where: (tr, { eq }) => eq(tr.tripId, input.tripId),
      orderBy: (tr, { asc }) => asc(tr.sortOrder),
    }),
    context.db.query.tripResourceFiles.findMany({
      where: (tr, { eq }) => eq(tr.tripId, input.tripId),
      orderBy: (tr, { asc }) => asc(tr.sortOrder),
    }),
    context.db.query.tripResourceTexts.findMany({
      where: (tr, { eq }) => eq(tr.tripId, input.tripId),
      orderBy: (tr, { asc }) => asc(tr.sortOrder),
    }),
    context.db.query.tripResourceIcons.findMany({
      where: (tr, { eq }) => eq(tr.tripId, input.tripId),
      orderBy: (tr, { asc }) => asc(tr.sortOrder),
    }),
  ]);

  const resources = [...links, ...files, ...texts, ...icons]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((resource) => toClientTripResource(resource));

  const insurance = await context.db.query.tripInsurances.findFirst({
    where: matchTripInsuranceByTripId,
    with: {
      steps: {
        orderBy: sortByStepNumber,
      },
    },
  });
  return {
    resources,
    insurance: insurance
      ? {
          ...toClientTripInsurance(insurance),
          steps: insurance.steps.map((step) => toClientTripInsuranceStep(step)),
        }
      : null,
  };
};
