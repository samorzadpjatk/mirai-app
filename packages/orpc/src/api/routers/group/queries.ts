import { eq, and, inArray, count } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { groups, tripParticipants } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { toUserWithEmail, batchEmailLookup, resolveGroupImage } from "./utils";
import {
  canViewJoinRequests,
  calculatePagination,
  mapApprovedSubmissions,
  buildParticipantCountMap,
} from "@mirai-app/shared/groups";

export type GroupContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string; role: string };
};

export const getAllNames = async (context: GroupContext, input: { tripId: string }) => {
  return await context.db.query.groups.findMany({
    columns: {
      id: true,
      name: true,
    },
    where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
  });
};

export const getMy = async (context: GroupContext, input: { tripId: string }) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { and, eq }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
    columns: { groupId: true },
  });
  if (!participant?.groupId) return null;
  const group = await context.db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.id, participant.groupId!),
    with: {
      participants: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      },
      organizer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
      coinTransactions: {
        with: {
          admin: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      },
    },
  });

  if (!group || group.isDeleted) return null;

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    group.organizer?.authUserId,
    ...group.participants.map((participant) => participant.user.authUserId),
  ]);

  return {
    ...group,
    image: await resolveGroupImage(context.supabase, group.image),
    organizer: group.organizer
      ? toUserWithEmail(group.organizer, emailByAuthUserId)
      : group.organizer,
    participants: group.participants.map((participant) => ({
      ...participant,
      user: toUserWithEmail(participant.user, emailByAuthUserId),
    })),
  };
};

export const getAll = async (
  context: GroupContext,
  input: {
    tripId: string;
    pagination?: {
      limit: number;
      offset: number;
    };
  },
) => {
  const limit = input.pagination?.limit ?? 30;
  const offset = input.pagination?.offset ?? 0;
  const whereExpr = and(eq(groups.tripId, input.tripId), eq(groups.isDeleted, false));

  const [groupsResult, totalResult] = await Promise.all([
    context.db.query.groups.findMany({
      where: whereExpr,
      with: {
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
          },
        },
        organizer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            authUserId: true,
          },
        },
        coinTransactions: {
          with: {
            admin: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: (ct, { desc }) => [desc(ct.createdAt)],
          limit: 10,
        },
      },
      orderBy: (g, { asc }) => [asc(g.name)],
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(groups).where(whereExpr),
  ]);

  const emailByAuthUserId = await batchEmailLookup(context.supabase, groupsResult);

  return {
    groups: await Promise.all(
      groupsResult.map(async (group) => ({
        ...group,
        image: await resolveGroupImage(context.supabase, group.image),
        organizer: group.organizer
          ? toUserWithEmail(group.organizer, emailByAuthUserId)
          : group.organizer,
        participants: group.participants.map((participant) => ({
          ...participant,
          user: toUserWithEmail(participant.user, emailByAuthUserId),
        })),
      })),
    ),
    pagination: calculatePagination(limit, offset, totalResult[0]?.count ?? 0),
  };
};

export const getGroupList = async (context: GroupContext, input: { tripId: string }) => {
  const groupsResult = await context.db.query.groups.findMany({
    where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
    columns: {
      id: true,
      name: true,
      description: true,
      image: true,
      code: true,
      coins: true,
    },
    with: {
      organizer: {
        columns: { id: true, firstName: true, lastName: true },
      },
    },
  });

  const groupIds = groupsResult.map((g) => g.id);
  const participantCounts =
    groupIds.length > 0
      ? await context.db
          .select({
            groupId: tripParticipants.groupId,
            count: count(tripParticipants.id),
          })
          .from(tripParticipants)
          .where(inArray(tripParticipants.groupId, groupIds))
          .groupBy(tripParticipants.groupId)
      : [];

  const countMap = buildParticipantCountMap(participantCounts);
  const groupsWithCount = groupsResult.map((g) => ({
    ...g,
    _count: { participants: countMap.get(g.id) ?? 0 },
  }));

  return await Promise.all(
    groupsWithCount.map(async (group) => ({
      ...group,
      image: await resolveGroupImage(context.supabase, group.image),
    })),
  );
};

export const getById = async (context: GroupContext, input: { id: string }) => {
  const group = await context.db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.id, input.id),
    with: {
      participants: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
              authUserId: true,
              role: true,
            },
          },
        },
      },
      organizer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
      trip: {
        columns: {
          id: true,
          name: true,
        },
      },
      challengeSubmissions: {
        where: (cs, { eq }) => eq(cs.status, "APPROVED"),
        columns: {
          id: true,
          imageIds: true,
          createdAt: true,
          reviewedAt: true,
        },
        with: {
          challenge: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: (cs, { desc }) => [desc(cs.reviewedAt), desc(cs.createdAt)],
      },
    },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const executionCountResult = await context.db
    .select({ count: count() })
    .from(tripParticipants)
    .where(eq(tripParticipants.groupId, input.id));

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    group.organizer?.authUserId,
    ...group.participants.map((participant) => participant.user.authUserId),
  ]);

  const approvedSubmissions = mapApprovedSubmissions(group.challengeSubmissions);

  return {
    ...group,
    _count: { participants: executionCountResult[0]?.count ?? 0 },
    image: await resolveGroupImage(context.supabase, group.image),
    organizer: group.organizer
      ? toUserWithEmail(group.organizer, emailByAuthUserId)
      : group.organizer,
    participants: group.participants.map((participant) => ({
      ...participant,
      user: toUserWithEmail(participant.user, emailByAuthUserId),
    })),
    approvedSubmissions,
  };
};

export const getByIdWithOrganizer = async (context: GroupContext, input: { groupId: string }) => {
  const group = await context.db.query.groups.findFirst({
    where: (g, { and, eq }) => and(eq(g.id, input.groupId), eq(g.isDeleted, false)),
    columns: {
      id: true,
      name: true,
      code: true,
      coins: true,
    },
    with: {
      organizer: { columns: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!group) return null;

  const countResult = await context.db
    .select({ count: count() })
    .from(tripParticipants)
    .where(eq(tripParticipants.groupId, input.groupId));

  return {
    ...group,
    _count: { participants: countResult[0]?.count ?? 0 },
  };
};

export const getPendingJoinRequests = async (context: GroupContext, input: { groupId: string }) => {
  const group = await context.db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.id, input.groupId),
    columns: { id: true, organizerId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const viewCheck = canViewJoinRequests(group.organizerId, context.dbUser.id);
  if (viewCheck.error) {
    throw new ORPCError(viewCheck.error, { message: viewCheck.message });
  }

  const requests = await context.db.query.groupJoinRequests.findMany({
    where: (gjr, { eq }) => eq(gjr.groupId, group.id),
    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
    },
    orderBy: (gjr, { asc }) => [asc(gjr.createdAt)],
  });

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    requests.map((request) => request.user.authUserId),
  );

  return requests.map((request) => ({
    ...request,
    user: toUserWithEmail(request.user, emailByAuthUserId),
  }));
};

export const getMyJoinRequestForGroup = async (
  context: GroupContext,
  input: { groupId: string },
) => {
  const group = await context.db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.id, input.groupId),
    columns: { id: true, tripId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  const joinRequest = await context.db.query.groupJoinRequests.findFirst({
    where: (gjr, { and, eq }) =>
      and(
        eq(gjr.groupId, group.id),
        eq(gjr.tripId, group.tripId),
        eq(gjr.userId, context.dbUser.id),
      ),
    orderBy: (gjr, { desc }) => [desc(gjr.createdAt)],
  });
  return joinRequest ?? null;
};

export const ranking = async (context: GroupContext, input: { tripId: string }) => {
  const currentDate = new Date();
  const data = await context.db.query.groups.findMany({
    where: (g, { and, eq }) => and(eq(g.tripId, input.tripId), eq(g.isDeleted, false)),
    orderBy: (g, { desc }) => [desc(g.coins)],
    with: {
      organizer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          authUserId: true,
        },
      },
      participants: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      },
      coinTransactions: {
        with: {
          admin: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: (ct, { desc }) => [desc(ct.createdAt)],
      },
    },
  });

  const emailByAuthUserId = await batchEmailLookup(context.supabase, data);

  return {
    data: await Promise.all(
      data.map(async (group) => ({
        ...group,
        image: await resolveGroupImage(context.supabase, group.image),
        organizer: group.organizer
          ? toUserWithEmail(group.organizer, emailByAuthUserId)
          : group.organizer,
        participants: group.participants.map((participant) => ({
          ...participant,
          user: toUserWithEmail(participant.user, emailByAuthUserId),
        })),
      })),
    ),
    currentDate,
  };
};
