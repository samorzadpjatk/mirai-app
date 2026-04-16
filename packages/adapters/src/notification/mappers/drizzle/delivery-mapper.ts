import type {
  DeliveryStatus,
  NotificationDeliveryDTO,
} from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import type { notificationDeliveries } from "@mirai-app/frameworks/drizzle/schema";

/**
 * NotificationDeliveryDrizzleMapper
 *
 * Maps between Drizzle database records and NotificationDeliveryDTOs.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class NotificationDeliveryDrizzleMapper implements DrizzleEntityMapper<
  NotificationDeliveryDTO,
  typeof notificationDeliveries.$inferSelect,
  typeof notificationDeliveries.$inferInsert,
  Partial<typeof notificationDeliveries.$inferInsert>
> {
  /**
   * Convert a Drizzle NotificationDelivery record to a DTO
   * This is the primary mapping method for the gateway.
   */
  toDomain(
    record: typeof notificationDeliveries.$inferSelect,
  ): NotificationDeliveryDTO {
    return this.toDTO(record);
  }

  /**
   * Convert a Drizzle NotificationDelivery record to a DTO
   */
  toDTO(
    record: typeof notificationDeliveries.$inferSelect,
  ): NotificationDeliveryDTO {
    return {
      id: record.id,
      notificationId: record.notificationId,
      userId: record.tripId ?? "",
      channel: "push",
      status: record.status,
      sentAt: record.deliveryStartedAt,
      deliveredAt: record.deliveryCompletedAt,
      failedAt: record.status === "failure" ? record.deliveryCompletedAt : null,
      failureReason: record.errors,
      retryCount: 0,
    };
  }

  /**
   * Convert a NotificationDeliveryDTO to Drizzle insert input
   */
  toDrizzleInsert(
    dto: NotificationDeliveryDTO,
  ): typeof notificationDeliveries.$inferInsert {
    return {
      id: dto.id,
      notificationId: dto.notificationId,
      tripId: dto.userId || null,
      status: dto.status as DeliveryStatus,
      totalRecipients: 1,
      successCount: dto.status === "success" ? 1 : 0,
      failureCount: dto.status === "failure" ? 1 : 0,
      deliveryStartedAt: dto.sentAt,
      deliveryCompletedAt: dto.deliveredAt ?? dto.failedAt ?? null,
      errors: dto.failureReason ?? null,
      scheduleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert a NotificationDeliveryDTO to Drizzle update input
   */
  toDrizzleUpdate(
    dto: NotificationDeliveryDTO,
  ): Partial<typeof notificationDeliveries.$inferInsert> {
    return {
      status: dto.status as DeliveryStatus,
      deliveryCompletedAt: dto.deliveredAt ?? dto.failedAt ?? null,
      errors: dto.failureReason,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial DTO from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof notificationDeliveries.$inferSelect>,
  ): Partial<NotificationDeliveryDTO> {
    const partial: Partial<NotificationDeliveryDTO> = {};
    if (record.id) partial.id = record.id;
    if (record.notificationId) partial.notificationId = record.notificationId;
    if (record.tripId !== undefined) partial.userId = record.tripId;
    if (record.status) partial.status = record.status;
    if (record.deliveryStartedAt !== undefined)
      partial.sentAt = record.deliveryStartedAt;
    if (record.deliveryCompletedAt !== undefined)
      partial.deliveredAt = record.deliveryCompletedAt;
    if (record.errors !== undefined)
      partial.failureReason = record.errors as string | null;
    return partial;
  }

  static readonly instance = new NotificationDeliveryDrizzleMapper();
}
