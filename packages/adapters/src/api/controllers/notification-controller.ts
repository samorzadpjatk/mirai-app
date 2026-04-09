/**
 * Notification Controller
 *
 * tRPC-ready controller wrapping NotificationController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { NotificationController } from "../../controllers/notification-controller";
import { PrismaNotificationRepository } from "../../gateways/PrismaNotificationRepository";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../controller-helpers";

export const notificationController = {
  getAllMy: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require authentication
      await requireAuth(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.list({
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(result.data.length / input.pageSize),
        },
      };
    }),

  getAll: publicProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);

      if (input?.tripId) {
        const result = await controller.getByTripId({ tripId: input.tripId });
        if (!result.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        return {
          notifications: result.data,
          pagination: {
            total: result.data.length,
            limit: input?.pagination?.limit ?? 50,
            offset: input?.pagination?.offset ?? 0,
            hasMore: false,
          },
        };
      }

      const result = await controller.list({
        limit: input?.pagination?.limit ?? 50,
        offset: input?.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          limit: input?.pagination?.limit ?? 50,
          offset: input?.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        url: z.string().optional(),
        tripId: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.create({
        ...input,
        createdById: authContext.userId,
        scheduledFor: null,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  update: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        title: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        url: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.update({
        notificationId: input.notificationId,
        title: input.title,
        body: input.body,
        url: input.url,
        priority: input.priority,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        newStatus: z.enum(["DRAFT", "READY", "SENT", "FAILED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.updateStatus({
        notificationId: input.notificationId,
        newStatus: input.newStatus,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.delete({ id: input.notificationId });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return { success: true };
    }),
};
