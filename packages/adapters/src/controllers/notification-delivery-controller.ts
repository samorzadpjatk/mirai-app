import { z } from "zod";
import type {
  GetDeliveriesUseCase,
  GetDeliveryByNotificationIdUseCase,
  GetDeliveryStatsUseCase,
  GetFailedDeliveriesUseCase,
} from "@mirai-app/use-cases";

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
  constructor(
    private getDeliveriesUseCase: GetDeliveriesUseCase,
    private getDeliveryByIdUseCase: GetDeliveryByNotificationIdUseCase,
    private getStatsUseCase: GetDeliveryStatsUseCase,
    private getFailedUseCase: GetFailedDeliveriesUseCase,
  ) {}

  get schemas() {
    return schemas;
  }

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
    const result = await this.getDeliveriesUseCase.execute({
      filters: {
        tripId: input.tripId,
        status: input.status,
        scheduleId: input.scheduleId,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      pagination: {
        limit: input.limit ?? 50,
        offset: input.offset ?? 0,
      },
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        deliveries: result.value.deliveries.map((d) => ({
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
        total: result.value.total,
        limit: result.value.limit,
        offset: result.value.offset,
      },
    };
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
    const result = await this.getDeliveryByIdUseCase.execute({
      notificationId: input.notificationId,
      tripId: input.tripId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value.delivery };
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
    const result = await this.getStatsUseCase.execute({
      filters: {
        tripId: input.tripId,
        startDate: input.startDate,
        endDate: input.endDate,
        scheduleId: input.scheduleId,
      },
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const result = await this.getFailedUseCase.execute({
      tripId: input.tripId,
      pagination: {
        limit: input.limit ?? 20,
        offset: input.offset ?? 0,
      },
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        deliveries: result.value.deliveries.map((d) => ({
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
        total: result.value.total,
        limit: result.value.limit,
        offset: result.value.offset,
      },
    };
  }
}
