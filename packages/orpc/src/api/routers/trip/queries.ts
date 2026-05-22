import { ORPCError } from "@orpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import {
  trips,
  tripParticipants,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
  groups,
  type DB,
} from "@mirai-app/db";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../../utils/authEmails";
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
      pagination: { total: 0, limit, offset, hasMore: false },
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
    trips: tripsList.map((trip) => ({
      ...trip,
      tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
};

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
  const matchTripId = (t: any, { eq }: any) => eq(t.id, input.id);
  const excludeDeletedGroups = (g: any, { eq }: any) => eq(g.isDeleted, false);

  const isParticipant = await context.db.query.tripParticipants.findFirst({
    where: matchParticipant,
  });

  if (!isParticipant) {
    throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
  }

  const trip = await context.db.query.trips.findFirst({
    where: matchTripId,
    with: {
      groups: {
        where: excludeDeletedGroups,
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
  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  const groupIds = trip.groups.map((g) => g.id);
  let countMap = new Map<string, number>();
  if (groupIds.length > 0) {
    const participantCounts = await context.db
      .select({
        groupId: tripParticipants.groupId,
        count: sql<number>`count(*)`,
      })
      .from(tripParticipants)
      .where(inArray(tripParticipants.groupId, groupIds))
      .groupBy(tripParticipants.groupId);
    countMap = new Map(participantCounts.map((c) => [c.groupId!, c.count]));
  }

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    trip.participants.map((participant) => participant.user?.authUserId).filter(Boolean),
  );

  return {
    ...trip,
    tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
    groups: await Promise.all(
      trip.groups.map(async (group) => ({
        ...group,
        _count: { participants: countMap.get(group.id) ?? 0 },
        image: await resolveGroupImage(context.supabase, group.image),
      })),
    ),
    participants: trip.participants.map((participant) => {
      if (!participant.user) {
        return participant;
      }
      const { authUserId, ...user } = participant.user;
      return {
        ...participant,
        group: participant.group
          ? participant.group.isDeleted
            ? null
            : {
                ...participant.group,
                _count: { participants: countMap.get(participant.group.id) ?? 0 },
                image: participant.group.image,
              }
          : participant.group,
        user: {
          ...user,
          email: resolveAuthEmail(emailByAuthUserId, authUserId),
        },
      };
    }),
  };
};

export const getByIdAdmin = async (
  context: {
    db: DB;
    supabase: Parameters<typeof buildAuthEmailLookup>[0];
  },
  input: { id: string },
) => {
  const matchTripId = (t: any, { eq }: any) => eq(t.id, input.id);
  const excludeDeletedGroups = (g: any, { eq }: any) => eq(g.isDeleted, false);

  const trip = await context.db.query.trips.findFirst({
    where: matchTripId,
    with: {
      groups: {
        where: excludeDeletedGroups,
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
  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  const groupIds = trip.groups.map((g) => g.id);
  let countMap = new Map<string, number>();
  if (groupIds.length > 0) {
    const participantCounts = await context.db
      .select({
        groupId: tripParticipants.groupId,
        count: sql<number>`count(*)`,
      })
      .from(tripParticipants)
      .where(inArray(tripParticipants.groupId, groupIds))
      .groupBy(tripParticipants.groupId);
    countMap = new Map(participantCounts.map((c) => [c.groupId!, c.count]));
  }

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    trip.participants.map((participant) => participant.user?.authUserId).filter(Boolean),
  );

  return {
    ...trip,
    tripSponsors: trip.tripSponsors.filter((ts) => ts.sponsor?.isActive),
    groups: await Promise.all(
      trip.groups.map(async (group) => ({
        ...group,
        _count: { participants: countMap.get(group.id) ?? 0 },
        image: await resolveGroupImage(context.supabase, group.image),
      })),
    ),
    participants: trip.participants.map((participant) => {
      if (!participant.user) {
        return participant;
      }
      const { authUserId, ...user } = participant.user;
      return {
        ...participant,
        group: participant.group
          ? participant.group.isDeleted
            ? null
            : {
                ...participant.group,
                _count: { participants: countMap.get(participant.group.id) ?? 0 },
                image: participant.group.image,
              }
          : participant.group,
        user: {
          ...user,
          email: resolveAuthEmail(emailByAuthUserId, authUserId),
        },
      };
    }),
  };
};

export const getResources = async (
  context: {
    db: DB;
    dbUser: { id: string };
  },
  input: { tripId: string },
) => {
  const isParticipant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) =>
      and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
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
