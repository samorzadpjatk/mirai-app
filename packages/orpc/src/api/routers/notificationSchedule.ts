import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, adminProcedure, moderatorProcedure } from "../../api/trpc";
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
import { eq, and, gte, lte, ilike, count, inArray } from "drizzle-orm";
import { notificationSchedules, notificationScheduleExecutions } from "@mirai-app/db";

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

function getNextScheduledStartDate(hour: number, minute: number, now = new Date()): Date {
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
  const normalizedEndDate = new Date(normalizedStartDate.getTime() + durationMs);

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hour: normalizedStartDate.getUTCHours(),
    minute: normalizedStartDate.getUTCMinutes(),
  };
}

export const notificationScheduleRouter = createORPCRouter({
  getAll: moderatorProcedure
    .input(
      z
        .object({
          pagination: paginationSchema.optional(),
          filter: filterSchema.optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
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
    }),

  getActiveSchedules: moderatorProcedure.handler(async ({ context }) => {
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
  }),

  getUpcoming: moderatorProcedure
    .input(
      z
        .object({
          days: z.number().int().min(1).max(30).default(7),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
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
    }),

  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
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
    }),

  getExecutionHistory: moderatorProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ context, input }) => {
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
    }),

  create: adminProcedure
    .input(notificationScheduleCreateSchema)
    .handler(async ({ context, input }) => {
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

      validateScheduleTime(normalized.startDate, normalized.hour, normalized.minute);

      const [scheduleRow] = await context.db
        .insert(notificationSchedules)
        .values({
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
          createdById: context.dbUser.id,
        })
        .returning();

      if (!scheduleRow) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create schedule" });
      }

      const schedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, scheduleRow.id),
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch schedule" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
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
    .handler(async ({ context, input }) => {
      const trip = await context.db.query.trips.findFirst({
        where: (t, { eq }) => eq(t.id, input.tripId),
        columns: { id: true },
      });

      if (!trip) {
        throw new ORPCError("NOT_FOUND", { message: `Trip with ID ${input.tripId} not found` });
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
      validateScheduleTime(normalized.startDate, normalized.hour, normalized.minute);

      const existingSchedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { and, eq }) => and(eq(ns.tripId, input.tripId), eq(ns.name, template.name)),
      });

      let schedule;
      if (existingSchedule) {
        await context.db
          .update(notificationSchedules)
          .set({
            notificationType: template.notificationType,
            notificationTitle: template.notificationTitle,
            notificationBody: template.notificationBody,
            notificationUrl: template.notificationUrl,
            hour: normalized.hour,
            minute: normalized.minute,
            startDate: normalized.startDate,
            endDate: normalized.endDate,
            isActive: true,
          })
          .where(eq(notificationSchedules.id, existingSchedule.id));

        schedule = await context.db.query.notificationSchedules.findFirst({
          where: (ns, { eq }) => eq(ns.id, existingSchedule.id),
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
      } else {
        const [scheduleRow] = await context.db
          .insert(notificationSchedules)
          .values({
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
            createdById: context.dbUser.id,
          })
          .returning();

        if (!scheduleRow) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create schedule" });
        }

        schedule = await context.db.query.notificationSchedules.findFirst({
          where: (ns, { eq }) => eq(ns.id, scheduleRow.id),
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
      }

      if (!schedule) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch schedule" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return {
        action: existingSchedule ? "updated" : "created",
        schedule: attachCreatedByEmail(schedule, emailByAuthUserId),
      };
    }),

  update: adminProcedure
    .input(notificationScheduleUpdateSchema)
    .handler(async ({ context, input }) => {
      const { id, ...updateData } = input;

      const existingSchedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, id),
      });

      if (!existingSchedule) {
        throw new ORPCError("NOT_FOUND", {
          message: `Notification schedule with ID ${id} not found`,
        });
      }

      const shouldNormalize =
        updateData.startDate !== undefined ||
        updateData.endDate !== undefined ||
        updateData.hour !== undefined ||
        updateData.minute !== undefined;

      const baseStartDate = updateData.startDate ?? existingSchedule.startDate;
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

      await context.db
        .update(notificationSchedules)
        .set(
          shouldNormalize
            ? {
                ...updateData,
                startDate: finalStartDate,
                endDate: finalEndDate,
                hour: finalHour,
                minute: finalMinute,
              }
            : updateData,
        )
        .where(eq(notificationSchedules.id, id));

      const schedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, id),
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
      });

      if (!schedule) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch schedule" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        schedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(schedule, emailByAuthUserId);
    }),

  delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ context, input }) => {
    const schedule = await context.db.query.notificationSchedules.findFirst({
      where: (ns, { eq }) => eq(ns.id, input.id),
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

    await context.db.delete(notificationSchedules).where(eq(notificationSchedules.id, input.id));

    return {
      success: true,
      message: `Schedule "${schedule.name}" deleted successfully. ${executionCountResult[0]?.count ?? 0} execution records were also removed.`,
    };
  }),

  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .handler(async ({ context, input }) => {
      const existingSchedules = await context.db.query.notificationSchedules.findMany({
        where: (ns, { inArray }) => inArray(ns.id, input.ids),
        columns: { id: true },
      });

      const existingIds = existingSchedules.map((s) => s.id);
      const notFoundIds = input.ids.filter((id) => !existingIds.includes(id));

      const deleted = await context.db
        .delete(notificationSchedules)
        .where(inArray(notificationSchedules.id, existingIds))
        .returning();

      return {
        success: true,
        deletedCount: deleted.length,
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
    .handler(async ({ context, input }) => {
      const originalSchedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, input.id),
      });

      if (!originalSchedule) {
        throw new ORPCError("NOT_FOUND", {
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      const newStartDate = input.startDate ?? new Date();
      const durationMs = originalSchedule.endDate.getTime() - originalSchedule.startDate.getTime();
      const newEndDate = input.endDate ?? new Date(newStartDate.getTime() + durationMs);

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
      validateScheduleTime(normalized.startDate, normalized.hour, normalized.minute);

      const [newScheduleRow] = await context.db
        .insert(notificationSchedules)
        .values({
          name: input.name ?? `${originalSchedule.name} (Copy)`,
          tripId: originalSchedule.tripId,
          notificationType: originalSchedule.notificationType,
          notificationTitle: toOptionalString(originalSchedule.notificationTitle),
          notificationBody: toOptionalString(originalSchedule.notificationBody),
          notificationUrl: toOptionalString(originalSchedule.notificationUrl),
          startDate: normalized.startDate,
          endDate: normalized.endDate,
          hour: normalized.hour,
          minute: normalized.minute,
          isActive: false,
          createdById: context.dbUser.id,
        })
        .returning();

      if (!newScheduleRow) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create schedule" });
      }

      const newSchedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, newScheduleRow.id),
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
      });

      if (!newSchedule) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch schedule" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
        newSchedule.createdBy?.authUserId,
      ]);

      return attachCreatedByEmail(newSchedule, emailByAuthUserId);
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const schedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, input.id),
      });

      if (!schedule) {
        throw new ORPCError("NOT_FOUND", {
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      await context.db
        .update(notificationSchedules)
        .set({ isActive: !schedule.isActive })
        .where(eq(notificationSchedules.id, input.id));

      const updatedSchedule = await context.db.query.notificationSchedules.findFirst({
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
        },
      });

      if (!updatedSchedule) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to fetch schedule" });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
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
    .handler(async ({ context, input }) => {
      const updated = await context.db
        .update(notificationSchedules)
        .set({ isActive: input.isActive })
        .where(inArray(notificationSchedules.id, input.ids))
        .returning();

      return {
        success: true,
        updatedCount: updated.length,
      };
    }),

  updateLastRun: adminProcedure
    .input(z.object({ id: z.string(), lastRun: z.date() }))
    .handler(async ({ context, input }) => {
      const schedule = await context.db.query.notificationSchedules.findFirst({
        where: (ns, { eq }) => eq(ns.id, input.id),
      });

      if (!schedule) {
        throw new ORPCError("NOT_FOUND", {
          message: `Notification schedule with ID ${input.id} not found`,
        });
      }

      const [updated] = await context.db
        .update(notificationSchedules)
        .set({ lastRun: input.lastRun })
        .where(eq(notificationSchedules.id, input.id))
        .returning();

      return updated;
    }),
});
