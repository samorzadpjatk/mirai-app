import type { NotificationDelivery, DeliveryStatus } from "@mirai-app/use-cases";

/**
 * Prisma NotificationDelivery record type
 */
type PrismaNotificationDelivery = {
  id: string;
  notificationId: string;
  tripId: string | null;
  status: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  errors: string | null;
  scheduleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  notification?: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    createdBy?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      authUserId: string;
    } | null;
  } | null;
};

/**
 * NotificationDeliveryMapper
 *
 * Maps between Prisma database records and domain NotificationDelivery entities.
 */
export class NotificationDeliveryMapper {
  /**
   * Convert a Prisma NotificationDelivery record to a domain NotificationDelivery
   */
  static toDomain(record: PrismaNotificationDelivery): NotificationDelivery {
    return {
      id: record.id,
      notificationId: record.notificationId,
      tripId: record.tripId ?? "", // Handle nullable tripId
      status: record.status as DeliveryStatus,
      totalRecipients: record.totalRecipients,
      successCount: record.successCount,
      failureCount: record.failureCount,
      deliveryStartedAt: record.deliveryStartedAt,
      deliveryCompletedAt: record.deliveryCompletedAt,
      errorLog: record.errors,
      scheduleId: record.scheduleId,
      notification: record.notification
        ? {
            id: record.notification.id,
            title: record.notification.title,
            body: record.notification.body,
            createdAt: record.notification.createdAt,
            createdBy: record.notification.createdBy
              ? {
                  id: record.notification.createdBy.id,
                  firstName: record.notification.createdBy.firstName,
                  lastName: record.notification.createdBy.lastName,
                  authUserId: record.notification.createdBy.authUserId,
                }
              : null,
          }
        : null,
    };
  }

  /**
   * Convert a domain NotificationDelivery to Prisma create input
   */
  static toPrismaCreate(delivery: NotificationDelivery): {
    id: string;
    notificationId: string;
    tripId: string | null;
    status: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    deliveryStartedAt: Date;
    deliveryCompletedAt: Date | null;
    errors: string | null;
    scheduleId: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: delivery.id,
      notificationId: delivery.notificationId,
      tripId: delivery.tripId || null,
      status: delivery.status,
      totalRecipients: delivery.totalRecipients,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
      deliveryStartedAt: delivery.deliveryStartedAt,
      deliveryCompletedAt: delivery.deliveryCompletedAt ?? null,
      errors: delivery.errorLog ?? null,
      scheduleId: delivery.scheduleId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert a domain NotificationDelivery to Prisma update input
   */
  static toPrismaUpdate(delivery: NotificationDelivery): {
    notificationId?: string;
    tripId?: string | null;
    status?: string;
    totalRecipients?: number;
    successCount?: number;
    failureCount?: number;
    deliveryStartedAt?: Date;
    deliveryCompletedAt?: Date | null;
    errors?: string | null;
    scheduleId?: string | null;
    updatedAt: Date;
  } {
    return {
      notificationId: delivery.notificationId,
      tripId: delivery.tripId || null,
      status: delivery.status,
      totalRecipients: delivery.totalRecipients,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
      deliveryStartedAt: delivery.deliveryStartedAt,
      deliveryCompletedAt: delivery.deliveryCompletedAt ?? null,
      errors: delivery.errorLog ?? null,
      scheduleId: delivery.scheduleId ?? null,
      updatedAt: new Date(),
    };
  }
}
