import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { adminProcedure, createORPCRouter } from "../trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";

export const notificationDeliveryRouter = createORPCRouter({
  getDeliveries: adminProcedure
    .input(
      z
        .object({
          tripId: z.string(),
          status: z
            .enum(["pending", "success", "partial_failure", "failure"])
            .optional(),
          scheduleId: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      try {
        const filters: {
          tripId?: string;
          status?: string;
          scheduleId?: string;
          deliveryStartedAt?: {
            gte?: Date;
            lte?: Date;
          };
        } = { tripId: input?.tripId };

        if (input?.status) {
          filters.status = input.status;
        }

        if (input?.scheduleId) {
          filters.scheduleId = input.scheduleId;
        }

        if (input?.startDate || input?.endDate) {
          filters.deliveryStartedAt = {};
          if (input.startDate) {
            filters.deliveryStartedAt.gte = input.startDate;
          }
          if (input.endDate) {
            filters.deliveryStartedAt.lte = input.endDate;
          }
        }

        const [deliveries, total] = await Promise.all([
          context.db.notificationDelivery.findMany({
            where: filters,
            orderBy: {
              deliveryStartedAt: "desc",
            },
            take: input?.limit ?? 50,
            skip: input?.offset ?? 0,
            include: {
              notification: {
                select: {
                  id: true,
                  title: true,
                  body: true,
                  createdAt: true,
                },
              },
            },
          }),
          context.db.notificationDelivery.count({
            where: filters,
          }),
        ]);

        return {
          deliveries,
          total,
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error fetching notification deliveries:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `Failed to fetch notification deliveries: ${err.message}`, cause: err });
      }
    }),

  getDeliveryByNotificationId: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const delivery = await context.db.notificationDelivery.findUnique({
          where: {
            notificationId: input.notificationId,
          },
          include: {
            notification: {
              select: {
                id: true,
                title: true,
                body: true,
                url: true,
                createdAt: true,
                tripId: true,
                createdBy: {
                  select: {
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
        console.error("Error fetching notification delivery:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `Failed to fetch notification delivery: ${err.message}`, cause: err });
      }
    }),

  getDeliveryStats: adminProcedure
    .input(
      z
        .object({
          tripId: z.string(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          scheduleId: z.string().optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      try {
        const filters: {
          tripId?: string;
          deliveryStartedAt?: {
            gte?: Date;
            lte?: Date;
          };
          scheduleId?: string;
        } = { tripId: input?.tripId };

        if (input?.startDate || input?.endDate) {
          filters.deliveryStartedAt = {};
          if (input.startDate) {
            filters.deliveryStartedAt.gte = input.startDate;
          }
          if (input.endDate) {
            filters.deliveryStartedAt.lte = input.endDate;
          }
        }

        if (input?.scheduleId) {
          filters.scheduleId = input.scheduleId;
        }

        const [stats, statusBreakdown] = await Promise.all([
          context.db.notificationDelivery.aggregate({
            where: filters,
            _count: {
              id: true,
            },
            _sum: {
              totalRecipients: true,
              successCount: true,
              failureCount: true,
            },
            _avg: {
              successCount: true,
              failureCount: true,
            },
          }),
          context.db.notificationDelivery.groupBy({
            by: ["status"],
            where: filters,
            _count: {
              id: true,
            },
          }),
        ]);

        const successRate =
          stats._sum.totalRecipients && stats._sum.totalRecipients > 0
            ? ((stats._sum.successCount ?? 0) / stats._sum.totalRecipients) *
              100
            : 0;

        return {
          totalDeliveries: stats._count.id,
          totalRecipients: stats._sum.totalRecipients ?? 0,
          totalSuccess: stats._sum.successCount ?? 0,
          totalFailures: stats._sum.failureCount ?? 0,
          avgSuccessPerDelivery: stats._avg.successCount ?? 0,
          avgFailuresPerDelivery: stats._avg.failureCount ?? 0,
          successRate,
          statusBreakdown: statusBreakdown.reduce(
            (acc, item) => {
              acc[item.status] = item._count.id;
              return acc;
            },
            {} as Record<string, number>,
          ),
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error fetching delivery stats:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `Failed to fetch delivery stats: ${err.message}`, cause: err });
      }
    }),

  getFailedDeliveries: adminProcedure
    .input(
      z
        .object({
          tripId: z.string(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      try {
        const [deliveries, total] = await Promise.all([
          context.db.notificationDelivery.findMany({
            where: {
              tripId: input?.tripId,
              OR: [{ status: "failure" }, { status: "partial_failure" }],
            },
            orderBy: {
              deliveryStartedAt: "desc",
            },
            take: input?.limit ?? 20,
            skip: input?.offset ?? 0,
            include: {
              notification: {
                select: {
                  id: true,
                  title: true,
                  body: true,
                  createdAt: true,
                  createdBy: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          }),
          context.db.notificationDelivery.count({
            where: {
              tripId: input?.tripId,
              OR: [{ status: "failure" }, { status: "partial_failure" }],
            },
          }),
        ]);

        return {
          deliveries,
          total,
          limit: input?.limit ?? 20,
          offset: input?.offset ?? 0,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error fetching failed deliveries:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `Failed to fetch failed deliveries: ${err.message}`, cause: err });
      }
    }),
});
