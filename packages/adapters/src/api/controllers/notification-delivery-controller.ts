/**
 * Notification Delivery Controller
 *
 * tRPC-ready controller wrapping NotificationDeliveryController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { NotificationDeliveryController } from "../../controllers/notification-delivery-controller";
import { DrizzleNotificationDeliveryRepository } from "../../gateways/drizzle/DrizzleNotificationDeliveryRepository";
import { requireAdmin } from "../controller-helpers";
import {
  GetDeliveriesUseCase,
  GetDeliveryByNotificationIdUseCase,
  GetDeliveryStatsUseCase,
  GetFailedDeliveriesUseCase,
} from "@mirai-app/use-cases";

// Helper to create notification delivery controller from context
const createNotificationDeliveryController = (ctx: { db: unknown }) => {
  const deliveryRepo = new DrizzleNotificationDeliveryRepository(ctx.db);
  return new NotificationDeliveryController(
    new GetDeliveriesUseCase(deliveryRepo),
    new GetDeliveryByNotificationIdUseCase(deliveryRepo),
    new GetDeliveryStatsUseCase(deliveryRepo),
    new GetFailedDeliveriesUseCase(deliveryRepo),
  );
};

export const notificationDeliveryController = {
  getDeliveries: publicProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          status: z
            .enum(["pending", "success", "partial_failure", "failure"])
            .optional(),
          scheduleId: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveries({
        tripId: input?.tripId,
        status: input?.status,
        scheduleId: input?.scheduleId,
        startDate: input?.startDate,
        endDate: input?.endDate,
        limit: input?.limit,
        offset: input?.offset,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getDeliveryByNotificationId: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        tripId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveryByNotificationId({
        notificationId: input.notificationId,
        tripId: input.tripId,
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

  getDeliveryStats: publicProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          scheduleId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveryStats({
        tripId: input?.tripId,
        startDate: input?.startDate,
        endDate: input?.endDate,
        scheduleId: input?.scheduleId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getFailedDeliveries: publicProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getFailedDeliveries({
        tripId: input?.tripId,
        limit: input?.limit,
        offset: input?.offset,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
