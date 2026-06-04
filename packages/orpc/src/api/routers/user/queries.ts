import { groups, tripParticipants, users } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import {
  buildPagination,
  buildUserSearchWhere,
  filterParticipantsByEmail,
  mapParticipantRow,
  normalizeEmail,
  parseBanStatus,
  sortParticipants,
} from "@mirai-app/shared/users";
import type { SupabaseClient } from "@mirai-app/supabase";
import { ORPCError } from "@orpc/server";
import { and, asc, count, eq, sql } from "drizzle-orm";
import type { z } from "zod";
import {
  buildAuthEmailLookup,
  buildAuthUserSummaryLookup,
  resolveAuthEmail,
} from "../../../utils/authEmails";
import { logger } from "../../../utils/logger";
import type { SupabaseAdminUser, roleSchema } from "./types";
import { toPublicUser, toPublicUserWithAuthSummary } from "./utils";

export type UserBaseContext = {
  db: DB;
  supabase: SupabaseClient;
  accessToken: string | null;
};

export type UserContext = UserBaseContext & {
  dbUser: { id: string; role: string };
};

export const getBanStatus = async (context: UserBaseContext) => {
  if (!context.accessToken) {
    return { banned: false, bannedUntil: null, reason: null };
  }

  const { data, error } = await context.supabase.auth.getUser(context.accessToken);
  if (error || !data.user) {
    return { banned: false, bannedUntil: null, reason: null };
  }

  const adminLookup = await context.supabase.auth.admin.getUserById(data.user.id);
  if (adminLookup.error) {
    logger.warn(
      `[Auth] Failed to check ban status for ${data.user.id}: ${adminLookup.error.message}`,
    );
    return { banned: false, bannedUntil: null, reason: null };
  }

  const adminUser = adminLookup.data.user as SupabaseAdminUser | null;
  return parseBanStatus(adminUser?.banned_until, adminUser?.app_metadata?.ban_reason);
};

export const getBanStatusByEmail = async (context: UserBaseContext, input: { email: string }) => {
  const normalizedEmail = normalizeEmail(input.email);
  const perPage = 1000;
  let page = 1;
  let authUserId: string | null = null;

  while (true) {
    const { data, error } = await context.supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }

    const found = data?.users?.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (found?.id) {
      authUserId = found.id;
      break;
    }

    if (!data || data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  if (!authUserId) {
    return { exists: false, banned: false, bannedUntil: null, reason: null };
  }

  const lookup = await context.supabase.auth.admin.getUserById(authUserId);
  if (lookup.error || !lookup.data.user) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: lookup.error?.message ?? "Failed to fetch auth user",
    });
  }

  const adminUser = lookup.data.user as SupabaseAdminUser | null;
  return {
    exists: true,
    ...parseBanStatus(adminUser?.banned_until, adminUser?.app_metadata?.ban_reason),
  };
};

export const getById = async (context: UserContext, input: { id: string }) => {
  const dbUser = await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, input.id),
  });

  if (!dbUser) return null;

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [dbUser.authUserId]);

  return {
    ...dbUser,
    email: resolveAuthEmail(emailByAuthUserId, dbUser.authUserId),
  };
};

export const getTripParticipant = async (
  context: UserContext,
  input: { userId: string; tripId: string },
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, input.userId), eq(tp.tripId, input.tripId)),
    columns: {
      userId: true,
      tripId: true,
      wristNumber: true,
      houseNumber: true,
    },
  });
  return participant ?? null;
};

export const getByIdWithGroup = async (
  context: UserContext,
  input: { id: string; tripId: string },
) => {
  return await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, input.id),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
    },
    with: {
      trips: {
        where: (tp, { eq }) => eq(tp.tripId, input.tripId),
        with: {
          group: { columns: { id: true, name: true } },
          trip: { columns: { id: true, name: true } },
        },
      },
      organizerGroup: { columns: { id: true, name: true } },
    },
  });
};

export const getMyWithGroup = async (context: UserContext, input: { tripId: string }) => {
  return await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, context.dbUser.id),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
    },
    with: {
      trips: {
        where: (tp, { eq }) => eq(tp.tripId, input.tripId),
        with: {
          group: { columns: { id: true, name: true } },
          trip: { columns: { id: true, name: true } },
        },
      },
      organizerGroup: { columns: { id: true, name: true } },
    },
  });
};

export const getMy = async (context: UserContext) => {
  const baseUser = await context.db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, context.dbUser.id),
  });
  if (!baseUser) return null;

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [baseUser.authUserId]);

  const hydratedUser = {
    ...baseUser,
    email: resolveAuthEmail(emailByAuthUserId, baseUser.authUserId),
  };

  return hydratedUser;
};

export const getAll = async (context: UserContext, input: { tripId: string }) => {
  const rows = await context.db
    .select()
    .from(tripParticipants)
    .innerJoin(users, eq(tripParticipants.userId, users.id))
    .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
    .where(eq(tripParticipants.tripId, input.tripId))
    .orderBy(asc(users.firstName), asc(users.lastName));

  const participants = rows.map(mapParticipantRow);

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    participants.map((participant) => participant.user.authUserId),
  );

  return participants.map((participant) => ({
    ...toPublicUser(
      {
        ...participant.user,
        role: participant.user.role as z.infer<typeof roleSchema>,
      },
      emailByAuthUserId,
    ),
    wristNumber: participant.wristNumber,
    houseNumber: participant.houseNumber,
    group: participant.group,
    tripId: participant.tripId,
  }));
};

export const getAllAdminsNames = async (context: UserContext) => {
  return await context.db.query.users.findMany({
    where: (u, { eq }) => eq(u.role, "ADMIN" as z.infer<typeof roleSchema>),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: (u, { asc }) => [asc(u.firstName), asc(u.lastName)],
  });
};

export const searchWithPagination = async (
  context: UserContext,
  input: {
    tripId: string;
    field: "firstName" | "lastName" | "email" | "wristNumber" | "houseNumber" | "groupName";
    searchTerm?: string;
    pagination?: {
      limit: number;
      offset: number;
    };
    page?: number;
    limit?: number;
  },
) => {
  const { searchTerm, field, tripId } = input;
  const fallbackLimit = input.limit ?? 20;
  const limit = input.pagination?.limit ?? fallbackLimit;
  const page = input.page ?? 1;
  const offset = input.pagination?.offset ?? (page - 1) * limit;
  const currentPage = Math.floor(offset / limit) + 1;

  const toPagination = (total: number) => {
    const pagination = buildPagination(total, limit, offset, currentPage);
    return {
      total,
      totalCount: total,
      limit,
      offset,
      hasMore: pagination.hasNextPage,
      hasNextPage: pagination.hasNextPage,
      currentPage,
      totalPages: pagination.totalPages,
      hasPreviousPage: pagination.hasPreviousPage,
    };
  };

  if (field === "email") {
    const participantRows = await context.db.query.tripParticipants.findMany({
      where: (tp, { eq }) => eq(tp.tripId, tripId),
      with: {
        user: {
          columns: {
            id: true,
            authUserId: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        group: { columns: { id: true, name: true } },
      },
    });

    const authSummaryById = await buildAuthUserSummaryLookup(
      context.supabase,
      participantRows.map((participant) => participant.user.authUserId),
    );

    const authSummaryByUserId = new Map(
      participantRows.map((p) => [
        p.user.id,
        authSummaryById.get(p.user.authUserId) ?? { email: null },
      ]),
    );
    const filtered = filterParticipantsByEmail(
      participantRows,
      searchTerm,
      authSummaryByUserId,
    ) as typeof participantRows;

    const enriched = filtered.map((p) => ({
      ...p,
      user: {
        ...p.user,
        authSummary: authSummaryById.get(p.user.authUserId) ?? { email: null },
      },
    })) as typeof participantRows;
    const sorted = sortParticipants(enriched, "firstName") as typeof participantRows;

    const paged = sorted.slice(offset, offset + limit);
    const total = filtered.length;

    return {
      users: paged.map((participant) => ({
        ...toPublicUserWithAuthSummary(
          {
            id: participant.user.id,
            authUserId: participant.user.authUserId,
            firstName: participant.user.firstName,
            lastName: participant.user.lastName,
            role: participant.user.role as z.infer<typeof roleSchema>,
          },
          authSummaryById,
        ),
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
        group: participant.group,
        tripId: participant.tripId,
      })),
      pagination: toPagination(total),
    };
  }

  const where =
    field === "houseNumber" && searchTerm
      ? and(
          eq(tripParticipants.tripId, tripId),
          sql`LOWER(${tripParticipants.houseNumber}) LIKE LOWER(${`%${searchTerm}%`})`,
        )
      : buildUserSearchWhere(tripId, field, searchTerm);

  const [rows, totalResult] = await Promise.all([
    context.db
      .select()
      .from(tripParticipants)
      .innerJoin(users, eq(tripParticipants.userId, users.id))
      .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
      .where(where)
      .orderBy(asc(users.firstName), asc(users.lastName))
      .limit(limit)
      .offset(offset),
    context.db
      .select({ count: count() })
      .from(tripParticipants)
      .innerJoin(users, eq(tripParticipants.userId, users.id))
      .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
      .where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const participants = rows.map((r) => ({
    ...r.trip_participants,
    user: {
      id: r.users.id,
      authUserId: r.users.authUserId,
      firstName: r.users.firstName,
      lastName: r.users.lastName,
      role: r.users.role as z.infer<typeof roleSchema>,
    },
    group: r.groups ? { id: r.groups.id, name: r.groups.name } : null,
  }));

  const authSummaryById = await buildAuthUserSummaryLookup(
    context.supabase,
    participants.map((participant) => participant.user.authUserId),
  );

  return {
    users: participants.map((participant) => ({
      ...toPublicUserWithAuthSummary(participant.user, authSummaryById),
      wristNumber: participant.wristNumber,
      houseNumber: participant.houseNumber,
      group: participant.group,
      tripId: participant.tripId,
    })),
    pagination: toPagination(total),
  };
};
