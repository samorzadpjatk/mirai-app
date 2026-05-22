import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminProcedure } from "../../trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../../utils/authEmails";
import { eq, and, or, gte, lte, count, sum, avg } from "drizzle-orm";
import { notificationDeliveries } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { logger } from "../../../utils/logger";
import {
  getDeliveriesInputSchema,
  getDeliveryByNotificationIdInputSchema,
  getDeliveryStatsInputSchema,
  getFailedDeliveriesInputSchema,
} from "./types";

type NotificationDeliveryContext = {
  db: DB;
  supabase: SupabaseClient;
};

export async function handleGetDeliveries({
  input,
  context,
}: {
  input: z.infer<typeof getDeliveriesInputSchema>;
  context: NotificationDeliveryContext;
}) {
  try {
    const conditions = [];

    if (input?.tripId) {
      conditions.push(eq(notificationDeliveries.tripId, input.tripId));
    }

    if (input?.status) {
      conditions.push(eq(notificationDeliveries.status, input.status));
    }

    if (input?.scheduleId) {
      conditions.push(eq(notificationDeliveries.scheduleId, input.scheduleId));
    }

    if (input?.startDate) {
      conditions.push(gte(notificationDeliveries.deliveryStartedAt, input.startDate));
    }

    if (input?.endDate) {
      conditions.push(lte(notificationDeliveries.deliveryStartedAt, input.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [deliveries, totalResult] = await Promise.all([
      context.db.query.notificationDeliveries.findMany({
        where: whereClause,
        orderBy: (nd, { desc }) => [desc(nd.deliveryStartedAt)],
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
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
      }),
      context.db.select({ count: count() }).from(notificationDeliveries).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      deliveries,
      total,
      limit: input?.limit ?? 50,
      offset: input?.offset ?? 0,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(error, "Error fetching notification deliveries");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Failed to fetch notification deliveries: ${err.message}`,
      cause: err,
    });
  }
}

export const getDeliveries = adminProcedure
  .input(getDeliveriesInputSchema)
  .handler(handleGetDeliveries);

export async function handleGetDeliveryByNotificationId({
  input,
  context,
}: {
  input: z.infer<typeof getDeliveryByNotificationIdInputSchema>;
  context: NotificationDeliveryContext;
}) {
  try {
    const delivery = await context.db.query.notificationDeliveries.findFirst({
      where: (nd, { eq }) => eq(nd.notificationId, input.notificationId),
      with: {
        notification: {
          columns: {
            id: true,
            title: true,
            body: true,
            url: true,
            createdAt: true,
            tripId: true,
          },
          with: {
            createdBy: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
          },
        },
      },
    });

    if (delivery?.tripId !== input.tripId) {
      throw new ORPCError("NOT_FOUND", { message: "Notification delivery not found" });
    }

    if (!delivery?.notification?.createdBy) {
      return delivery;
    }

    const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
      delivery.notification.createdBy.authUserId,
    ]);

    const { authUserId, ...createdBy } = delivery.notification.createdBy;

    return {
      ...delivery,
      notification: {
        ...delivery.notification,
        createdBy: {
          ...createdBy,
          email: resolveAuthEmail(emailByAuthUserId, authUserId),
        },
      },
    };
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(error, "Error fetching notification delivery");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Failed to fetch notification delivery: ${err.message}`,
      cause: err,
    });
  }
}

export const getDeliveryByNotificationId = adminProcedure
  .input(getDeliveryByNotificationIdInputSchema)
  .handler(handleGetDeliveryByNotificationId);

export async function handleGetDeliveryStats({
  input,
  context,
}: {
  input: z.infer<typeof getDeliveryStatsInputSchema>;
  context: NotificationDeliveryContext;
}) {
  try {
    const conditions = [];

    if (input?.tripId) {
      conditions.push(eq(notificationDeliveries.tripId, input.tripId));
    }

    if (input?.startDate) {
      conditions.push(gte(notificationDeliveries.deliveryStartedAt, input.startDate));
    }

    if (input?.endDate) {
      conditions.push(lte(notificationDeliveries.deliveryStartedAt, input.endDate));
    }

    if (input?.scheduleId) {
      conditions.push(eq(notificationDeliveries.scheduleId, input.scheduleId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [statsResult, statusBreakdown] = await Promise.all([
      context.db
        .select({
          count: count(notificationDeliveries.id),
          totalRecipients: sum(notificationDeliveries.totalRecipients),
          successCount: sum(notificationDeliveries.successCount),
          failureCount: sum(notificationDeliveries.failureCount),
          avgSuccess: avg(notificationDeliveries.successCount),
          avgFailure: avg(notificationDeliveries.failureCount),
        })
        .from(notificationDeliveries)
        .where(whereClause),
      context.db
        .select({
          status: notificationDeliveries.status,
          count: count(notificationDeliveries.id),
        })
        .from(notificationDeliveries)
        .where(whereClause)
        .groupBy(notificationDeliveries.status),
    ]);

    const stats = statsResult[0];
    const successRate =
      stats?.totalRecipients && Number(stats.totalRecipients) > 0
        ? (Number(stats.successCount ?? 0) / Number(stats.totalRecipients)) * 100
        : 0;

    return {
      totalDeliveries: stats?.count ?? 0,
      totalRecipients: Number(stats?.totalRecipients ?? 0),
      totalSuccess: Number(stats?.successCount ?? 0),
      totalFailures: Number(stats?.failureCount ?? 0),
      avgSuccessPerDelivery: Number(stats?.avgSuccess ?? 0),
      avgFailuresPerDelivery: Number(stats?.avgFailure ?? 0),
      successRate,
      statusBreakdown: statusBreakdown.reduce(
        (acc, item) => {
          acc[item.status] = item.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(error, "Error fetching delivery stats");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Failed to fetch delivery stats: ${err.message}`,
      cause: err,
    });
  }
}

export const getDeliveryStats = adminProcedure
  .input(getDeliveryStatsInputSchema)
  .handler(handleGetDeliveryStats);

export async function handleGetFailedDeliveries({
  input,
  context,
}: {
  input: z.infer<typeof getFailedDeliveriesInputSchema>;
  context: NotificationDeliveryContext;
}) {
  try {
    const whereClause = and(
      input?.tripId ? eq(notificationDeliveries.tripId, input.tripId) : undefined,
      or(
        eq(notificationDeliveries.status, "failure"),
        eq(notificationDeliveries.status, "partial_failure"),
      ),
    );

    const [deliveries, totalResult] = await Promise.all([
      context.db.query.notificationDeliveries.findMany({
        where: whereClause,
        orderBy: (nd, { desc }) => [desc(nd.deliveryStartedAt)],
        limit: input?.limit ?? 20,
        offset: input?.offset ?? 0,
        with: {
          notification: {
            columns: {
              id: true,
              title: true,
              body: true,
              createdAt: true,
            },
            with: {
              createdBy: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      context.db.select({ count: count() }).from(notificationDeliveries).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      deliveries,
      total,
      limit: input?.limit ?? 20,
      offset: input?.offset ?? 0,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(error, "Error fetching failed deliveries");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Failed to fetch failed deliveries: ${err.message}`,
      cause: err,
    });
  }
}

export const getFailedDeliveries = adminProcedure
  .input(getFailedDeliveriesInputSchema)
  .handler(handleGetFailedDeliveries);
