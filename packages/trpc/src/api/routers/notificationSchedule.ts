import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";
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
} from "../../utils/notificactionSchedule-validation";
import {
  getDailyRankingScheduleTemplate,
  type ScheduledNotificationTemplate,
} from "../../utils/notificationTemplates";

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const attachCreatedByEmail = <T extends { createdBy?: { authUserId?: string | null } | null }>(
  schedule: T,
  emailByAuthUserId: Map<string, string | null>,
) => {
  const createdBy = schedule.createdBy;
  if (!createdBy) return schedule;
  const { authUserId, ...rest } = createdBy;
  return {
    ...schedule,
    createdBy: {
      ...rest,
      email: resolveAuthEmail(emailByAuthUserId, authUserId),
    },
  };
};

function getNextScheduledStartDate(
  hour: number,
  minute: number,
  now = new Date(),
): Date {
  const startDate = new Date(now);
  startDate.setHours(hour, minute, 0, 0);

  const minimumDate = new Date(now.getTime() + 5 * 60 * 1000);
  if (startDate < minimumDate) {
    startDate.setDate(startDate.getDate() + 1);
  }

  return startDate;
}

function getTemplateScheduleDates(template: ScheduledNotificationTemplate): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const startDate = getNextScheduledStartDate(template.hour, template.minute, now);
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return { startDate, endDate };
}

function normalizeScheduleWindow(params: {
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
}) {
  const normalizedStartDate = new Date(params.startDate);
  normalizedStartDate.setUTCHours(params.hour, params.minute, 0, 0);

  const durationMs = params.endDate.getTime() - params.startDate.getTime();
  const normalizedEndDate = new Date(
    normalizedStartDate.getTime() + durationMs,
  );

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hour: normalizedStartDate.getUTCHours(),
    minute: normalizedStartDate.getUTCMinutes(),
  };
}

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
        tripId?: string | null;
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

      if (filter?.tripId !== undefined) {
        where.tripId = filter.tripId;
      }

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
                firstName: true,
                lastName: true,
                authUserId: true,
              },
            },
            trip: {
              select: {
                id: true,
                name: true,
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

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        schedules.map((schedule) => schedule.createdBy?.authUserId),
      );

      return {
        schedules: schedules.map((schedule) =>
          attachCreatedByEmail(schedule, emailByAuthUserId),
        ),
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
            firstName: true,
            lastName: true,
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
              firstName: true,
              lastName: true,
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
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          trip: {
            select: {
              id: true,
              name: true,
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

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(schedule, emailByAuthUserId);
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
      const normalized = normalizeScheduleWindow({
        startDate: input.startDate,
        endDate: input.endDate,
        hour: input.hour,
        minute: input.minute,
      });

      validateNotificationContent(
        input.notificationType,
        input.notificationTitle,
        input.notificationBody,
        input.notificationUrl,
      );

      validateDateRange(normalized.startDate, normalized.endDate);

      validateFutureDates(normalized.startDate, normalized.endDate);

      validateReasonableDateRange(normalized.startDate, normalized.endDate);

      validateMinimumDuration(normalized.startDate, normalized.endDate);

      validateScheduleTime(
        normalized.startDate,
        normalized.hour,
        normalized.minute,
      );

      const schedule = await ctx.db.notificationSchedule.create({
        data: {
          name: input.name,
          tripId: input.tripId ?? null,
          notificationType: input.notificationType,
          notificationTitle: input.notificationTitle,
          notificationBody: input.notificationBody,
          notificationUrl: input.notificationUrl,
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          hour: normalized.hour,
          minute: normalized.minute,
          isActive: input.isActive,
          createdById: ctx.dbUser.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
          trip: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(schedule, emailByAuthUserId);
    }),

  upsertTemplate: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        templateKey: z.enum(["daily_morning", "daily_evening"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { id: true },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Trip with ID ${input.tripId} not found`,
        });
      }

      const template = getDailyRankingScheduleTemplate(input.templateKey);
      const { startDate, endDate } = getTemplateScheduleDates(template);
      const normalized = normalizeScheduleWindow({
        startDate,
        endDate,
        hour: template.hour,
        minute: template.minute,
      });

      validateNotificationContent(
        template.notificationType,
        template.notificationTitle,
        template.notificationBody,
        template.notificationUrl,
      );
      validateDateRange(normalized.startDate, normalized.endDate);
      validateFutureDates(normalized.startDate, normalized.endDate);
      validateReasonableDateRange(normalized.startDate, normalized.endDate);
      validateMinimumDuration(normalized.startDate, normalized.endDate);
      validateScheduleTime(
        normalized.startDate,
        normalized.hour,
        normalized.minute,
      );

      const existingSchedule = await ctx.db.notificationSchedule.findFirst({
        where: {
          tripId: input.tripId,
          name: template.name,
        },
      });

      const schedule = existingSchedule
        ? await ctx.db.notificationSchedule.update({
            where: { id: existingSchedule.id },
            data: {
              notificationType: template.notificationType,
              notificationTitle: template.notificationTitle,
              notificationBody: template.notificationBody,
              notificationUrl: template.notificationUrl,
              hour: normalized.hour,
              minute: normalized.minute,
              startDate: normalized.startDate,
              endDate: normalized.endDate,
              isActive: true,
            },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
              trip: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : await ctx.db.notificationSchedule.create({
            data: {
              tripId: input.tripId,
              name: template.name,
              notificationType: template.notificationType,
              notificationTitle: template.notificationTitle,
              notificationBody: template.notificationBody,
              notificationUrl: template.notificationUrl,
              startDate: normalized.startDate,
              endDate: normalized.endDate,
              hour: normalized.hour,
              minute: normalized.minute,
              isActive: true,
              createdById: ctx.dbUser.id,
            },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  authUserId: true,
                },
              },
              trip: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return {
        action: existingSchedule ? "updated" : "created",
        schedule: attachCreatedByEmail(schedule, emailByAuthUserId),
      };
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

      const shouldNormalize =
        updateData.startDate !== undefined ||
        updateData.endDate !== undefined ||
        updateData.hour !== undefined ||
        updateData.minute !== undefined;

      const baseStartDate =
        updateData.startDate ?? existingSchedule.startDate;
      const baseEndDate = updateData.endDate ?? existingSchedule.endDate;
      const baseHour = updateData.hour ?? existingSchedule.hour;
      const baseMinute = updateData.minute ?? existingSchedule.minute;

      const normalized = shouldNormalize
        ? normalizeScheduleWindow({
            startDate: baseStartDate,
            endDate: baseEndDate,
            hour: baseHour,
            minute: baseMinute,
          })
        : null;

      const finalStartDate = normalized?.startDate ?? baseStartDate;
      const finalEndDate = normalized?.endDate ?? baseEndDate;
      const finalHour = normalized?.hour ?? baseHour;
      const finalMinute = normalized?.minute ?? baseMinute;

      if (updateData.startDate || updateData.endDate || shouldNormalize) {
        validateDateRange(finalStartDate, finalEndDate);

        validateFutureDates(finalStartDate, finalEndDate, true);

        validateReasonableDateRange(finalStartDate, finalEndDate, true);
        validateMinimumDuration(finalStartDate, finalEndDate);
      }

      if (shouldNormalize && finalStartDate > new Date()) {
        validateScheduleTime(finalStartDate, finalHour, finalMinute);
      }

      if (
        "notificationTitle" in updateData ||
        "notificationBody" in updateData ||
        "notificationUrl" in updateData
      ) {
        const finalTitle =
          toOptionalString(updateData.notificationTitle) ??
          toOptionalString(existingSchedule.notificationTitle);

        const finalBody =
          toOptionalString(updateData.notificationBody) ??
          toOptionalString(existingSchedule.notificationBody);

        const finalUrl = toOptionalString(
          updateData.notificationUrl ?? existingSchedule.notificationUrl,
        );

        validateNotificationContent(
          existingSchedule.notificationType,
          finalTitle,
          finalBody,
          finalUrl,
        );
      }

      const schedule = await ctx.db.notificationSchedule.update({
        where: { id },
        data: shouldNormalize
          ? {
              ...updateData,
              startDate: finalStartDate,
              endDate: finalEndDate,
              hour: finalHour,
              minute: finalMinute,
            }
          : updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(schedule, emailByAuthUserId);
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

      const normalized = normalizeScheduleWindow({
        startDate: newStartDate,
        endDate: newEndDate,
        hour: originalSchedule.hour,
        minute: originalSchedule.minute,
      });

      validateDateRange(normalized.startDate, normalized.endDate);
      validateFutureDates(normalized.startDate, normalized.endDate);
      validateReasonableDateRange(normalized.startDate, normalized.endDate);
      validateMinimumDuration(normalized.startDate, normalized.endDate);
      validateScheduleTime(
        normalized.startDate,
        normalized.hour,
        normalized.minute,
      );

      const newSchedule = await ctx.db.notificationSchedule.create({
        data: {
          name: input.name ?? `${originalSchedule.name} (Copy)`,
          tripId: originalSchedule.tripId,
          notificationType: originalSchedule.notificationType,
          notificationTitle: toOptionalString(
            originalSchedule.notificationTitle,
          ),
          notificationBody: toOptionalString(originalSchedule.notificationBody),
          notificationUrl: toOptionalString(originalSchedule.notificationUrl),
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          hour: normalized.hour,
          minute: normalized.minute,
          isActive: false,
          createdById: ctx.dbUser.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        newSchedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(newSchedule, emailByAuthUserId);
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
              firstName: true,
              lastName: true,
              authUserId: true,
            },
          },
        },
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        updatedSchedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(updatedSchedule, emailByAuthUserId);
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
