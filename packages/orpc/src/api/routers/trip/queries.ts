import { buildParticipantCountMap, calculatePagination } from "@mirai-app/common/groups";
import { attachSponsorDisplay } from "@mirai-app/common/sponsors";
import { mergeTripResourceFragments } from "@mirai-app/common/tripInfo";
import { buildTripDetailResponse, buildTripListItem } from "@mirai-app/common/trips";
import { type DB, tripParticipants, trips } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { getActivitiesPage } from "../activityFeed/queries";
import type { Activity } from "../activityFeed/types";
import { getAllByTrip as getAllChallengesByTrip } from "../challenge/queries";
import { getAll as getAllGroups } from "../group/queries";
import { getByTripId as getSponsorsByTripId } from "../sponsor/queries";
import type { OrderByCallback, WhereCallback } from "../utils/drizzle-types";
import type { TripDetail } from "./types";
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
      // Per-trip logo layout (height/offsets) lives here since migration
      // 20260605202256_freezing_venom moved it off the sponsors table.
      tripSponsorDisplays: true,
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
): Promise<TripDetail> {
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
  const detail = buildTripDetailResponse(
    normalizedTrip,
    countMap,
    emailByAuthUserId,
    resolvedGroupImages,
  );
  return {
    ...normalizedTrip,
    ...detail,
    tripSponsors: attachSponsorDisplay(detail.tripSponsors, trip.tripSponsorDisplays),
  } as TripDetail;
}

export const getById = async (
  context: {
    db: DB;
    dbUser: { id: string };
    supabase: Parameters<typeof buildAuthEmailLookup>[0];
  },
  input: { id: string },
): Promise<TripDetail> => {
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

export const getByIdFull = async (
  context: {
    db: DB;
    dbUser: { id: string; role: string };
    supabase: Parameters<typeof buildAuthEmailLookup>[0];
  },
  input: { id: string },
): Promise<{
  trip: TripDetail;
  groups: Awaited<ReturnType<typeof getAllGroups>>["groups"];
  challenges: Awaited<ReturnType<typeof getAllChallengesByTrip>>["challenges"];
  sponsors: Awaited<ReturnType<typeof getSponsorsByTripId>>;
  latestNews: Activity[];
}> => {
  const trip = await getById(context, input);

  const [groups, challenges, sponsors, feed] = await Promise.all([
    getAllGroups(
      { db: context.db, supabase: context.supabase, dbUser: context.dbUser },
      { tripId: input.id },
    ),
    getAllChallengesByTrip(
      { db: context.db, supabase: context.supabase, dbUser: context.dbUser },
      { tripId: input.id },
    ),
    getSponsorsByTripId({ db: context.db }, { tripId: input.id }),
    getActivitiesPage({
      context,
      tripId: input.id,
      page: 1,
      pageSize: 30,
      includeHidden: false,
    }),
  ]);

  const latestNews = feed.activities.filter(
    (activity): activity is Extract<Activity, { activityType: "custom" }> =>
      activity.activityType === "custom",
  );

  return { trip, groups: groups.groups, challenges: challenges.challenges, sponsors, latestNews };
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

  // One logical resource is stored as up to four rows, one per table that can
  // hold part of its payload, so the fragments are recombined here before they
  // reach the client.
  const resources = mergeTripResourceFragments(
    [...links, ...files, ...texts, ...icons]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((resource) => toClientTripResource(resource)),
  );

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
