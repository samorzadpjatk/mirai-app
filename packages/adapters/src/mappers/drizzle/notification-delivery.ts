import type {
  NotificationDelivery,
  DeliveryStatus,
} from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type { notificationDeliveries } from "@mirai-app/frameworks/drizzle/schema";

/**
 * NotificationDeliveryDrizzleMapper
 *
 * Maps between Drizzle database records and NotificationDelivery entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class NotificationDeliveryDrizzleMapper implements DrizzleEntityMapper<
  NotificationDelivery,
  typeof notificationDeliveries.$inferSelect,
  typeof notificationDeliveries.$inferInsert,
  Partial<typeof notificationDeliveries.$inferInsert>
> {
  /**
   * Convert a Drizzle NotificationDelivery record to an entity
   */
  toDomain(
    record: typeof notificationDeliveries.$inferSelect & {
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationCreatedAt?: Date | null;
      createdByFirstName?: string | null;
      createdByLastName?: string | null;
      createdByAuthUserId?: string | null;
    },
  ): NotificationDelivery {
    return {
      id: record.id,
      notificationId: record.notificationId,
      tripId: record.tripId ?? "",
      status: record.status as DeliveryStatus,
      totalRecipients: record.totalRecipients ?? 0,
      successCount: record.successCount ?? 0,
      failureCount: record.failureCount ?? 0,
      deliveryStartedAt: record.deliveryStartedAt ?? record.createdAt,
      deliveryCompletedAt: record.deliveryCompletedAt,
      errorLog: record.errors,
      scheduleId: record.scheduleId,
      notification: record.notificationTitle
        ? {
            id: record.notificationId,
            title: record.notificationTitle,
            body: record.notificationBody ?? "",
            createdAt: record.notificationCreatedAt ?? record.createdAt,
            createdBy: record.createdByFirstName
              ? {
                  id: (record as any).createdById ?? "",
                  firstName: record.createdByFirstName,
                  lastName: record.createdByLastName ?? null,
                  authUserId: record.createdByAuthUserId ?? "",
                }
              : null,
          }
        : null,
    };
  }

  /**
   * Convert a NotificationDelivery entity to Drizzle insert input
   */
  toDrizzleInsert(
    entity: NotificationDelivery,
  ): typeof notificationDeliveries.$inferInsert {
    return {
      id: entity.id,
      notificationId: entity.notificationId,
      tripId: entity.tripId || null,
      status: entity.status,
      totalRecipients: entity.totalRecipients,
      successCount: entity.successCount,
      failureCount: entity.failureCount,
      deliveryStartedAt: entity.deliveryStartedAt,
      deliveryCompletedAt: entity.deliveryCompletedAt ?? null,
      errors: entity.errorLog ?? null,
      scheduleId: entity.scheduleId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert a NotificationDelivery entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: NotificationDelivery,
  ): Partial<typeof notificationDeliveries.$inferInsert> {
    return {
      status: entity.status,
      totalRecipients: entity.totalRecipients,
      successCount: entity.successCount,
      failureCount: entity.failureCount,
      deliveryCompletedAt: entity.deliveryCompletedAt ?? null,
      errors: entity.errorLog ?? null,
      updatedAt: new Date(),
    } as Partial<typeof notificationDeliveries.$inferInsert>;
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof notificationDeliveries.$inferSelect>,
  ): Partial<NotificationDelivery> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.notificationId) partial.notificationId = record.notificationId;
    if (record.tripId !== undefined) partial.tripId = record.tripId ?? "";
    if (record.status) partial.status = record.status;
    if (record.totalRecipients !== undefined)
      partial.totalRecipients = record.totalRecipients;
    if (record.successCount !== undefined)
      partial.successCount = record.successCount;
    if (record.failureCount !== undefined)
      partial.failureCount = record.failureCount;
    return partial as Partial<NotificationDelivery>;
  }

  static readonly instance = new NotificationDeliveryDrizzleMapper();
}
