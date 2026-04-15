import { Effect, type Layer } from "effect";
import type { NotificationDelivery } from "@mirai-app/use-cases";
import {
  validateGetDeliveriesInput,
  validateGetDeliveryByNotificationIdInput,
  validateGetDeliveryStatsInput,
  validateGetFailedDeliveriesInput,
} from "./validators/delivery-schema";

export {
  validateGetDeliveriesInput,
  validateGetDeliveryByNotificationIdInput,
  validateGetDeliveryStatsInput,
  validateGetFailedDeliveriesInput,
};

import {
  getDeliveriesUseCase,
  getDeliveryByNotificationIdUseCase,
  getDeliveryStatsUseCase,
  getFailedDeliveriesUseCase,
  type GetDeliveriesInput,
  type GetDeliveriesOutput,
  type GetFailedDeliveriesOutput,
} from "@mirai-app/use-cases";

/**
 * Input validation schemas for notification delivery controller
 */

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * NotificationDeliveryController
 *
 * Handles notification delivery queries and statistics.
 * Delegates to use cases for business logic.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class NotificationDeliveryController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

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
    const parsed = validateGetDeliveriesInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const data = parsed.data;

    const inputFilters: GetDeliveriesInput["filters"] = {
      tripId: data?.tripId,
      status: data?.status,
      scheduleId: data?.scheduleId,
      startDate: data?.startDate,
      endDate: data?.endDate,
    };

    const inputPagination: GetDeliveriesInput["pagination"] = {
      limit: data?.limit ?? 50,
      offset: data?.offset ?? 0,
    };

    const effect = getDeliveriesUseCase({
      filters: inputFilters,
      pagination: inputPagination,
    });

    const result = await runWithLayer(
      effect,
      this.appLayer,
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

    return result as
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
      | { success: false; error: string };
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
    const parsed = validateGetDeliveryByNotificationIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getDeliveryByNotificationIdUseCase({
      notificationId: parsed.data.notificationId,
      tripId: parsed.data.tripId,
    });

    const result = await runWithLayer(
      effect,
      this.appLayer,
      (result) => (result as { delivery: unknown }).delivery,
    );
    return result as
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
      | { success: false; error: string };
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
    const inputFilters: GetDeliveriesInput["filters"] = {
      tripId: input.tripId,
      startDate: input.startDate,
      endDate: input.endDate,
      scheduleId: input.scheduleId,
    };

    const effect = getDeliveryStatsUseCase({
      filters: inputFilters,
    });

    const result = await runWithLayer(effect, this.appLayer);
    return result as
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
      | { success: false; error: string };
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

    const parsed = validateGetFailedDeliveriesInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const data = parsed.data;

    const effect = getFailedDeliveriesUseCase({
      tripId: data?.tripId ?? input.tripId,
      pagination: {
        limit: data?.limit ?? 20,
        offset: data?.offset ?? 0,
      },
    });

    const result = await runWithLayer(
      effect,
      this.appLayer,
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

    return result as
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
      | { success: false; error: string };
  }

  /**
   * Get a delivery by ID
   */
  async getById(input: { id: string }): Promise<
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
          scheduleId?: string | null;
          notification?: {
            id: string;
            title: string;
            body: string;
            createdAt: Date;
          } | null;
        } | null;
      }
    | { success: false; error: string }
  > {
    // Use getDeliveries and filter by ID
    const result = await this.getDeliveries({
      limit: 1000,
    });

    if (!result.success) {
      return result;
    }

    const delivery = result.data.deliveries.find((d) => d.id === input.id);

    return {
      success: true,
      data: delivery || null,
    };
  }
}
