import { z } from "zod";
import { Effect } from "effect";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
} from "@mirai-app/use-cases";
import {
  getDeliveriesUseCase,
  getDeliveryByNotificationIdUseCase,
  getDeliveryStatsUseCase,
  getFailedDeliveriesUseCase,
  NotificationDeliveryRepositoryTag,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
  type GetDeliveryByNotificationIdInput,
  type GetDeliveryByNotificationIdOutput,
  type GetDeliveryStatsInput,
  type GetDeliveryStatsOutput,
  type GetFailedDeliveriesInput,
  type GetFailedDeliveriesOutput,
} from "@mirai-app/use-cases";
import { effectToControllerResult } from "../utils/controller-helpers";

/**
 * Input validation schemas for notification delivery controller
 */
const schemas = {
  getDeliveries: z
    .object({
      tripId: z.string().uuid(),
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

  getDeliveryByNotificationId: z.object({
    notificationId: z.string().uuid(),
    tripId: z.string().uuid(),
  }),

  getDeliveryStats: z
    .object({
      tripId: z.string().uuid(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      scheduleId: z.string().optional(),
    })
    .optional(),

  getFailedDeliveries: z
    .object({
      tripId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
    .optional(),
};

/**
 * NotificationDeliveryController
 *
 * Handles notification delivery queries and statistics.
 * Delegates to use cases for business logic.
 */
export class NotificationDeliveryController {
  constructor(private repository: NotificationDeliveryRepository) {}

  /**
   * Get deliveries with filters
   */
  async getDeliveries(input: {
    tripId?: string;
    status?: "pending" | "success" | "partial_failure" | "failure";
    scheduleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<
    | {
        success: true;
        data: {
          deliveries: Array<{
            id: string;
            notificationId: string;
            tripId: string;
            status: string;
            totalRecipients: number;
            successCount: number;
            failureCount: number;
            deliveryStartedAt: Date;
            deliveryCompletedAt?: Date | null;
            errorLog?: string | null;
            scheduleId?: string | null;
            notification?: {
              id: string;
              title: string;
              body: string;
              createdAt: Date;
            } | null;
          }>;
          total: number;
          limit: number;
          offset: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getDeliveries.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const inputFilters: GetDeliveriesInput["filters"] = {
      tripId: parsed.data.tripId,
      status: parsed.data.status,
      scheduleId: parsed.data.scheduleId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    };

    const inputPagination: GetDeliveriesInput["pagination"] = {
      limit: parsed.data.limit ?? 50,
      offset: parsed.data.offset ?? 0,
    };

    const effect = getDeliveriesUseCase({
      filters: inputFilters,
      pagination: inputPagination,
    }).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, this.repository),
    );

    return await effectToControllerResult(
      effect,
      (result: GetDeliveriesOutput) => ({
        deliveries: result.deliveries.map((d: NotificationDelivery) => ({
          id: d.id,
          notificationId: d.notificationId,
          tripId: d.tripId,
          status: d.status,
          totalRecipients: d.totalRecipients,
          successCount: d.successCount,
          failureCount: d.failureCount,
          deliveryStartedAt: d.deliveryStartedAt,
          deliveryCompletedAt: d.deliveryCompletedAt,
          errorLog: d.errorLog,
          scheduleId: d.scheduleId,
          notification: d.notification
            ? {
                id: d.notification.id,
                title: d.notification.title,
                body: d.notification.body,
                createdAt: d.notification.createdAt,
              }
            : null,
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }),
    );
  }

  /**
   * Get delivery by notification ID
   */
  async getDeliveryByNotificationId(input: {
    notificationId: string;
    tripId: string;
  }): Promise<
    | {
        success: true;
        data: {
          id: string;
          notificationId: string;
          tripId: string;
          status: string;
          totalRecipients: number;
          successCount: number;
          failureCount: number;
          deliveryStartedAt: Date;
          deliveryCompletedAt?: Date | null;
          errorLog?: string | null;
          notification: {
            id: string;
            title: string;
            body: string;
            url?: string | null;
            createdAt: Date;
            tripId?: string;
            createdBy?: {
              id: string;
              firstName?: string | null;
              lastName?: string | null;
              authUserId?: string;
            } | null;
          } | null;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getDeliveryByNotificationId.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getDeliveryByNotificationIdUseCase({
      notificationId: parsed.data.notificationId,
      tripId: parsed.data.tripId,
    }).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, this.repository),
    );

    return await effectToControllerResult(effect, (result) => result.delivery);
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(input: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }): Promise<
    | {
        success: true;
        data: {
          totalDeliveries: number;
          totalRecipients: number;
          totalSuccess: number;
          totalFailures: number;
          avgSuccessPerDelivery: number;
          avgFailuresPerDelivery: number;
          successRate: number;
          statusBreakdown: Record<string, number>;
        };
      }
    | { success: false; error: string }
  > {
    const inputFilters: GetDeliveryStatsInput["filters"] = {
      tripId: input.tripId,
      startDate: input.startDate,
      endDate: input.endDate,
      scheduleId: input.scheduleId,
    };

    const effect = getDeliveryStatsUseCase({
      filters: inputFilters,
    }).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, this.repository),
    );

    return await effectToControllerResult(effect);
  }

  /**
   * Get failed deliveries
   */
  async getFailedDeliveries(input: {
    tripId?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    | {
        success: true;
        data: {
          deliveries: Array<{
            id: string;
            notificationId: string;
            tripId: string;
            status: string;
            totalRecipients: number;
            successCount: number;
            failureCount: number;
            deliveryStartedAt: Date;
            deliveryCompletedAt?: Date | null;
            errorLog?: string | null;
            notification?: {
              id: string;
              title: string;
              body: string;
              createdAt: Date;
              createdBy?: {
                id: string;
                firstName?: string | null;
                lastName?: string | null;
              } | null;
            } | null;
          }>;
          total: number;
          limit: number;
          offset: number;
        };
      }
    | { success: false; error: string }
  > {
    if (!input.tripId) {
      return { success: false, error: "Trip ID is required" };
    }

    const parsed = schemas.getFailedDeliveries.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getFailedDeliveriesUseCase({
      tripId: parsed.data.tripId,
      pagination: {
        limit: parsed.data.limit ?? 20,
        offset: parsed.data.offset ?? 0,
      },
    }).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, this.repository),
    );

    return await effectToControllerResult(
      effect,
      (result: GetFailedDeliveriesOutput) => ({
        deliveries: result.deliveries.map((d: NotificationDelivery) => ({
          id: d.id,
          notificationId: d.notificationId,
          tripId: d.tripId,
          status: d.status,
          totalRecipients: d.totalRecipients,
          successCount: d.successCount,
          failureCount: d.failureCount,
          deliveryStartedAt: d.deliveryStartedAt,
          deliveryCompletedAt: d.deliveryCompletedAt,
          errorLog: d.errorLog,
          notification: d.notification
            ? {
                id: d.notification.id,
                title: d.notification.title,
                body: d.notification.body,
                createdAt: d.notification.createdAt,
                createdBy: d.notification.createdBy,
              }
            : null,
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }),
    );
  }
}
