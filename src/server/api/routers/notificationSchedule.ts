import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  moderatorProcedure,
} from "~/server/api/trpc";

export const notificationScheduleRouter = createTRPCRouter({
  // Get all notification schedules
  getAll: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.notificationSchedule.findMany({
      include: {
        admin: {
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
        admin: {
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
          admin: {
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
        name: z.string().min(1),
        description: z.string().optional(),
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

      const schedule = await ctx.db.notificationSchedule.create({
        data: {
          name: input.name,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          hour: input.hour,
          minute: input.minute,
          isActive: input.isActive,
          createdBy: ctx.session.user.id,
        },
        include: {
          admin: {
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

  // Update notification schedule
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
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
          admin: {
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
          admin: {
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
});
