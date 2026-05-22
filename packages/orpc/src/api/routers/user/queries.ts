import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { eq, and, count, ilike, asc } from "drizzle-orm";
import { users, tripParticipants, groups } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import {
  buildAuthEmailLookup,
  buildAuthUserSummaryLookup,
  resolveAuthEmail,
} from "../../../utils/authEmails";
import type { SupabaseAdminUser, roleSchema } from "./types";
import { toPublicUser, toPublicUserWithAuthSummary } from "./utils";
import { logger } from "../../../utils/logger";

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
  const bannedUntilRaw = adminUser?.banned_until ?? null;
  const reasonRaw = adminUser?.app_metadata?.ban_reason ?? null;

  if (!bannedUntilRaw) {
    return { banned: false, bannedUntil: null, reason: null };
  }

  const bannedUntil = new Date(bannedUntilRaw);
  if (Number.isNaN(bannedUntil.getTime()) || bannedUntil.getTime() <= Date.now()) {
    return { banned: false, bannedUntil: null, reason: null };
  }

  return {
    banned: true,
    bannedUntil: bannedUntil.toISOString(),
    reason: reasonRaw ?? "Temporary ban",
  };
};

export const getBanStatusByEmail = async (
  context: UserBaseContext,
  input: { email: string },
) => {
  const normalizedEmail = input.email.trim().toLowerCase();
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
  const bannedUntilRaw = adminUser?.banned_until ?? null;
  const reasonRaw = adminUser?.app_metadata?.ban_reason ?? null;

  if (!bannedUntilRaw) {
    return { exists: true, banned: false, bannedUntil: null, reason: null };
  }

  const bannedUntil = new Date(bannedUntilRaw);
  if (Number.isNaN(bannedUntil.getTime()) || bannedUntil.getTime() <= Date.now()) {
    return { exists: true, banned: false, bannedUntil: null, reason: null };
  }

  return {
    exists: true,
    banned: true,
    bannedUntil: bannedUntil.toISOString(),
    reason: reasonRaw ?? "Temporary ban",
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

export const getMyWithGroup = async (
  context: UserContext,
  input: { tripId: string },
) => {
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

  const participants = rows.map((r) => ({
    ...r.trip_participants,
    user: {
      id: r.users.id,
      authUserId: r.users.authUserId,
      firstName: r.users.firstName,
      lastName: r.users.lastName,
      role: r.users.role,
    },
    group: r.groups ? { id: r.groups.id, name: r.groups.name } : null,
  }));

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    participants.map((participant) => participant.user.authUserId),
  );

  return participants.map((participant) => ({
    ...toPublicUser(participant.user, emailByAuthUserId),
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
    field:
      | "firstName"
      | "lastName"
      | "email"
      | "wristNumber"
      | "houseNumber"
      | "groupName";
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
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = offset + limit < total;
    return {
      total,
      totalCount: total,
      limit,
      offset,
      hasMore: hasNextPage,
      hasNextPage,
      currentPage,
      totalPages,
      hasPreviousPage: currentPage > 1,
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

    const normalizedSearch = searchTerm?.toLowerCase();
    const filtered = participantRows.filter((participant) => {
      if (!normalizedSearch) return true;
      const email = authSummaryById.get(participant.user.authUserId)?.email ?? null;
      return email?.toLowerCase().includes(normalizedSearch) ?? false;
    });

    const sorted = filtered.sort((a, b) => {
      const aUser = toPublicUserWithAuthSummary(a.user, authSummaryById);
      const bUser = toPublicUserWithAuthSummary(b.user, authSummaryById);
      const firstNameCompare = (aUser.firstName ?? "").localeCompare(bUser.firstName ?? "");
      if (firstNameCompare !== 0) return firstNameCompare;

      const lastNameCompare = (aUser.lastName ?? "").localeCompare(bUser.lastName ?? "");
      if (lastNameCompare !== 0) return lastNameCompare;

      return (aUser.email ?? "").localeCompare(bUser.email ?? "");
    });

    const paged = sorted.slice(offset, offset + limit);
    const total = filtered.length;

    return {
      users: paged.map((participant) => ({
        ...toPublicUserWithAuthSummary(participant.user, authSummaryById),
        wristNumber: participant.wristNumber,
        houseNumber: participant.houseNumber,
        group: participant.group,
        tripId: participant.tripId,
      })),
      pagination: toPagination(total),
    };
  }

  const buildWhere = () => {
    const base = eq(tripParticipants.tripId, tripId);
    if (!searchTerm) return base;
    if (field === "groupName") {
      return and(base, ilike(groups.name, `%${searchTerm}%`));
    }
    if (field === "firstName") {
      return and(base, ilike(users.firstName, `%${searchTerm}%`));
    }
    if (field === "lastName") {
      return and(base, ilike(users.lastName, `%${searchTerm}%`));
    }
    if (field === "wristNumber") {
      return and(base, ilike(tripParticipants.wristNumber, `%${searchTerm}%`));
    }
    if (field === "houseNumber") {
      return and(base, ilike(tripParticipants.houseNumber, `%${searchTerm}%`));
    }
    return base;
  };

  const where = buildWhere();

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
      role: r.users.role,
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
