import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  moderatorProcedure,
  serviceAccountProcedure,
} from "~/server/api/trpc";
import { send, sendRanking } from "../utils/webPush";
import { NotificationService } from "~/server/services/notificationService";

export const notificationScheduleRouter = createTRPCRouter({
  // Get all notification schedules
  getAll: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.notificationSchedule.findMany({
      include: {
        notification: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get active schedules that should run
  getActiveSchedules: moderatorProcedure.query(async ({ ctx }) => {
    const now = new Date();

    return await ctx.db.notificationSchedule.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }),

  // Get schedule by ID
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification schedule not found",
        });
      }

      return schedule;
    }),

  // Create new notification schedule
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        notificationType: z.enum(["custom", "ranking"]),
        notificationTitle: z.string().optional(),
        notificationBody: z.string().optional(),
        notificationUrl: z.url().optional(),
        startDate: z.date(),
        endDate: z.date(),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59).default(0),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate that end date is after start date
      if (input.endDate <= input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }
      let schedule;
      switch (input.notificationType) {
        case "custom":
          if (
            !input.notificationTitle ||
            !input.notificationBody ||
            !input.notificationUrl
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Title, body, and URL are required for custom notifications",
            });
          }
          const notification = await ctx.db.notification.create({
            data: {
              title: input.notificationTitle,
              body: input.notificationBody,
              url: input.notificationUrl,
              createdById: ctx.session.user.id,
            },
          });

          if (!notification) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create notification",
            });
          }
          schedule = await ctx.db.notificationSchedule.create({
            data: {
              name: input.name,
              notificationType: input.notificationType,
              notificationId: notification?.id,
              startDate: input.startDate,
              endDate: input.endDate,
              hour: input.hour,
              minute: input.minute,
              isActive: input.isActive,
              createdById: ctx.session.user.id,
            },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          break;

        case "ranking":
          // Ranking notification logic
          schedule = await ctx.db.notificationSchedule.create({
            data: {
              name: input.name,
              notificationType: input.notificationType,
              startDate: input.startDate,
              endDate: input.endDate,
              hour: input.hour,
              minute: input.minute,
              isActive: input.isActive,
              createdById: ctx.session.user.id,
            },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
          break;
      }
      return schedule;
    }),

  // Update notification schedule
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        notificationId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        hour: z.number().int().min(0).max(23).optional(),
        minute: z.number().int().min(0).max(59).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // If both dates are provided, validate that end date is after start date
      if (updateData.startDate && updateData.endDate) {
        if (updateData.endDate <= updateData.startDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "End date must be after start date",
          });
        }
      }

      const schedule = await ctx.db.notificationSchedule.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return schedule;
    }),

  // Delete notification schedule
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification schedule not found",
        });
      }

      await ctx.db.notificationSchedule.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Toggle active status
  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification schedule not found",
        });
      }

      const updatedSchedule = await ctx.db.notificationSchedule.update({
        where: { id: input.id },
        data: { isActive: !schedule.isActive },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedSchedule;
    }),

  // Update last run timestamp (used by scheduler)
  updateLastRun: adminProcedure
    .input(z.object({ id: z.string(), lastRun: z.date() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.notificationSchedule.update({
        where: { id: input.id },
        data: { lastRun: input.lastRun },
      });
    }),

  sendScheduledNotifications: serviceAccountProcedure.mutation(
    async ({ ctx }) => {
      const now = new Date();
      const activeSchedules = await ctx.db.notificationSchedule.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          hour: now.getHours(),
          minute: now.getMinutes(),
        },
        include: {
          notification: {
            include: {
              pushes: { include: { targetUser: { select: { id: true } } } },
            },
          },
        },
      });
      const results = await Promise.all(
        activeSchedules.map(async (schedule) => {
          try {
            await ctx.db.notificationSchedule.update({
              where: { id: schedule.id },
              data: { lastRun: now },
            });
            switch (schedule.notificationType) {
              case "ranking":
                return await sendRanking({
                  db: ctx.db,
                  userId: ctx.session.user.id,
                });
              case "custom":
                if (!schedule.notification) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Notification not found",
                  });
                }
                const payload = {
                  userIds: schedule.notification.pushes.map(
                    (p) => p.targetUser.id,
                  ),
                  title: schedule.notification.title,
                  body: schedule.notification.body,
                  url: schedule.notification.url,
                };
                return await send({
                  db: ctx.db,
                  userId: ctx.session.user.id,
                  input: payload,
                });
            }
          } catch (error) {
            console.error("Error sending scheduled notification:", error);
          }
        }),
      );
      return {
        success: results.every((r) => r !== undefined),
        sent: results.reduce((acc, r) => acc + (r?.sent ?? 0), 0),
        failed: results.reduce((acc, r) => acc + (r?.failed ?? 0), 0),
        total: results.reduce((acc, r) => acc + (r?.total ?? 0), 0),
      };
    },
  ),
});
