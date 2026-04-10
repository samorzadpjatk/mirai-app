import type {
  NotificationDelivery,
  DeliveryStatus,
} from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../gateways/BaseDrizzleRepository";
import type { notificationDeliveries } from "@mirai-app/frameworks/drizzle/schema/notificationDelivery";

/**
 * NotificationDeliveryDrizzleMapper
 *
 * Maps between Drizzle database records and NotificationDelivery entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class NotificationDeliveryDrizzleMapper implements DrizzleEntityMapper<
  NotificationDelivery,
  typeof notificationDeliveries.$inferSelect,
  Partial<typeof notificationDeliveries.$inferInsert>,
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
  toDrizzleCreate(
    entity: NotificationDelivery,
  ): Partial<typeof notificationDeliveries.$inferInsert> {
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
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof notificationDeliveries.$inferSelect>,
  ): Partial<NotificationDelivery> {
    return {
      ...(record.id && { id: record.id }),
      ...(record.notificationId && { notificationId: record.notificationId }),
      ...(record.tripId !== undefined && { tripId: record.tripId ?? "" }),
      ...(record.status && { status: record.status as DeliveryStatus }),
      ...(record.totalRecipients !== undefined && {
        totalRecipients: record.totalRecipients,
      }),
      ...(record.successCount !== undefined && {
        successCount: record.successCount,
      }),
      ...(record.failureCount !== undefined && {
        failureCount: record.failureCount,
      }),
    };
  }

  static readonly instance = new NotificationDeliveryDrizzleMapper();
}
