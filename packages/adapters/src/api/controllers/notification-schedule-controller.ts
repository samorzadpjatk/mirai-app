/**
 * Notification Schedule Controller
 *
 * tRPC-ready controller wrapping NotificationScheduleController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { NotificationScheduleController } from "../../controllers/notification-schedule-controller";
import { PrismaNotificationScheduleRepository } from "../../gateways/PrismaNotificationScheduleRepository";
import { requireAdmin, requireModerator } from "../controller-helpers";

export const notificationScheduleController = {
  getAll: publicProcedure
    .input(
      z.object({
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .optional(),
        filter: z
          .object({
            tripId: z.string().nullable().optional(),
            notificationType: z
              .enum([
                "CHALLENGE",
                "INFO",
                "REMINDER",
                "ANNOUNCEMENT",
                "DAILY_RANKING",
              ])
              .optional(),
            isActive: z.boolean().optional(),
            startDateFrom: z.coerce.date().optional(),
            startDateTo: z.coerce.date().optional(),
            search: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getAll({
        pagination: input.pagination,
        filter: input.filter,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        tripId: z.string().uuid().nullable().optional(),
        notificationType: z.enum([
          "CHALLENGE",
          "INFO",
          "REMINDER",
          "ANNOUNCEMENT",
          "DAILY_RANKING",
        ]),
        notificationTitle: z.string().max(200).nullable().optional(),
        notificationBody: z.string().max(2000).nullable().optional(),
        notificationUrl: z.string().url().max(500).nullable().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.create(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        notificationTitle: z.string().max(200).nullable().optional(),
        notificationBody: z.string().max(2000).nullable().optional(),
        notificationUrl: z.string().url().max(500).nullable().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        hour: z.number().int().min(0).max(23).optional(),
        minute: z.number().int().min(0).max(59).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.update(input);

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.delete({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  toggleActive: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.toggleActive({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  duplicate: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.duplicate({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  bulkToggleActive: publicProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.bulkToggleActive({ ids: input.ids });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  bulkDelete: publicProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.bulkDelete({ ids: input.ids });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getActive: publicProcedure
    .input(
      z.object({
        tripId: z.string().optional(),
        notificationType: z
          .enum([
            "CHALLENGE",
            "INFO",
            "REMINDER",
            "ANNOUNCEMENT",
            "DAILY_RANKING",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getActive({
        tripId: input.tripId,
        notificationType: input.notificationType,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getUpcoming: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        withinMinutes: z.number().int().min(1).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getUpcoming({
        limit: input.limit,
        withinMinutes: input.withinMinutes,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  updateLastRun: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        lastRunAt: z.coerce.date(),
        lastRunStatus: z.enum(["SUCCESS", "FAILURE", "PARTIAL"]),
        lastRunError: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.updateLastRun(input);

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getExecutionHistory: publicProcedure
    .input(
      z.object({
        scheduleId: z.string().uuid(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getExecutionHistory({
        scheduleId: input.scheduleId,
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
