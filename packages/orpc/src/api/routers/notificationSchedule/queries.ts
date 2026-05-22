import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { moderatorProcedure } from "../../trpc";
import { eq, and, gte, lte, ilike, count, inArray } from "drizzle-orm";
import { notificationSchedules, notificationScheduleExecutions } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { attachCreatedByEmail } from "./utils";
import { paginationSchema, filterSchema } from "./types";

type NotificationScheduleQueryContext = {
  db: DB;
  supabase: SupabaseClient;
};

export async function handleGetAll({
  input,
  context,
}: {
  input: { pagination?: z.infer<typeof paginationSchema>; filter?: z.infer<typeof filterSchema> } | undefined;
  context: NotificationScheduleQueryContext;
}) {
  const { pagination, filter } = input ?? {};
  const limit = pagination?.limit ?? 50;
  const offset = pagination?.offset ?? 0;

  const conditions = [];

  if (filter?.tripId !== undefined) {
    conditions.push(eq(notificationSchedules.tripId, filter.tripId));
  }

  if (filter?.notificationType) {
    conditions.push(eq(notificationSchedules.notificationType, filter.notificationType));
  }

  if (filter?.isActive !== undefined) {
    conditions.push(eq(notificationSchedules.isActive, filter.isActive));
  }

  if (filter?.startDateFrom) {
    conditions.push(gte(notificationSchedules.startDate, filter.startDateFrom));
  }

  if (filter?.startDateTo) {
    conditions.push(lte(notificationSchedules.startDate, filter.startDateTo));
  }

  if (filter?.search) {
    conditions.push(ilike(notificationSchedules.name, `%${filter.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [schedulesResult, totalResult] = await Promise.all([
    context.db.query.notificationSchedules.findMany({
      where: whereClause,
      with: {
        createdBy: {
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
      },
      orderBy: (ns, { desc }) => [desc(ns.createdAt)],
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(notificationSchedules).where(whereClause),
  ]);

  const scheduleIds = schedulesResult.map((s) => s.id);
  const executionCounts =
    scheduleIds.length > 0
      ? await context.db
          .select({
            scheduleId: notificationScheduleExecutions.scheduleId,
            count: count(notificationScheduleExecutions.notificationId),
          })
          .from(notificationScheduleExecutions)
          .where(inArray(notificationScheduleExecutions.scheduleId, scheduleIds))
          .groupBy(notificationScheduleExecutions.scheduleId)
      : [];

  const countMap = new Map(executionCounts.map((c) => [c.scheduleId, c.count]));
  const schedules = schedulesResult.map((s) => ({
    ...s,
    _count: { notificationExecutions: countMap.get(s.id) ?? 0 },
  }));

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    schedules.map((schedule) => schedule.createdBy?.authUserId),
  );

  return {
    schedules: schedules.map((schedule) => attachCreatedByEmail(schedule, emailByAuthUserId)),
    pagination: {
      total: totalResult[0]?.count ?? 0,
      limit,
      offset,
      hasMore: offset + limit < (totalResult[0]?.count ?? 0),
    },
  };
}

export const getAll = moderatorProcedure
  .input(
    z
      .object({
        pagination: paginationSchema.optional(),
        filter: filterSchema.optional(),
      })
      .optional(),
  )
  .handler(handleGetAll);

export async function handleGetActiveSchedules({
  context,
}: {
  context: NotificationScheduleQueryContext;
}) {
  const now = new Date();

  return await context.db.query.notificationSchedules.findMany({
    where: (ns, { and, lte, gte, eq }) =>
      and(eq(ns.isActive, true), lte(ns.startDate, now), gte(ns.endDate, now)),
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: (ns, { asc }) => [asc(ns.hour), asc(ns.minute)],
  });
}

export const getActiveSchedules = moderatorProcedure.handler(handleGetActiveSchedules);

export async function handleGetUpcoming({
  input,
  context,
}: {
  input: { days?: number } | undefined;
  context: NotificationScheduleQueryContext;
}) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + (input?.days ?? 7));

  return await context.db.query.notificationSchedules.findMany({
    where: (ns, { and, lte, gte, eq }) =>
      and(eq(ns.isActive, true), lte(ns.startDate, futureDate), gte(ns.endDate, now)),
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: (ns, { asc }) => [asc(ns.startDate)],
  });
}

export const getUpcoming = moderatorProcedure
  .input(
    z
      .object({
        days: z.number().int().min(1).max(30).default(7),
      })
      .optional(),
  )
  .handler(handleGetUpcoming);

export async function handleGetById({
  input,
  context,
}: {
  input: { id: string };
  context: NotificationScheduleQueryContext;
}) {
  const schedule = await context.db.query.notificationSchedules.findFirst({
    where: (ns, { eq }) => eq(ns.id, input.id),
    with: {
      createdBy: {
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
    },
  });

  if (!schedule) {
    throw new ORPCError("NOT_FOUND", {
      message: `Notification schedule with ID ${input.id} not found`,
    });
  }

  const executionCountResult = await context.db
    .select({ count: count() })
    .from(notificationScheduleExecutions)
    .where(eq(notificationScheduleExecutions.scheduleId, input.id));

  const scheduleWithCount = {
    ...schedule,
    _count: { notificationExecutions: executionCountResult[0]?.count ?? 0 },
  };

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    scheduleWithCount.createdBy?.authUserId,
  ]);

  return attachCreatedByEmail(scheduleWithCount, emailByAuthUserId);
}

export const getById = moderatorProcedure
  .input(z.object({ id: z.string() }))
  .handler(handleGetById);

export async function handleGetExecutionHistory({
  input,
  context,
}: {
  input: { scheduleId: string; limit: number };
  context: NotificationScheduleQueryContext;
}) {
  return await context.db.query.notificationScheduleExecutions.findMany({
    where: (nse, { eq }) => eq(nse.scheduleId, input.scheduleId),
    with: {
      notification: {
        columns: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
        },
      },
    },
    orderBy: (nse, { desc }) => [desc(nse.executedAt)],
    limit: input.limit,
  });
}

export const getExecutionHistory = moderatorProcedure
  .input(
    z.object({
      scheduleId: z.string(),
      limit: z.number().int().min(1).max(100).default(20),
    }),
  )
  .handler(handleGetExecutionHistory);
