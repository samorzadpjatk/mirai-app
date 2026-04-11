import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { NotificationDeliveryRepository } from "../ports/NotificationDeliveryRepository";

/**
 * Input for GetDeliveryByNotificationId use case
 */
export interface GetDeliveryByNotificationIdInput {
  notificationId: string;
  tripId: string;
}

/**
 * Output for GetDeliveryByNotificationId use case
 */
export interface GetDeliveryByNotificationIdOutput {
  delivery: {
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

/**
 * GetDeliveryByNotificationId Use Case
 *
 * Retrieves a single delivery by notification ID.
 * Verifies that the delivery belongs to the specified trip.
 */
export class GetDeliveryByNotificationIdUseCase {
  constructor(private deliveryRepo: NotificationDeliveryRepository) {}

  async execute(
    input: GetDeliveryByNotificationIdInput,
  ): Promise<Result<GetDeliveryByNotificationIdOutput, string>> {
    try {
      const delivery = await this.deliveryRepo.findByNotificationId(
        input.notificationId,
      );

      if (!delivery || delivery.tripId !== input.tripId) {
        return err("Notification delivery not found");
      }

      return ok({
        delivery: {
          id: delivery.id,
          notificationId: delivery.notificationId,
          tripId: delivery.tripId,
          status: delivery.status,
          totalRecipients: delivery.totalRecipients,
          successCount: delivery.successCount,
          failureCount: delivery.failureCount,
          deliveryStartedAt: delivery.deliveryStartedAt,
          ...(delivery.deliveryCompletedAt !== undefined && {
            deliveryCompletedAt: delivery.deliveryCompletedAt,
          }),
          ...(delivery.errorLog !== undefined && {
            errorLog: delivery.errorLog,
          }),
          notification: delivery.notification ?? null,
        },
      });
    } catch (error) {
      return err(
        `Failed to get delivery: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
