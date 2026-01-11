import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import {
  validateDateRange,
  validateFutureDates,
  validateScheduleTime,
  validateMinimumDuration,
  validateNotificationContent,
  validateReasonableDateRange,
  notificationScheduleCreateSchema,
  notificationScheduleUpdateSchema,
  paginationSchema,
  filterSchema,
} from "./notificationSchedule/validation";

export const notificationScheduleRouter = createTRPCRouter({
  getAll: moderatorProcedure
    .input(
      z
        .object({
          pagination: paginationSchema.optional(),
          filter: filterSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { pagination, filter } = input ?? {};
      const limit = pagination?.limit ?? 50;
      const offset = pagination?.offset ?? 0;

      interface WhereClause {
        notificationType?: string;
        isActive?: boolean;
        startDate?: {
          gte?: Date;
          lte?: Date;
        };
        name?: {
          contains: string;
          mode: "insensitive";
        };
      }

      const where: WhereClause = {};

      if (filter?.notificationType) {
        where.notificationType = filter.notificationType;
      }

      if (filter?.isActive !== undefined) {
        where.isActive = filter.isActive;
      }

      if (filter?.startDateFrom || filter?.startDateTo) {
        where.startDate = {};
        if (filter.startDateFrom) {
          where.startDate.gte = filter.startDateFrom;
        }
        if (filter.startDateTo) {
          where.startDate.lte = filter.startDateTo;
        }
      }

      if (filter?.search) {
        where.name = {
          contains: filter.search,
          mode: "insensitive" as const,
        };
      }

      const [schedules, total] = await Promise.all([
        ctx.db.notificationSchedule.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                notificationExecutions: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        ctx.db.notificationSchedule.count({ where }),
      ]);

      return {
        schedules,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

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
      orderBy: [{ hour: "asc" }, { minute: "asc" }],
    });
  }),

  getUpcoming: moderatorProcedure
    .input(
      z
        .object({
          days: z.number().int().min(1).max(30).default(7),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + (input?.days ?? 7));

      return await ctx.db.notificationSchedule.findMany({
        where: {
          isActive: true,
          startDate: { lte: futureDate },
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
        orderBy: { startDate: "asc" },
      });
    }),

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
          _count: {
            select: {
              notificationExecutions: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      return schedule;
    }),

  getExecutionHistory: moderatorProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.notificationScheduleExecution.findMany({
        where: { scheduleId: input.scheduleId },
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
        orderBy: { executedAt: "desc" },
        take: input.limit,
      });
    }),

  create: adminProcedure
    .input(notificationScheduleCreateSchema)
    .mutation(async ({ ctx, input }) => {
      validateNotificationContent(
        input.notificationType,
        input.notificationTitle,
        input.notificationBody,
        input.notificationUrl,
      );

      validateDateRange(input.startDate, input.endDate);

      validateFutureDates(input.startDate, input.endDate);

      validateReasonableDateRange(input.startDate, input.endDate);

      validateMinimumDuration(input.startDate, input.endDate);

      validateScheduleTime(input.startDate, input.hour, input.minute);

      const schedule = await ctx.db.notificationSchedule.create({
        data: {
          name: input.name,
          notificationType: input.notificationType,
          notificationTitle: input.notificationTitle,
          notificationBody: input.notificationBody,
          notificationUrl: input.notificationUrl,
          startDate: input.startDate,
          endDate: input.endDate,
          hour: input.hour,
          minute: input.minute,
          isActive: input.isActive,
          createdById: ctx.dbUser.id,
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

      return schedule;
    }),

  update: adminProcedure
    .input(notificationScheduleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existingSchedule = await ctx.db.notificationSchedule.findUnique({
        where: { id },
      });

      if (!existingSchedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${id} not found`,
        });
      }

      const finalStartDate = updateData.startDate ?? existingSchedule.startDate;
      const finalEndDate = updateData.endDate ?? existingSchedule.endDate;

      if (updateData.startDate || updateData.endDate) {
        validateDateRange(finalStartDate, finalEndDate);

        validateFutureDates(finalStartDate, finalEndDate, true);

        validateReasonableDateRange(finalStartDate, finalEndDate, true);
        validateMinimumDuration(finalStartDate, finalEndDate);
      }

      if (
        updateData.startDate ||
        updateData.hour !== undefined ||
        updateData.minute !== undefined
      ) {
        const finalHour = updateData.hour ?? existingSchedule.hour;
        const finalMinute = updateData.minute ?? existingSchedule.minute;

        if (finalStartDate > new Date()) {
          validateScheduleTime(finalStartDate, finalHour, finalMinute);
        }
      }

      if (
        "notificationTitle" in updateData ||
        "notificationBody" in updateData ||
        "notificationUrl" in updateData
      ) {
        const finalUrl =
          updateData.notificationUrl ??
          existingSchedule.notificationUrl ??
          undefined;

        validateNotificationContent(
          existingSchedule.notificationType,
          updateData.notificationTitle ??
            existingSchedule.notificationTitle ??
            undefined,
          updateData.notificationBody ??
            existingSchedule.notificationBody ??
            undefined,
          finalUrl,
        );
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

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              notificationExecutions: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      await ctx.db.notificationSchedule.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: `Schedule "${schedule.name}" deleted successfully. ${schedule._count.notificationExecutions} execution records were also removed.`,
      };
    }),

  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existingSchedules = await ctx.db.notificationSchedule.findMany({
        where: { id: { in: input.ids } },
        select: { id: true },
      });

      const existingIds = existingSchedules.map((s) => s.id);
      const notFoundIds = input.ids.filter((id) => !existingIds.includes(id));

      const result = await ctx.db.notificationSchedule.deleteMany({
        where: { id: { in: existingIds } },
      });

      return {
        success: true,
        deletedCount: result.count,
        requestedCount: input.ids.length,
        notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      };
    }),

  duplicate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const originalSchedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
      });

      if (!originalSchedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      const newStartDate = input.startDate ?? new Date();
      const durationMs =
        originalSchedule.endDate.getTime() -
        originalSchedule.startDate.getTime();
      const newEndDate =
        input.endDate ?? new Date(newStartDate.getTime() + durationMs);

      validateDateRange(newStartDate, newEndDate);
      validateFutureDates(newStartDate, newEndDate);
      validateReasonableDateRange(newStartDate, newEndDate);
      validateMinimumDuration(newStartDate, newEndDate);
      validateScheduleTime(
        newStartDate,
        originalSchedule.hour,
        originalSchedule.minute,
      );

      const newSchedule = await ctx.db.notificationSchedule.create({
        data: {
          name: input.name ?? `${originalSchedule.name} (Copy)`,
          notificationType: originalSchedule.notificationType,
          notificationTitle: originalSchedule.notificationTitle,
          notificationBody: originalSchedule.notificationBody,
          notificationUrl: originalSchedule.notificationUrl ?? undefined,
          startDate: newStartDate,
          endDate: newEndDate,
          hour: originalSchedule.hour,
          minute: originalSchedule.minute,
          isActive: false,
          createdById: ctx.dbUser.id,
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

      return newSchedule;
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${input.id} not found`,
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

  bulkToggleActive: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.notificationSchedule.updateMany({
        where: { id: { in: input.ids } },
        data: { isActive: input.isActive },
      });

      return {
        success: true,
        updatedCount: result.count,
      };
    }),

  updateLastRun: adminProcedure
    .input(z.object({ id: z.string(), lastRun: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.db.notificationSchedule.findUnique({
        where: { id: input.id },
      });

      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      return await ctx.db.notificationSchedule.update({
        where: { id: input.id },
        data: { lastRun: input.lastRun },
      });
    }),
});
