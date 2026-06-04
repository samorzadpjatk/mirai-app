import { notificationPushes, notifications } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { buildPaginationBounds, mapSubscriptionStatus } from "@mirai-app/shared/notifications";
import { ORPCError } from "@orpc/server";
import { count, eq } from "drizzle-orm";

export type NotificationContext = {
  db: DB;
  dbUser: { id: string };
};

export const getSubscriptionStatus = async (context: NotificationContext) => {
  const subscriptions = await context.db.query.pushSubscriptions.findMany({
    where: (ps, { eq }) => eq(ps.userId, context.dbUser.id),
  });

  return mapSubscriptionStatus(subscriptions);
};

export const getAllMy = async (
  context: NotificationContext,
  input: { page: number; pageSize: number },
) => {
  const pushRows = await context.db
    .select({ notificationId: notificationPushes.notificationId })
    .from(notificationPushes)
    .where(eq(notificationPushes.targetUserId, context.dbUser.id));
  const notificationIds = pushRows.map((p) => p.notificationId);
  const count = notificationIds.length;
  const { totalPages } = buildPaginationBounds(count, input.pageSize);
  if (input.page > totalPages && totalPages > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Page ${input.page} exceeds total pages ${totalPages}`,
    });
  }
  const notificationList =
    notificationIds.length > 0
      ? await context.db.query.notifications.findMany({
          where: (n, { inArray }) => inArray(n.id, notificationIds),
          with: {
            createdBy: {
              columns: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: (n, { desc }) => desc(n.createdAt),
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
        })
      : [];
  return {
    notifications: notificationList,
    pagination: {
      total: count,
      page: input.page,
      pageSize: input.pageSize,
      totalPages,
    },
  };
};

export const getAll = async (
  context: NotificationContext,
  input?: {
    tripId?: string;
    pagination?: {
      limit: number;
      offset: number;
    };
  },
) => {
  const where = input?.tripId ? eq(notifications.tripId, input.tripId) : undefined;
  const limit = input?.pagination?.limit ?? 50;
  const offset = input?.pagination?.offset ?? 0;

  const [notificationList, totalResult] = await Promise.all([
    context.db.query.notifications.findMany({
      where,
      orderBy: (n, { desc }) => desc(n.createdAt),
      with: {
        createdBy: {
          columns: { id: true, firstName: true, lastName: true },
        },
        pushes: {
          columns: {
            targetUserId: true,
            sentAt: true,
            status: true,
            failureReason: true,
          },
        },
      },
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(notifications).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    notifications: notificationList,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
};
