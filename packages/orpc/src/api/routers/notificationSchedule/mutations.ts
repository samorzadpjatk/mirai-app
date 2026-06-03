import { notificationScheduleExecutions, notificationSchedules } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import {
  validateDateRange,
  validateFutureDates,
  validateMinimumDuration,
  validateNotificationContent,
  validateReasonableDateRange,
  validateScheduleTime,
} from "../../../utils/notificactionSchedule-validation";
import { getDailyRankingScheduleTemplate } from "../../../utils/notificationTemplates";
import { adminProcedure } from "../../trpc";
import { notificationScheduleCreateSchema, notificationScheduleUpdateSchema } from "./types";
import {
  attachCreatedByEmail,
  getTemplateScheduleDates,
  normalizeScheduleWindow,
  toOptionalString,
} from "./utils";

export const create = adminProcedure
  .input(notificationScheduleCreateSchema)
  .handler(async ({ input, context }) => {
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
  });

export const upsertTemplate = adminProcedure
  .input(
    z.object({
      tripId: z.string(),
      templateKey: z.enum(["daily_morning", "daily_evening"]),
    }),
  )
  .handler(async ({ input, context }) => {
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

    let schedule: typeof notificationSchedules.$inferSelect | undefined;
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
          minute: template.minute,
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
  });

export const update = adminProcedure
  .input(notificationScheduleUpdateSchema)
  .handler(async ({ input, context }) => {
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
  });

export const deleteSchedule = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
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
  });

export const bulkDelete = adminProcedure
  .input(z.object({ ids: z.array(z.string()).min(1) }))
  .handler(async ({ input, context }) => {
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
  });

export const duplicate = adminProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
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
    const newEndDate = new Date(newStartDate.getTime() + durationMs);

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
  });

export const toggleActive = adminProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
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
  });

export const bulkToggleActive = adminProcedure
  .input(
    z.object({
      ids: z.array(z.string()).min(1),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ input, context }) => {
    const updated = await context.db
      .update(notificationSchedules)
      .set({ isActive: input.isActive })
      .where(inArray(notificationSchedules.id, input.ids))
      .returning();

    return {
      success: true,
      updatedCount: updated.length,
    };
  });

export const updateLastRun = adminProcedure
  .input(z.object({ id: z.string(), lastRun: z.date() }))
  .handler(async ({ input, context }) => {
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
  });
